import type { LogRow } from "../data/log.ts";
import { parseCsv } from "./parse-sheet.ts";

/** Steps the health tab treats as internal work. They stay out of the channel table. */
export const INTERNAL_STEPS = [
  "build_excel",
  "build_qa",
  "cama_harvest",
  "deed_lookup",
  "dm_home_lookup",
  "dm_lookup",
  "excel_export",
  "final_build",
  "gsccca_lookup",
  "listing_lookup",
  "ln_cwp_lookup",
  "name_lookup",
  "owner_research",
  "owner_resolve",
  "skip_trace",
  "sos_lookup",
  "street_view_list_prep",
  "street_view_walk",
  "sv_classify",
  "sv_list",
  "sv_walk",
  "tps_lookup",
  "traffic_assign",
] as const;

const INTERNAL = new Set<string>(INTERNAL_STEPS);

/** The four pairs printed on the health tab, in that order. */
const SHEET_PAIRS: Array<[string, string]> = [
  ["Envoy", "Acquisition Agent"],
  ["Acquisition Agent", "Envoy"],
  ["Envoy", "Daniel"],
  ["Acquisition Agent", "Acquisition Agent"],
];

const PHASE: Record<string, string> = {
  cama_harvest: "Data Acquisition",
  listing_harvest: "Data Acquisition",
  traffic_harvest: "Data Acquisition",
  street_view: "Data Acquisition",
  sv_list: "Data Acquisition",
  dm_lookup: "Direct Mail & Outreach",
  batch_dispatch: "Direct Mail & Outreach",
  intake_request: "Intake & Handshake",
  owner_report: "Executive Oversight",
  qa_envoy: "Quality Assurance",
  rule_change: "Policy & Governance",
  smoke_test: "Pipeline Verification",
  re_verify: "Pipeline Verification",
  status_update: "Telemetry & Monitoring",
  sos_harvest: "Ownership Verification",
  sos_lookup: "Ownership Verification",
  gsccca_harvest: "Ownership Verification",
  gsccca_lookup: "Ownership Verification",
  owner_lookup: "Ownership Verification",
  skip_trace: "Contact Discovery",
  valuation: "Underwriting & Valuation",
  loi_dispatch: "Offer Management",
  contract_review: "Legal & Governance",
  closing_audit: "Closing & Settlement",
};

export type SpanRow = {
  timestamp: string;
  handoffId: string;
  from: string;
  parentStep: string;
  outcome: string;
  notes: string;
  county: string;
};

export type SheetChannel = {
  from: string;
  to: string;
  handoffs: number;
  fails: number;
  passRate: number;
  intervention: number;
  /** True when this pair is on the log and the health tab has no row for it. */
  extra: boolean;
};

export type SpanStep = {
  step: string;
  phase: string;
  executions: number;
  passRate: number;
  avgTokens: "n/a";
  flags: number;
};

export type LogOnlyStep = {
  step: string;
  phase: string;
  rows: number;
};

export type SheetHealth = {
  eventCount: number;
  latest: string;
  latestCounty: string;
  schemaRate: number;
  schemaValid: number;
  autonomyRate: number;
  autoCount: number;
  humanCount: number;
  meanConfidence: number | null;
  confMin: number | null;
  confMax: number | null;
  avgTokens: number | null;
  totalTokens: number;
  tokenRows: number;
  auditRate: number;
  hashCount: number;
  channels: SheetChannel[];
  channelTotal: {
    handoffs: number;
    fails: number;
    passRate: number;
    intervention: number;
  } | null;
  steps: SpanStep[];
  logOnly: LogOnlyStep[];
  spansLoaded: boolean;
  headline: string;
};

function ratio(part: number, total: number): number {
  return total === 0 ? 1 : part / total;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function phaseName(step: string): string {
  if (PHASE[step]) return PHASE[step];
  return step
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function spansFromSheetText(text: string): SpanRow[] {
  const table = parseCsv(text);
  const headerIndex = table.findIndex((row) => row.includes("parent_step") && row.includes("outcome"));
  if (headerIndex < 0) return [];
  const header = table[headerIndex].map((name) => name.trim());
  const index = new Map(header.map((name, i) => [name, i]));
  const cell = (row: string[], name: string) => (row[index.get(name) ?? -1] ?? "").trim();
  return table.slice(headerIndex + 1).flatMap((row) => {
    const parentStep = cell(row, "parent_step");
    const outcome = cell(row, "outcome");
    const timestamp = cell(row, "timestamp");
    if (!parentStep && !outcome && !timestamp) return [];
    return [
      {
        timestamp,
        handoffId: cell(row, "handoff_id"),
        from: cell(row, "from_bot"),
        parentStep,
        outcome: outcome.toLowerCase(),
        notes: cell(row, "notes"),
        county: cell(row, "county_code"),
      },
    ];
  });
}

function sheetStep(row: LogRow): string {
  return row.sheetStep || row.step;
}

function channelOf(rows: LogRow[], from: string, to: string, extra = false): SheetChannel {
  const mine = rows.filter((row) => row.from === from && row.to === to && from !== to && !INTERNAL.has(sheetStep(row)));
  const fails = mine.filter((row) => !row.schemaComplete).length;
  const asked = mine.filter((row) => row.human).length;
  return {
    from,
    to,
    handoffs: mine.length,
    fails,
    passRate: ratio(mine.length - fails, mine.length),
    intervention: mine.length === 0 ? 0 : asked / mine.length,
    extra,
  };
}

function spanSteps(spans: SpanRow[]): SpanStep[] {
  const byStep = new Map<string, SpanRow[]>();
  for (const span of spans) {
    if (!INTERNAL.has(span.parentStep)) continue;
    const bucket = byStep.get(span.parentStep) ?? [];
    bucket.push(span);
    byStep.set(span.parentStep, bucket);
  }
  return [...byStep.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([step, bucket]) => {
      const ids = new Set(bucket.map((span) => span.handoffId).filter(Boolean));
      const passed = bucket.filter((span) => span.outcome === "ok" || span.outcome === "pass").length;
      const flags = bucket.filter((span) => span.outcome === "fail" || span.outcome === "partial").length;
      return {
        step,
        phase: phaseName(step),
        executions: ids.size,
        passRate: ratio(passed, passed + flags),
        avgTokens: "n/a" as const,
        flags,
      };
    });
}

function headline(schemaRate: number, autonomyRate: number, events: number): string {
  if (events === 0) return "The log has no rows.";
  const misses: string[] = [];
  if (schemaRate < 0.9) misses.push("Schema is under 90%.");
  if (autonomyRate < 0.8) misses.push("Autonomy is under 80%.");
  return misses.length > 0 ? misses.join(" ") : "Schema and autonomy are on target.";
}

/** Health-tab formulas, on every log row and the trace spans. */
export function sheetHealth(rows: LogRow[], spans: SpanRow[], spansLoaded = true): SheetHealth {
  const n = rows.length;
  const schemaValid = rows.filter((row) => row.schemaComplete).length;
  const humanCount = rows.filter((row) => row.human === true).length;
  const autoCount = rows.filter((row) => row.human === false).length;
  const confs = rows.flatMap((row) => (row.confidence == null ? [] : [row.confidence]));
  const tokens = rows.flatMap((row) => (row.tokenEst == null ? [] : [row.tokenEst]));
  const hashCount = rows.filter((row) => row.contentHash.trim() !== "").length;
  const latest = [...rows].sort((a, b) => {
    const am = a.iso ? Date.parse(a.iso) : 0;
    const bm = b.iso ? Date.parse(b.iso) : 0;
    return (Number.isNaN(bm) ? 0 : bm) - (Number.isNaN(am) ? 0 : am);
  })[0];
  const schemaRate = n === 0 ? 0 : schemaValid / n;
  const autonomyRate = n === 0 ? 0 : autoCount / n;
  const tokenMean = mean(tokens);
  const confMean = mean(confs);

  const channels = SHEET_PAIRS.map(([from, to]) => channelOf(rows, from, to));
  const seen = new Set(SHEET_PAIRS.map(([from, to]) => `${from}→${to}`));
  const extras = new Map<string, [string, string]>();
  for (const row of rows) {
    if (!row.from || !row.to || row.from === row.to || INTERNAL.has(sheetStep(row))) continue;
    const key = `${row.from}→${row.to}`;
    if (seen.has(key)) continue;
    extras.set(key, [row.from, row.to]);
  }
  const extraChannels = [...extras.values()]
    .sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]))
    .map(([from, to]) => channelOf(rows, from, to, true));
  const listed = [...channels, ...extraChannels];
  const official = channels.filter((channel) => !channel.extra);
  const totalHandoffs = official.reduce((sum, channel) => sum + channel.handoffs, 0);
  const totalFails = official.reduce((sum, channel) => sum + channel.fails, 0);
  const totalAsked = rows.filter(
    (row) =>
      row.from !== row.to &&
      !INTERNAL.has(sheetStep(row)) &&
      SHEET_PAIRS.some(([from, to]) => row.from === from && row.to === to) &&
      row.human,
  ).length;

  const steps = spanSteps(spans);
  const inMatrix = new Set(steps.map((step) => step.step));
  const logCounts = new Map<string, number>();
  for (const row of rows) {
    const name = sheetStep(row);
    if (!name || inMatrix.has(name)) continue;
    logCounts.set(name, (logCounts.get(name) ?? 0) + 1);
  }
  const logOnly = [...logCounts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([step, count]) => ({ step, phase: phaseName(step), rows: count }));

  return {
    eventCount: n,
    latest: latest?.iso ?? latest?.time ?? "",
    latestCounty: latest?.county ?? "",
    schemaRate,
    schemaValid,
    autonomyRate,
    autoCount,
    humanCount,
    meanConfidence: confMean,
    confMin: confs.length ? Math.min(...confs) : null,
    confMax: confs.length ? Math.max(...confs) : null,
    avgTokens: tokenMean == null ? null : Math.round(tokenMean),
    totalTokens: tokens.reduce((sum, value) => sum + value, 0),
    tokenRows: tokens.length,
    auditRate: n === 0 ? 0 : hashCount / n,
    hashCount,
    channels: listed,
    channelTotal:
      n === 0
        ? null
        : {
            handoffs: totalHandoffs,
            fails: totalFails,
            passRate: ratio(totalHandoffs - totalFails, totalHandoffs),
            intervention: totalHandoffs === 0 ? 0 : totalAsked / totalHandoffs,
          },
    steps,
    logOnly,
    spansLoaded,
    headline: headline(schemaRate, autonomyRate, n),
  };
}

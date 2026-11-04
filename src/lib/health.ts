import { PIPELINE_STEPS, type LogRow } from "../data/log.ts";

export type Channel = {
  from: string;
  to: string;
  handoffs: number;
  fails: number;
  passRate: number;
  intervention: number;
};

export type StepStat = {
  step: string;
  label: string;
  phase: string;
  executions: number;
  passRate: number;
  avgTokens: number | null;
  flags: number;
};

export type Health = {
  eventCount: number;
  latest: string;
  county: string;
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
  auditRate: number;
  hashCount: number;
  channels: Channel[];
  steps: StepStat[];
};

/** Schema, autonomy, confidence, and audit go red under these rates. Tokens have no budget. */
export const TARGETS = {
  schema: 0.9,
  autonomy: 0.8,
  confidence: 0.8,
  audit: 0.9,
} as const;

const PHASE: Record<string, string> = {
  intake_request: "Intake",
  rule_change: "Rules",
  cama_harvest: "Harvest",
  listing_lookup: "Listing",
  traffic_assign: "Traffic",
  sv_classify: "Street View",
  owner_resolve: "Owner",
  deed_lookup: "Deed",
  sale_select: "Sale",
  dm_lookup: "Deal Machine",
  tps_lookup: "People",
  ln_cwp_lookup: "Phones",
  merge_decision: "Who prints",
  build: "Excel",
  qa_auto: "Checks",
  qa_envoy: "Review",
  send: "Delivery",
  status_update: "Status",
  owner_report: "Note",
  smoke_test: "Test",
};

const LABELS = new Map(PIPELINE_STEPS.map((step) => [step.id, step.label]));

function ratio(part: number, total: number): number {
  return total === 0 ? 0 : part / total;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stampMs(row: LogRow): number {
  if (!row.iso) return 0;
  const ms = Date.parse(row.iso);
  return Number.isNaN(ms) ? 0 : ms;
}

export function computeHealth(rows: LogRow[]): Health {
  const empty: Health = {
    eventCount: 0,
    latest: "",
    county: "No county",
    schemaRate: 0,
    schemaValid: 0,
    autonomyRate: 0,
    autoCount: 0,
    humanCount: 0,
    meanConfidence: null,
    confMin: null,
    confMax: null,
    avgTokens: null,
    totalTokens: 0,
    auditRate: 0,
    hashCount: 0,
    channels: [],
    steps: [],
  };
  if (rows.length === 0) return empty;

  const n = rows.length;
  const schemaValid = rows.filter((row) => row.schemaComplete).length;
  const humanCount = rows.filter((row) => row.human).length;
  const confs = rows.flatMap((row) => (row.confidence == null ? [] : [row.confidence]));
  const tokens = rows.flatMap((row) => (row.tokenEst == null ? [] : [row.tokenEst]));
  const hashCount = rows.filter((row) => row.contentHash.trim() !== "").length;
  const counties = [...new Set(rows.map((row) => row.county).filter(Boolean))];
  const latest = [...rows].sort((a, b) => stampMs(b) - stampMs(a) || b.time.localeCompare(a.time))[0];

  const channelMap = new Map<string, Channel>();
  for (const row of rows) {
    const from = row.from || "(none)";
    const to = row.to || "(none)";
    const key = `${from}→${to}`;
    const existing = channelMap.get(key) ?? {
      from,
      to,
      handoffs: 0,
      fails: 0,
      passRate: 0,
      intervention: 0,
    };
    existing.handoffs += 1;
    if (!row.schemaComplete) existing.fails += 1;
    if (row.human) existing.intervention += 1;
    channelMap.set(key, existing);
  }
  const channels = [...channelMap.values()]
    .map((channel) => ({
      ...channel,
      passRate: ratio(channel.handoffs - channel.fails, channel.handoffs),
      intervention: ratio(channel.intervention, channel.handoffs),
    }))
    .sort((a, b) => b.handoffs - a.handoffs || a.from.localeCompare(b.from));

  const stepMap = new Map<string, LogRow[]>();
  for (const row of rows) {
    const bucket = stepMap.get(row.step) ?? [];
    bucket.push(row);
    stepMap.set(row.step, bucket);
  }
  const steps = [...stepMap.entries()]
    .map(([step, bucket]) => {
      const stepTokens = bucket.flatMap((row) => (row.tokenEst == null ? [] : [row.tokenEst]));
      const flags = bucket.filter((row) => /flag/i.test(row.critic)).length;
      const passes = bucket.filter((row) => row.schemaComplete).length;
      const tokenMean = mean(stepTokens);
      return {
        step,
        label: LABELS.get(step) ?? step,
        phase: PHASE[step] ?? "Other",
        executions: bucket.length,
        passRate: ratio(passes, bucket.length),
        avgTokens: tokenMean == null ? null : Math.round(tokenMean),
        flags,
      };
    })
    .sort((a, b) => a.passRate - b.passRate || b.flags - a.flags || a.label.localeCompare(b.label));

  const tokenMean = mean(tokens);
  const confMean = mean(confs);

  return {
    eventCount: n,
    latest: latest?.time ?? "",
    county: counties.length === 0 ? "No county" : counties.length === 1 ? counties[0] : `${counties.length} counties`,
    schemaRate: ratio(schemaValid, n),
    schemaValid,
    autonomyRate: ratio(n - humanCount, n),
    autoCount: n - humanCount,
    humanCount,
    meanConfidence: confMean,
    confMin: confs.length ? Math.min(...confs) : null,
    confMax: confs.length ? Math.max(...confs) : null,
    avgTokens: tokenMean == null ? null : Math.round(tokenMean),
    totalTokens: tokens.reduce((sum, value) => sum + value, 0),
    auditRate: ratio(hashCount, n),
    hashCount,
    channels,
    steps,
  };
}

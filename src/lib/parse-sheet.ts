import { PIPELINE_STEPS, type LogRow } from "../data/log.ts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Work the Clayton run actually walks, in order. Notes and smoke tests are not stages. */
export const RUN_STAGES = [
  "intake_request",
  "cama_harvest",
  "listing_lookup",
  "traffic_assign",
  "sv_classify",
  "owner_resolve",
  "deed_lookup",
  "sale_select",
  "dm_lookup",
  "tps_lookup",
  "ln_cwp_lookup",
  "merge_decision",
  "build",
  "qa_auto",
  "qa_envoy",
  "send",
] as const;

function scrubNote(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[withheld]")
    .replace(/\b(daniel|jonathan)\b/gi, "[withheld]")
    .replace(/\S+/g, (chunk) => (chunk.replace(/\D/g, "").length >= 10 ? "[withheld]" : chunk));
}

export function displayTime(iso: string): string {
  const match = iso.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return iso;
  const day = Number(match[3]);
  const month = MONTHS[Number(match[2]) - 1] ?? match[2];
  return `${day} ${month}, ${match[4]}:${match[5]}`;
}

export function clockMs(iso: string): number {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
}

function num(value: string): number | null {
  const text = value.trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function bool(value: string): boolean {
  return value.trim().toUpperCase() === "TRUE";
}

/** Blank stays unknown. Only an exact FALSE is a no. */
function boolFalse(value: string): boolean | null {
  const text = value.trim().toUpperCase();
  if (text === "TRUE") return true;
  if (text === "FALSE") return false;
  return null;
}

/** Sheet step names that are the same stage under another id. */
const STEP_ALIAS: Record<string, string> = {
  street_view_list_prep: "sv_classify",
  street_view: "sv_classify",
};

function canonicalStep(step: string): string {
  return STEP_ALIAS[step] ?? step;
}

/** RFC 4180. Handles quotes, commas, and newlines inside cells. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") cell += char;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((item) => item.some((value) => value.trim() !== ""));
}

export function rowsFromSheetText(text: string): LogRow[] {
  const table = parseCsv(text);
  const headerIndex = table.findIndex((row) => row[0]?.trim() === "timestamp" && row.includes("handoff_id"));
  if (headerIndex < 0) return [];
  const header = table[headerIndex].map((name) => name.trim());
  const index = new Map(header.map((name, i) => [name, i]));
  const cell = (row: string[], name: string) => (row[index.get(name) ?? -1] ?? "").trim();

  const parsed = table.slice(headerIndex + 1).flatMap((row) => {
    const stamp = cell(row, "timestamp");
    const handoffId = cell(row, "handoff_id");
    const from = cell(row, "from_bot");
    if (!stamp || !handoffId) return [];
    const time = displayTime(stamp);
    return [
      {
        id: `${handoffId} · ${stamp} · ${from || "unknown"}`,
        handoffId,
        time,
        from,
        to: cell(row, "to_bot"),
        step: canonicalStep(cell(row, "step_type")),
        sheetStep: cell(row, "step_type"),
        county: cell(row, "county_code"),
        schemaComplete: bool(cell(row, "schema_complete")),
        confidence: num(cell(row, "confidence")),
        cascade: cell(row, "cascade_flags") || "none",
        critic: cell(row, "critic_result"),
        hash: cell(row, "constraint_hash"),
        contentHash: cell(row, "content_hash"),
        human: boolFalse(cell(row, "human_intervention")),
        reverify: cell(row, "re_verify_result"),
        notes: cell(row, "outcome_notes"),
        sources: cell(row, "sources_refs"),
        rejected: cell(row, "rejected_approaches"),
        tokenEst: num(cell(row, "token_est")),
        latencyMs: num(cell(row, "latency_ms")),
        iso: stamp,
        loggedRunId: cell(row, "run_id"),
      },
    ];
  });
  return carryCounty(parsed);
}

export type RunStageState = "waiting" | "done" | "now";

export type RunProgress = {
  title: string;
  county: string;
  done: number;
  total: number;
  nowLabel: string;
  nowNote: string;
  stages: { id: string; label: string; state: RunStageState }[];
};

function isActiveRun(row: LogRow): boolean {
  return row.county === "CLAYTON-GA" && /clayton-(rerun|e2e)/i.test(row.handoffId);
}

function isOneOff(row: LogRow): boolean {
  const id = row.handoffId.toLowerCase();
  return row.step === "smoke_test" || row.step === "owner_report" || /smoke|recon|dashboard-review/.test(id);
}

function countyFromRunId(id: string): string {
  const match = id.match(/^(.*)-\d{4}-\d{2}-\d{2}(?:-|$)/);
  const county = match?.[1] ?? "";
  return /^[A-Z]+-[A-Z]{2}$/.test(county) ? county : "";
}

function dayOf(row: LogRow): string {
  return (row.iso ?? "").slice(0, 10);
}

/** A county job, not a smoke test or a note. */
function isCountyWork(row: LogRow): boolean {
  if (!row.county || isOneOff(row)) return false;
  const slug = row.county.split("-")[0].toLowerCase();
  const id = row.handoffId.toLowerCase();
  return id.includes(slug) || countyFromRunId(row.loggedRunId ?? "") === row.county;
}

function isSmokeRow(row: LogRow): boolean {
  return row.step === "smoke_test" || row.county === "TEST";
}

/** Drop smoke tests when real rows exist. A smoke-only sheet stays visible and is not live. */
export function liveFeed(rows: LogRow[]): { live: boolean; rows: LogRow[] } {
  const production = rows.filter((row) => !isSmokeRow(row));
  if (production.length === 0) return { live: false, rows };
  return { live: true, rows: production };
}

function carryCounty(rows: LogRow[]): LogRow[] {
  const byRun = new Map<string, string>();
  for (const row of rows) {
    if (row.loggedRunId && row.county) byRun.set(row.loggedRunId, row.county);
    else if (row.loggedRunId && !byRun.has(row.loggedRunId)) {
      const fromId = countyFromRunId(row.loggedRunId);
      if (fromId) byRun.set(row.loggedRunId, fromId);
    }
  }
  return rows.map((row) => {
    if (row.county || !row.loggedRunId) return row;
    const county = byRun.get(row.loggedRunId) ?? "";
    return county ? { ...row, county } : row;
  });
}

/** One county run is one id, even when each step has its own handoff id. */
export function runId(rows: LogRow[], row: LogRow): string {
  if (row.loggedRunId) return row.loggedRunId;
  if (row.county && dayOf(row) && isCountyWork(row)) {
    const ids = new Set(
      rows
        .filter((other) => other.county === row.county && dayOf(other) === dayOf(row) && other.loggedRunId && isCountyWork(other))
        .map((other) => other.loggedRunId as string),
    );
    if (ids.size === 1) return [...ids][0];
    return `${row.county}:${dayOf(row)}`;
  }
  return row.handoffId || row.id;
}

export type RunStart = { id: string; label: string };

/** First timestamp of each run, once. Later steps of that run are not listed. */
export function runStarts(rows: LogRow[]): RunStart[] {
  const first = new Map<string, { ms: number; label: string; county: string }>();
  for (const row of rows) {
    const id = runId(rows, row);
    const ms = clockMs(row.iso ?? "");
    const prev = first.get(id);
    if (!prev || (ms > 0 && ms < prev.ms)) first.set(id, { ms, label: row.time, county: row.county });
  }
  const starts = [...first.entries()]
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => a.ms - b.ms);
  const used = new Map<string, number>();
  for (const start of starts) used.set(start.label, (used.get(start.label) ?? 0) + 1);
  return starts.map((start) => ({
    id: start.id,
    label: (used.get(start.label) ?? 0) > 1 && start.county ? `${start.label} · ${start.county}` : start.label,
  }));
}

/** Runs that belong to the selected county. `all` keeps every run. */
export function runsForCounty(rows: LogRow[], county: string): RunStart[] {
  const scoped = county === "all" ? rows : rows.filter((row) => row.county === county);
  return runStarts(scoped);
}

/**
 * Keep an explicit time only when that run is in the current list.
 * Otherwise use the preferred run (the Clayton re-run on All counties),
 * then the newest run in the list.
 */
export function activeRunId(starts: RunStart[], time: string, preferId: string | null): string {
  if (time === "all") return "all";
  if (starts.some((start) => start.id === time)) return time;
  if (preferId && starts.some((start) => start.id === preferId)) return preferId;
  return starts.at(-1)?.id ?? "all";
}

export function rowRunLabel(rows: LogRow[], row: LogRow): string {
  const id = runId(rows, row);
  return runStarts(rows).find((start) => start.id === id)?.label ?? row.time;
}

function placeName(code: string): string {
  const head = code.split("-")[0] ?? code;
  if (!head) return "Run";
  return head.charAt(0).toUpperCase() + head.slice(1).toLowerCase();
}

function buildProgress(run: LogRow[], title: string, county: string): RunProgress {
  const labels = new Map(PIPELINE_STEPS.map((step) => [step.id, step.label]));
  const logged = new Set(run.map((row) => row.step));
  const work = run.filter((row) => (RUN_STAGES as readonly string[]).includes(row.step));
  const latestWork = [...work].sort((a, b) => clockMs(a.iso ?? "") - clockMs(b.iso ?? ""))[work.length - 1];
  const latest = [...run].sort((a, b) => clockMs(a.iso ?? "") - clockMs(b.iso ?? ""))[run.length - 1];
  const nowId = latestWork?.step ?? latest.step;
  const stages = RUN_STAGES.map((id) => {
    const state: RunStageState = id === nowId ? "now" : logged.has(id) ? "done" : "waiting";
    return { id, label: labels.get(id) ?? id, state };
  });
  const noteSource = latest?.notes?.trim() || latestWork?.notes?.trim() || "Logged. Waiting on the next step.";
  return {
    title,
    county,
    done: stages.filter((stage) => stage.state !== "waiting").length,
    total: stages.length,
    nowLabel: labels.get(nowId) ?? nowId,
    nowNote: scrubNote(noteSource),
    stages,
  };
}

export function runProgress(rows: LogRow[]): RunProgress | null {
  const clayton = rows.filter(isActiveRun);
  if (clayton.length > 0) return buildProgress(clayton, "Clayton re-run", "Clayton");
  const codes = [...new Set(rows.map((row) => row.county).filter(Boolean))];
  if (codes.length !== 1) return null;
  const hasWork = rows.some((row) => (RUN_STAGES as readonly string[]).includes(row.step));
  if (!hasWork) return null;
  const name = placeName(codes[0]);
  return buildProgress(rows, `${name} run`, name);
}

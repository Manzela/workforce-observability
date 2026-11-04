import { LOG, PIPELINE_STEPS, type LogRow, type Status } from "../data/log.ts";

export function publicText(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[withheld]")
    .replace(/\b(daniel|jonathan)\b/gi, "[withheld]")
    .replace(/\S+/g, (chunk) => (chunk.replace(/\D/g, "").length >= 10 ? "[withheld]" : chunk));
}

function isStop(cascade: string): boolean {
  const value = cascade.trim().toLowerCase();
  return value !== "" && value !== "none" && value !== "n/a";
}

/** A re-check failed. A PASS line that merely names a failures file does not count. */
export function recheckFailed(text: string): boolean {
  const verdict = text.trim();
  if (!verdict || /^n\/a\b/i.test(verdict) || /^pass\b/i.test(verdict)) return false;
  return /\b(fail|failed|mismatch)\b/i.test(verdict);
}

/** A cascade note is a stop when it says the work is unfinished. A passed row with a side note is only a caveat. */
export function cascadeWeight(row: Pick<LogRow, "cascade" | "critic">): "stop" | "caveat" | "none" {
  if (!isStop(row.cascade)) return "none";
  const unfinished = /\b(partial|incomplete|blocked|stopped|open)\b|rate limit/i.test(row.cascade);
  if (/^(pass|accepted)\b/i.test(row.critic.trim()) && !unfinished) return "caveat";
  return "stop";
}

export function rowStatus(row: LogRow): Status {
  const weight = cascadeWeight(row);
  const failed = recheckFailed(row.reverify);
  if (!row.schemaComplete || weight === "stop" || failed) return "wrong";
  const flagged = /flag/i.test(row.critic);
  if (weight === "caveat" || row.human || flagged || row.confidence === null || row.confidence < 0.8) return "look";
  return "clear";
}

export function reason(row: LogRow): string | null {
  if (rowStatus(row) === "clear") return null;
  const flag = row.critic.replace(/^flag:\s*/i, "").trim();
  if (/flag/i.test(row.critic) && flag) {
    return publicText(flag.charAt(0).toUpperCase() + flag.slice(1));
  }
  if (recheckFailed(row.reverify)) return "A re-check did not match.";
  if (cascadeWeight(row) === "stop") return "This handoff was stopped.";
  if (cascadeWeight(row) === "caveat") return "A caveat was logged.";
  if (row.human) return "A person was asked.";
  if (!row.schemaComplete) return "The record was incomplete.";
  if (row.confidence === null) return "Confidence is missing.";
  return "Confidence is low.";
}

export function worst(list: Status[]): Status {
  if (list.includes("wrong")) return "wrong";
  if (list.includes("look")) return "look";
  return "clear";
}

function whatHappened(row: LogRow): string {
  const status = rowStatus(row);
  if (status === "clear") {
    if (row.reverify.trim() && !/^n\/a\b/i.test(row.reverify.trim())) {
      return "The latest row is complete, and the re-check matched.";
    }
    return "The latest row is complete.";
  }
  if (!row.schemaComplete) return "The latest row is incomplete, so this step isn't done.";
  if (cascadeWeight(row) === "stop") return "The latest row was stopped.";
  if (cascadeWeight(row) === "caveat") return "The latest row logged a caveat.";
  if (recheckFailed(row.reverify)) return "The latest row failed its re-check.";
  if (/flag/i.test(row.critic)) {
    const flag = row.critic
      .replace(/^pass with flags:\s*/i, "")
      .replace(/^flag:\s*/i, "")
      .trim()
      .replace(/[.]+$/, "");
    return flag ? `The latest row has a flag: ${publicText(flag)}.` : "The latest row has a flag.";
  }
  if (row.human) return "A person had to be asked before this could continue.";
  if (row.confidence === null) return "Confidence is missing on the latest row.";
  if (row.confidence < 0.8) return `Confidence on the latest row is ${row.confidence}.`;
  return "The latest row needs a look.";
}

type StepDef = { id: string; label: string; job: string };

function sourceText(row: LogRow): string | null {
  const text = publicText(row.sources).trim();
  return text || null;
}

export function stepTip(step: StepDef, rows: LogRow[]) {
  const mine = rows.filter((row) => row.step === step.id);
  if (mine.length === 0) return `${step.job} Nothing is logged here yet.`;
  const latest = latestRow(mine);
  const earlier = mine.some((row) => row.id !== latest.id && rank(rowStatus(row)) > rank(rowStatus(latest)));
  const tail = earlier ? " An earlier try in this step was worse." : "";
  const sources = sourceText(latest);
  const sourceLine = sources ? ` Sources: ${sources}.` : "";
  return `${publicText(`${step.job} ${whatHappened(latest)}${tail}`)}${sourceLine}`;
}

function rowMs(row: LogRow): number {
  const ms = row.iso ? Date.parse(row.iso) : 0;
  return Number.isNaN(ms) ? 0 : ms;
}

function latestRow(rows: LogRow[]): LogRow {
  return rows.reduce((best, row) => (rowMs(row) >= rowMs(best) ? row : best));
}

function rank(status: Status): number {
  if (status === "wrong") return 2;
  if (status === "look") return 1;
  return 0;
}

function cover(step: StepDef, rows: LogRow[]) {
  const mine = rows.filter((row) => row.step === step.id);
  if (mine.length === 0) {
    return {
      id: step.id,
      label: step.label,
      status: null as Status | null,
      reason: null as string | null,
      sources: null as string | null,
      traceIds: [] as string[],
      tip: stepTip(step, rows),
    };
  }
  const latest = latestRow(mine);
  const status = rowStatus(latest);
  const earlier = mine.filter((row) => row.id !== latest.id && rank(rowStatus(row)) > rank(status));
  const current = reason(latest);
  const reasonText = earlier.length
    ? [current, "An earlier try in this step was worse."].filter(Boolean).join(" ")
    : current;
  return {
    id: step.id,
    label: step.label,
    status,
    reason: reasonText,
    sources: sourceText(latest),
    traceIds: [latest.id, ...earlier.map((row) => row.id)],
    tip: stepTip(step, rows),
  };
}

export function stepCoverage(rows: LogRow[]) {
  const known = new Set(PIPELINE_STEPS.map((step) => step.id));
  const unknown = [...new Set(rows.map((row) => row.step).filter((step) => step && !known.has(step)))].sort();
  return [
    ...PIPELINE_STEPS.map((step) => cover(step, rows)),
    ...unknown.map((id) =>
      cover(
        {
          id,
          label: `Other · ${id}`,
          job: "This name is outside the pipeline list, so it stays under Other and does not move the progress bar.",
        },
        rows,
      ),
    ),
  ];
}

export function counties(rows: LogRow[]): string[] {
  return [...new Set(rows.map((row) => row.county).filter(Boolean))].sort();
}

export function times(rows: LogRow[]): string[] {
  return [...new Set(rows.map((row) => row.time))];
}

export const SNAPSHOT_ROWS = LOG;

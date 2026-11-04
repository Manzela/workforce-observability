import { LOG, PIPELINE_STEPS, type LogRow, type Status } from "@/data/log";

export function publicText(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[withheld]")
    .replace(/\b(daniel|jonathan)\b/gi, "[withheld]")
    .replace(/\S+/g, (chunk) => (chunk.replace(/\D/g, "").length >= 10 ? "[withheld]" : chunk));
}

export function rowStatus(row: LogRow): Status {
  const stopped = row.cascade !== "none" && row.cascade !== "";
  const failed = /fail|mismatch/i.test(row.reverify);
  if (!row.schemaComplete || stopped || failed) return "wrong";
  const flagged = /flag/i.test(row.critic);
  if (row.human || flagged || row.confidence === null || row.confidence < 0.8) return "look";
  return "clear";
}

export function reason(row: LogRow): string | null {
  if (rowStatus(row) === "clear") return null;
  const flag = row.critic.replace(/^flag:\s*/i, "").trim();
  if (/flag/i.test(row.critic) && flag) {
    return publicText(flag.charAt(0).toUpperCase() + flag.slice(1));
  }
  if (/fail|mismatch/i.test(row.reverify)) return "A re-check did not match.";
  if (row.cascade !== "none" && row.cascade !== "") return "This handoff was stopped.";
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
  if (row.cascade !== "none" && row.cascade !== "") return "The latest row was stopped.";
  if (/fail|mismatch/i.test(row.reverify)) return "The latest row failed its re-check.";
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

export function stepTip(step: (typeof PIPELINE_STEPS)[number], rows: LogRow[]) {
  const mine = rows.filter((row) => row.step === step.id);
  if (mine.length === 0) return `${step.job} Nothing is logged here yet.`;
  const latest = latestRow(mine);
  const earlier = mine.some((row) => row.id !== latest.id && rank(rowStatus(row)) > rank(rowStatus(latest)));
  const tail = earlier ? " An earlier try in this step was worse." : "";
  return publicText(`${step.job} ${whatHappened(latest)}${tail}`);
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

export function stepCoverage(rows: LogRow[]) {
  return PIPELINE_STEPS.map((step) => {
    const mine = rows.filter((row) => row.step === step.id);
    if (mine.length === 0) {
      return {
        id: step.id,
        label: step.label,
        status: null,
        reason: null,
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
      traceIds: [latest.id, ...earlier.map((row) => row.id)],
      tip: stepTip(step, rows),
    };
  });
}

export function counties(rows: LogRow[]): string[] {
  return [...new Set(rows.map((row) => row.county).filter(Boolean))].sort();
}

export function times(rows: LogRow[]): string[] {
  return [...new Set(rows.map((row) => row.time))];
}

export const SNAPSHOT_ROWS = LOG;

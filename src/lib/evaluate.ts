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

function checkLine(row: LogRow): string {
  const bits: string[] = [];
  bits.push(row.schemaComplete ? "The record is complete." : "The record is incomplete.");
  if (!row.reverify.trim()) {
    bits.push("No fact was re-checked.");
  } else if (/^n\/a\b/i.test(row.reverify.trim())) {
    bits.push("This was not a re-check.");
  } else {
    const text = publicText(row.reverify).replace(/[.]+$/, "");
    if (/fail|mismatch/i.test(row.reverify)) bits.push(`Re-check failed: ${text}.`);
    else bits.push(`Re-check matched: ${text}.`);
  }
  if (/flag/i.test(row.critic)) {
    const flag = row.critic.replace(/^flag:\s*/i, "").trim();
    const sentence = flag.charAt(0).toUpperCase() + flag.slice(1);
    bits.push(`Flag: ${publicText(sentence)}.`);
  }
  if (row.cascade !== "none" && row.cascade !== "") bits.push("The handoff was stopped.");
  if (row.human) bits.push("A person was asked.");
  if (row.confidence === null) bits.push("Confidence is missing.");
  else if (row.confidence < 0.8) bits.push(`Confidence is ${row.confidence}.`);
  return bits.join(" ");
}

export function stepTip(step: (typeof PIPELINE_STEPS)[number], rows: LogRow[]) {
  const mine = rows.filter((row) => row.step === step.id);
  if (mine.length === 0) {
    return publicText(
      `${step.job} Nothing is logged here, so it was not checked. A real row records: ${step.checks}`,
    );
  }
  const status = worst(mine.map(rowStatus));
  const sources = mine.filter((row) => rowStatus(row) === status);
  const others = mine.length - sources.length;
  const lines = [...new Set(sources.map(checkLine))];
  const where = uniqueCounty(sources);
  const count = `${sources.length} ${sources.length === 1 ? "row" : "rows"}${where ? `, ${where}` : ""}.`;
  const other =
    others === 0
      ? ""
      : ` ${others} other ${others === 1 ? "row is" : "rows are"} in better shape and did not set this status.`;
  const detail =
    lines.length === 1
      ? `${count} ${lines[0]} Cite ${sources.map((row) => row.id).join(", ")}.`
      : sources.map((row) => `${row.id}. ${checkLine(row)}`).join(" ");
  return publicText(`${step.job} ${detail}${other}`);
}

function uniqueCounty(rows: LogRow[]): string {
  const names = [...new Set(rows.map((row) => row.county).filter(Boolean))];
  return names.length === 1 ? names[0] : "";
}

export function stepCoverage(rows: LogRow[]) {
  return PIPELINE_STEPS.map((step) => {
    const mine = rows.filter((row) => row.step === step.id);
    const status = mine.length === 0 ? null : worst(mine.map(rowStatus));
    const sources = status === null ? [] : mine.filter((row) => rowStatus(row) === status);
    const flagged = sources.find((row) => reason(row));
    return {
      id: step.id,
      label: step.label,
      status,
      reason: flagged ? reason(flagged) : null,
      traceIds: sources.map((row) => row.id),
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

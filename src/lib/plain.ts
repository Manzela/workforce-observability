import { PIPELINE_STEPS, type LogRow, type Status } from "../data/log.ts";
import { cascadeWeight, publicText, recheckFailed, rowStatus } from "./evaluate.ts";

export type StepExplain = {
  summary: string;
  where: string;
  debug: string[];
};

const FAILED: Record<string, string> = {
  intake_request: "The county request failed.",
  rule_change: "The rule change failed.",
  cama_harvest: "The parcel cut failed.",
  listing_lookup: "The listing lookup failed.",
  traffic_assign: "The road count failed.",
  sv_classify: "The Street View mark failed.",
  owner_resolve: "The owner lookup failed.",
  deed_lookup: "The deed lookup failed.",
  sale_select: "Choosing the sale failed.",
  dm_lookup: "Reading the property card failed.",
  tps_lookup: "The person search failed.",
  ln_cwp_lookup: "The listing phone step failed.",
  merge_decision: "Choosing who prints failed.",
  build: "The workbook build failed.",
  qa_auto: "The automatic check failed.",
  qa_envoy: "Envoy review failed.",
  send: "Sending the file failed.",
  status_update: "The status note failed.",
  owner_report: "The note failed.",
  incident: "The incident log failed.",
  gsccca_lookup: "The GSCCCA lookup failed.",
  owner_research: "The owner research failed.",
  sos_lookup: "The secretary of state lookup failed.",
};

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

/** Emails and personal names only. Hashes and trace ids stay so a debug log can be checked. */
export function debugText(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[withheld]")
    .replace(/\b(daniel|jonathan)\b/gi, "[withheld]");
}

function keepSentence(part: string): boolean {
  const words = part.split(/\s+/).filter((word) => /[A-Za-z]{3,}/.test(word));
  if (words.length >= 2) return true;
  if (words.length === 1 && words[0].length >= 6 && part.length <= 40) return true;
  return words.length >= 1 && /\d/.test(part);
}

function workNote(notes: string): string | null {
  const cleaned = notes
    .replace(/\S*\/\S*/g, (token) => {
      const tail = token.match(/[.,;:!?)]+$/)?.[0] ?? "";
      const core = token.slice(0, token.length - tail.length);
      if (/^[A-Z]{2,}\/[A-Z]{2,}$/.test(core) || /^\d+\/\d+$/.test(core)) return token;
      const path =
        core.startsWith("/") ||
        core.includes("/workspace") ||
        /\/[a-z]/.test(core) ||
        /\.(jsonl|json|py|csv|txt|md|xlsx|geojson)\b/i.test(core);
      return path ? tail || " " : token;
    })
    .replace(/\b[\w.-]+\.(jsonl|json|py|csv|txt|md|xlsx|geojson)\b/gi, " ")
    .replace(/\b(content_hash|constraint_hash)\b/gi, " ")
    .replace(/\b[0-9a-f]{12,}\b/gi, " ")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/\b(with|and|or|from|of|the|a|an),\s+/gi, "$1 ")
    .trim();
  if (!cleaned) return null;
  const kept: string[] = [];
  for (const part of cleaned.split(/(?<=[.!?])\s+/)) {
    const sentence = part.trim();
    if (!keepSentence(sentence)) continue;
    const next = [...kept, sentence].join(" ");
    if (next.length > 180) {
      if (kept.length > 0) break;
      let slice = sentence.slice(0, 170);
      const space = slice.lastIndexOf(" ");
      if (space > 24) slice = slice.slice(0, space);
      kept.push(`${slice.replace(/[,:;]\s*$/, "")}…`);
      break;
    }
    kept.push(sentence);
    if (next.length > 140) break;
  }
  if (kept.length === 0) return null;
  const out = publicText(kept.join(" "));
  return /[.!?]$/.test(out) ? out : `${out}.`;
}

function trimNum(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

function whyLine(row: LogRow): string | null {
  if (rowStatus(row) === "clear") return null;
  const bits: string[] = [];
  if (recheckFailed(row.reverify)) bits.push("The re-check did not match.");
  if (!row.schemaComplete) bits.push("The record arrived incomplete.");
  const weight = cascadeWeight(row);
  if (weight === "stop") {
    const pathLike = /(^|[\s:])\/[\w.-]/.test(row.cascade) || /\.(json|csv|py|txt|md)\b/i.test(row.cascade);
    const clean = pathLike ? null : workNote(row.cascade);
    bits.push(clean && clean.length <= 120 ? `It stopped here: ${clean.replace(/\.$/, "")}.` : "The handoff was stopped.");
  }
  if (weight === "caveat") {
    const clean = workNote(row.cascade);
    bits.push(clean ? `A caveat was logged: ${clean.replace(/\.$/, "")}.` : "A caveat was logged.");
  }
  if (bits.length > 0) return bits.join(" ");
  if (/flag/i.test(row.critic)) {
    const flag = row.critic
      .replace(/^pass with flags:\s*/i, "")
      .replace(/^flag:\s*/i, "")
      .trim();
    const clean = workNote(flag);
    if (clean && clean.length <= 120) return `A check flagged this: ${clean.replace(/\.$/, "")}.`;
    return "A check raised a flag.";
  }
  if (row.human) return "A person had to be asked.";
  if (row.confidence === null) return "Confidence is missing.";
  if (row.confidence < 0.8) return `Confidence is ${trimNum(row.confidence)}, under 0.8.`;
  return null;
}

function norm(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function joinUnique(parts: Array<string | null | undefined>): string {
  const kept: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    const key = norm(part);
    if (!key) continue;
    if (kept.some((item) => {
      const have = norm(item);
      return have === key || have.includes(key) || key.includes(have);
    })) continue;
    kept.push(part);
  }
  return kept.join(" ");
}

function whereOf(row: LogRow): string {
  const hop = [row.from, row.to].filter(Boolean).join(" → ");
  return [row.county, row.time, hop].filter(Boolean).join(" · ");
}

function debugBlock(row: LogRow, heading: string | null): string[] {
  const lines: string[] = [];
  if (heading) lines.push(heading);
  const add = (name: string, value: string) => {
    const text = debugText(value).trim();
    if (text) lines.push(`${name}: ${text}`);
  };
  add("Sources", row.sources);
  add("Note", row.notes);
  add("Re-check", row.reverify);
  add("Critic", row.critic);
  if (cascadeWeight(row) === "stop") add("Stop flag", row.cascade);
  else if (cascadeWeight(row) === "caveat") add("Caveat", row.cascade);
  add("Content hash", row.contentHash);
  add("Constraint hash", row.hash);
  if (row.tokenEst != null) add("Token estimate", String(row.tokenEst));
  if (row.latencyMs != null) add("Latency ms", String(row.latencyMs));
  const rejected = row.rejected.trim();
  if (rejected && !/^(0|none|n\/a)$/i.test(rejected)) add("Rejected", rejected);
  add("Trace", row.id);
  return lines;
}

/** Plain sentence for one step, plus the raw log behind the debug icon. */
export function explainStep(rows: LogRow[], stepId: string, inProgress = false): StepExplain {
  const mine = rows.filter((row) => row.step === stepId);
  if (mine.length === 0) {
    return { summary: "Nothing is logged here yet.", where: "", debug: [] };
  }
  const latest = latestRow(mine);
  const status = rowStatus(latest);
  const earlier = mine.filter((row) => row.id !== latest.id && rank(rowStatus(row)) > rank(status));
  const failed = FAILED[stepId] ?? "This step failed.";
  const hardFail = recheckFailed(latest.reverify) || cascadeWeight(latest) === "stop";
  let note = workNote(latest.notes);
  const why = whyLine(latest);
  if (why && note && note.length < 28) note = null;
  if (!note && status !== "wrong") {
    const prior = [...mine]
      .filter((row) => row.id !== latest.id)
      .sort((a, b) => rowMs(b) - rowMs(a))
      .map((row) => workNote(row.notes))
      .find(Boolean);
    if (prior) note = `The latest row has no detail. Before that: ${prior}`;
  }
  const loggedOnly = "This step was logged. The sheet doesn't say what finished.";

  let summary: string;
  if (inProgress && status === "wrong") {
    summary = joinUnique([
      hardFail ? "Still on this step, and it failed." : "Still on this step, and the record is incomplete.",
      why ?? (hardFail ? failed : null),
      note,
    ]);
  }
  else if (inProgress && status === "look") summary = joinUnique(["Still on this step.", why ?? "It needs a look.", note]);
  else if (inProgress) summary = joinUnique(["Still on this step.", note ?? "The sheet doesn't say what finished."]);
  else if (status === "wrong") summary = joinUnique([hardFail ? failed : null, why, note]);
  else if (status === "look") summary = joinUnique([note ?? "This step needs a look.", why]);
  else summary = joinUnique([note ?? loggedOnly]);
  if (earlier.length > 0) summary = joinUnique([summary, "An earlier try was worse."]);

  const debug = [
    ...debugBlock(latest, earlier.length > 0 ? "Latest" : null),
    ...earlier.flatMap((row) => debugBlock(row, "Earlier try")),
  ];
  const known = PIPELINE_STEPS.some((step) => step.id === stepId);
  if (!known) debug.unshift("This step is outside the pipeline list. It does not move the progress bar.");
  return { summary, where: whereOf(latest), debug };
}

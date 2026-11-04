import { ABSENT_COLUMNS, type LogRow, type Status } from "../data/log.ts";

export function scrubText(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[withheld]")
    .replace(/\b(daniel|jonathan)\b/gi, "[withheld]")
    .replace(/\S+/g, (chunk) => (chunk.replace(/\D/g, "").length >= 10 ? "[withheld]" : chunk));
}

export type Backup = { ids: string[] } | null;

export type MetricView = {
  id: string;
  label: string;
  figure: string;
  status: Status | null;
  word: string;
  result: string;
  tip: string;
  traceIds: string[];
};

function of(part: number, total: number): string {
  return `${part} of ${total}`;
}

function isStop(cascade: string): boolean {
  const value = cascade.trim().toLowerCase();
  return value !== "" && value !== "none" && value !== "n/a";
}

function reverifyKind(value: string): "empty" | "na" | "mismatch" | "checked" {
  const text = value.trim();
  if (!text) return "empty";
  if (/^n\/a\b/i.test(text)) return "na";
  if (/fail|mismatch/i.test(text)) return "mismatch";
  return "checked";
}

function noteHash(notes: string): string | null {
  const match = notes.match(/content_hash\s+([0-9a-f]{12})\b/i);
  return match ? match[1].toLowerCase() : null;
}

function noteClaimsRecheck(notes: string): boolean {
  return /re-verif/i.test(notes);
}

function middle(values: number[]): string {
  if (values.length === 0) return "no numbers";
  const sorted = [...values].sort((a, b) => a - b);
  if (values.length % 2 === 1) return `median ${sorted[(values.length - 1) / 2]}`;
  return `middle ${sorted[values.length / 2 - 1]} and ${sorted[values.length / 2]}`;
}

function headlineNumber(values: number[]): string {
  if (values.length === 0) return "—";
  const sorted = [...values].sort((a, b) => a - b);
  if (values.length % 2 === 1) return String(sorted[(values.length - 1) / 2]);
  return `${sorted[values.length / 2 - 1]}–${sorted[values.length / 2]}`;
}

function blank(rows: LogRow[], result: string, tip: string): MetricView[] {
  const none = "No rows in this filter.";
  return [
    card("schema", "Schema completeness", "—", null, "Not measured", none, tip, []),
    card("reverify", "Re-check", "—", null, "Not measured", none, tip, []),
    card("hash", "Hash match", "—", null, "Not measured", none, tip, []),
    card("human", "Person asked", "—", null, "Not measured", none, tip, []),
    card("cascade", "Stops", "—", null, "Not measured", none, tip, []),
    card("backup", "Sheet and backup", "—", result === "backup" ? "wrong" : null, "Wrong", none, tip, []),
    card("size", "Size and time", "—", null, "Estimate", none, tip, []),
    card("confidence", "Confidence", "—", null, "Not measured", none, tip, []),
  ];
}

function card(
  id: string,
  label: string,
  figure: string,
  status: Status | null,
  word: string,
  result: string,
  tip: string,
  traceIds: string[],
): MetricView {
  return {
    id,
    label,
    figure,
    status,
    word,
    result: scrubText(result),
    tip: scrubText(tip),
    traceIds,
  };
}

export function metricBoard(rows: LogRow[], backup: Backup): MetricView[] {
  if (rows.length === 0) {
    return blank(rows, backup === null ? "backup" : "", "Nothing in this filter to count.");
  }

  const n = rows.length;
  const marked = rows.filter((row) => row.schemaComplete).length;
  const rate = marked / n;
  const schemaStatus: Status = rate < 0.95 || ABSENT_COLUMNS.length > 0 ? (rate < 0.95 ? "wrong" : "look") : "clear";
  const schema = card(
    "schema",
    "Schema completeness",
    of(marked, n),
    schemaStatus,
    schemaStatus === "clear" ? "Clear" : schemaStatus === "wrong" ? "Wrong" : "Look",
    `${of(marked, n)} are marked complete. ${ABSENT_COLUMNS.join(" and ")} are not columns on this sheet, so they were not counted.`,
    "How many rows arrived complete. Under 95%, a later step is leaning on a hole. This sheet doesn't store the claim text, so complete isn't proof the claim arrived.",
    rows.filter((row) => !row.schemaComplete).map((row) => row.id),
  );

  const kinds = rows.map((row) => ({ row, kind: reverifyKind(row.reverify) }));
  const checked = kinds.filter((item) => item.kind === "checked");
  const empty = kinds.filter((item) => item.kind === "empty");
  const na = kinds.filter((item) => item.kind === "na");
  const mismatch = kinds.filter((item) => item.kind === "mismatch");
  const split = rows.filter((row) => noteClaimsRecheck(row.notes) && reverifyKind(row.reverify) === "empty");
  const reverifyStatus: Status = mismatch.length > 0 ? "wrong" : empty.length > 0 || split.length > 0 ? "look" : "clear";
  const reverify = card(
    "reverify",
    "Re-check",
    of(checked.length, n),
    reverifyStatus,
    reverifyStatus === "clear" ? "Clear" : reverifyStatus === "wrong" ? "Wrong" : "Look",
    `${of(checked.length, n)} ${checked.length === 1 ? "names" : "name"} a result. ${na.length} ${na.length === 1 ? "says" : "say"} not applicable. ${empty.length} ${empty.length === 1 ? "is" : "are"} empty. ${mismatch.length} ${mismatch.length === 1 ? "says" : "say"} mismatch. ${split.length} ${split.length === 1 ? "note claims" : "notes claim"} a re-check while the cell is empty.`,
    "How many rows say a named fact was checked again. An empty cell means it wasn't, even if the note says it was.",
    [...new Set([...mismatch, ...empty, ...split.map((row) => ({ row }))].map((item) => item.row.id))],
  );

  const withContent = rows.filter((row) => row.contentHash.trim() !== "");
  const withConstraint = rows.filter((row) => row.hash.trim() !== "");
  const compared = rows.flatMap((row) => {
    const named = noteHash(row.notes);
    if (!named) return [];
    return [{ row, named, cell: row.contentHash.trim().toLowerCase() }];
  });
  const agreed = compared.filter((item) => item.cell !== "" && item.cell === item.named);
  const disagreed = compared.filter((item) => item.cell !== "" && item.cell !== item.named);
  const namedOnly = compared.filter((item) => item.cell === "");
  const hash = card(
    "hash",
    "Hash match",
    `${agreed.length} agree`,
    "look",
    "Look",
    `${of(withContent.length, n)} have a content hash. ${of(withConstraint.length, n)} have a constraint hash. ${agreed.length} notes match their content-hash cell. ${namedOnly.length} ${namedOnly.length === 1 ? "note names" : "notes name"} a hash the cell does not have. ${disagreed.length} ${disagreed.length === 1 ? "cell disagrees" : "cells disagree"} with the note. No second computed hash is stored, so the rest cannot be matched.`,
    "How many notes repeat the same hash as the cell. The sheet stores one hash, not a second copy, so most rows can't be matched.",
    [...namedOnly, ...disagreed].map((item) => item.row.id),
  );

  const asked = rows.filter((row) => row.human);
  const human = card(
    "human",
    "Person asked",
    of(asked.length, n),
    asked.length > 0 ? "look" : "clear",
    asked.length > 0 ? "Look" : "Clear",
    `${of(asked.length, n)} asked a person. This sheet has one day, so a spike cannot be seen.`,
    "How often a row waited for a person. A high number means the bots weren't sure.",
    asked.map((row) => row.id),
  );

  const stopped = rows.filter((row) => isStop(row.cascade) || !row.schemaComplete);
  const criticFlags = rows.filter((row) => /flag/i.test(row.critic));
  const cascade = card(
    "cascade",
    "Stops",
    String(stopped.length),
    stopped.length > 0 ? "look" : "clear",
    stopped.length > 0 ? "Look" : "Clear",
    `${stopped.length} ${stopped.length === 1 ? "stop" : "stops"}. ${criticFlags.length} critic ${criticFlags.length === 1 ? "flag is" : "flags are"} not counted as a stop.`,
    "Rows the gate held: a stop, or a row marked incomplete. A critic flag is a warning, not a stop.",
    [...new Set([...stopped, ...criticFlags].map((row) => row.id))],
  );

  let backupCard: MetricView;
  if (backup === null) {
    backupCard = card(
      "backup",
      "Sheet and backup",
      "Not compared",
      "wrong",
      "Wrong",
      "The backup file is not in this workspace. These rows were not compared.",
      "The same row should be in the sheet and the backup. The backup isn't here, so a missed write wouldn't show.",
      [],
    );
  } else {
    const sheetIds = new Set(rows.map((row) => row.id));
    const backupIds = new Set(backup.ids);
    const missing = [...sheetIds].filter((id) => !backupIds.has(id));
    const extra = [...backupIds].filter((id) => !sheetIds.has(id));
    const same = missing.length === 0 && extra.length === 0;
    backupCard = card(
      "backup",
      "Sheet and backup",
      same ? of(sheetIds.size, sheetIds.size) : "Differs",
      same ? "clear" : "wrong",
      same ? "Clear" : "Wrong",
      same
        ? `${sheetIds.size} row ids match the backup.`
        : `${missing.length} sheet ${missing.length === 1 ? "row is" : "rows are"} missing from the backup. ${extra.length} backup ${extra.length === 1 ? "row is" : "rows are"} not in this filter.`,
      "The same row id should be in the sheet and the backup. Matching counts isn't enough.",
      missing,
    );
  }

  const tokens = rows.flatMap((row) => (row.tokenEst === null ? [] : [row.tokenEst]));
  const times = rows.flatMap((row) => (row.latencyMs === null ? [] : [row.latencyMs]));
  const tokenBlank = n - tokens.length;
  const timeBlank = n - times.length;
  const tokenSpan = tokens.length === 0 ? "no token numbers" : `${Math.min(...tokens)}–${Math.max(...tokens)}, ${middle(tokens)}`;
  const timeSpan = times.length === 0 ? "no time numbers" : `${Math.min(...times)}–${Math.max(...times)} ms, ${middle(times)}`;
  const size = card(
    "size",
    "Size and time",
    headlineNumber(tokens),
    null,
    "Estimate",
    `Estimate. Tokens ${tokenSpan}. Time ${timeSpan}. ${tokenBlank} token ${tokenBlank === 1 ? "cell is" : "cells are"} blank. ${timeBlank} time ${timeBlank === 1 ? "cell is" : "cells are"} blank. A blank is not zero.`,
    "Rough size and wait. Tokens are a guess from the text, and a blank cell is not zero. Use this to spot a jump, not to price the work.",
    rows.filter((row) => row.tokenEst === null || row.latencyMs === null).map((row) => row.id),
  );

  const confidences = rows.flatMap((row) => (row.confidence === null ? [] : [row.confidence]));
  const missingConfidence = rows.filter((row) => row.confidence === null);
  const numericRejected = rows.filter((row) => /^\d+$/.test(row.rejected.trim()));
  const wordRejected = rows.filter((row) => row.rejected.trim() !== "" && !/^\d+$/.test(row.rejected.trim()));
  const blankRejected = rows.filter((row) => row.rejected.trim() === "");
  const low = rows.filter((row) => row.confidence !== null && row.confidence < 0.8);
  const confidenceStatus: Status =
    missingConfidence.length > 0 || wordRejected.length > 0 || blankRejected.length > 0 || low.length > 0
      ? "look"
      : "clear";
  const words = [...new Set(wordRejected.map((row) => row.rejected.trim()))];
  const lowScore = confidences.length === 0 ? null : Math.min(...confidences);
  const highScore = confidences.length === 0 ? null : Math.max(...confidences);
  const confidenceFigure =
    lowScore === null || highScore === null ? "—" : lowScore === highScore ? String(lowScore) : `${lowScore}–${highScore}`;
  const lowText =
    lowScore === null || highScore === null
      ? "No confidence numbers."
      : lowScore === highScore
        ? `Confidence ${lowScore}.`
        : `Confidence ${lowScore}–${highScore}.`;
  const discarded = numericRejected.reduce((sum, row) => sum + Number(row.rejected), 0);
  const wordBit =
    words.length === 0
      ? "No row uses a word in place of a count."
      : `${wordRejected.length} ${wordRejected.length === 1 ? "row uses" : "rows use"} ${words.join(", ")} instead of a count.`;
  const confidence = card(
    "confidence",
    "Confidence",
    confidenceFigure,
    confidenceStatus,
    confidenceStatus === "clear" ? "Clear" : "Look",
    `${lowText} ${numericRejected.length} rows give a count of discarded approaches, totaling ${discarded}. ${wordBit} ${blankRejected.length} ${blankRejected.length === 1 ? "is" : "are"} blank. A word is not zero.`,
    "The sender's own score, from 0 to 1, and how many approaches it says it dropped. A word like none is not a count.",
    [...missingConfidence, ...wordRejected, ...blankRejected, ...low].map((row) => row.id),
  );

  return [schema, reverify, hash, human, cascade, backupCard, size, confidence];
}

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
    "This is the share of rows marked schema_complete. A complete block is what a later check leans on. Below 95% the mark itself is failing. This sheet has no critical_claims or canonical_constraint column, so a true mark is not proof those fields arrived.",
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
    "This is whether the receiver wrote a re-check of a named fact, and whether that cell says it matched. A perfect schema still lets a wrong number through if this cell is empty. A note that claims a re-check does not count unless the cell is filled.",
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
    "This should be the share of rows whose content hash equals the hash of the rules and claims the sender used. The sheet stores one content hash and one constraint hash. They are not the same thing, so they are not compared to each other. A hash named only in the notes does not fill the cell.",
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
    "This is how often a row waited for a person before it continued. A high rate means the bots were unsure. One day cannot show a spike.",
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
    "A stop is a cascade flag other than none, or a row marked schema_complete false. Those are the handoffs the gate held. A critic flag is a warning, not a stop, and it is counted apart so it is not hidden.",
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
      "Each row should exist in the sheet and in the backup file. The backup is the copy that survives a failed sheet write. The file was not here, so a missing or different row would go unseen.",
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
      "The same row id should be in the sheet copy and the backup. Equal counts are not enough. The ids have to be the same ids.",
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
    "token_est is about a quarter of the characters. latency_ms is the logged wait. The platform does not give exact tokens, so these stay estimates. They are here to notice a jump, not to price the work.",
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
    "Confidence is the sender's own 0–1 score. Rejected approaches is how many paths it says it already dropped. A word such as none is not a number, so it is not treated as zero. Low confidence, or a count that is not a count, is the early warning.",
    [...missingConfidence, ...wordRejected, ...blankRejected, ...low].map((row) => row.id),
  );

  return [schema, reverify, hash, human, cascade, backupCard, size, confidence];
}

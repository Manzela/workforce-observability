import { createServerFn } from "@tanstack/react-start";
import { liveFeed, rowsFromSheetText } from "@/lib/parse-sheet.ts";
import { spansFromSheetText, type SpanRow } from "@/lib/sheet-health.ts";
import type { LogRow } from "@/data/log.ts";

const SHEET_ID = "1v29s_KuYX-eNUnmFSjuZK_sWE2mqAPq7_FIiYjLUCS4";
/** Log tab. The gviz CSV drops boolean TRUE cells; this export keeps them. */
const LOG_GID = "1292550318";
/** trace_spans. The health tab's step matrix counts these rows. */
const SPAN_GID = "935387427";

export type LiveLog = {
  live: boolean;
  pending: boolean;
  error: string | null;
  readAt: string | null;
  /** Production rows. Smoke tests are dropped once real work exists. */
  rows: LogRow[];
  /** Every log row, including smoke tests. The health tab counts these. */
  counted: LogRow[];
  spans: SpanRow[];
  spansOk: boolean;
};

function empty(error: string, pending = false): LiveLog {
  return { live: false, pending, error, readAt: null, rows: [], counted: [], spans: [], spansOk: false };
}

function sheetText(data: unknown): string {
  if (typeof data === "string") return data;
  if (data && typeof data === "object" && "content" in data && typeof data.content === "string") {
    return data.content;
  }
  return "";
}

async function publicCsv(gid: string, marker: string): Promise<string | null> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const response = await fetch(url, { cache: "no-store", headers: { "cache-control": "no-cache" } });
  if (!response.ok) return null;
  const text = await response.text();
  if (!text.includes(marker) || !text.includes("timestamp")) return null;
  return text;
}

function pack(rows: LogRow[], spans: SpanRow[], spansOk: boolean): LiveLog {
  const feed = liveFeed(rows);
  if (feed.rows.length === 0) return empty("Sheet came back empty");
  return {
    live: feed.live,
    pending: false,
    error: null,
    readAt: new Date().toISOString(),
    rows: feed.rows,
    counted: rows,
    spans,
    spansOk,
  };
}

export const pullLiveLog = createServerFn({ method: "POST" }).handler(async (): Promise<LiveLog> => {
  let spans: SpanRow[] = [];
  let spansOk = false;
  try {
    const [csv, spanText] = await Promise.all([publicCsv(LOG_GID, "handoff_id"), publicCsv(SPAN_GID, "parent_step")]);
    spans = spanText ? spansFromSheetText(spanText) : [];
    spansOk = spanText != null;
    if (csv) {
      const rows = rowsFromSheetText(csv);
      if (rows.length > 0) return pack(rows, spans, spansOk);
    }
  } catch {
    // Fall through to the connector read.
  }

  try {
    const { callTool } = await import("@/lib/app-data/client.server");
    const { ConnectorType } = await import("@/lib/app-data/types");
    const result = await callTool(
      "google_drive_read_file",
      { file_id: SHEET_ID, max_chars: 250000 },
      { connectorType: ConnectorType.GoogleDrive },
    );
    if (!result.ok) return empty(result.errorMessage ?? "Sheet read failed", result.pending === true);
    const rows = rowsFromSheetText(sheetText(result.data));
    if (rows.length === 0) return empty("Sheet came back empty");
    return pack(rows, spans, spansOk);
  } catch (error) {
    return empty(error instanceof Error ? error.message : "Sheet read failed");
  }
});

import { createServerFn } from "@tanstack/react-start";
import { liveFeed, rowsFromSheetText } from "@/lib/parse-sheet.ts";
import type { LogRow } from "@/data/log.ts";

const SHEET_ID = "1v29s_KuYX-eNUnmFSjuZK_sWE2mqAPq7_FIiYjLUCS4";
/** Log tab. The gviz CSV drops boolean TRUE cells; this export keeps them. */
const LOG_GID = "1292550318";
const PUBLIC_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${LOG_GID}`;

export type LiveLog = {
  live: boolean;
  pending: boolean;
  error: string | null;
  readAt: string | null;
  rows: LogRow[];
};

function sheetText(data: unknown): string {
  if (typeof data === "string") return data;
  if (data && typeof data === "object" && "content" in data && typeof data.content === "string") {
    return data.content;
  }
  return "";
}

async function publicLogCsv(): Promise<string | null> {
  const response = await fetch(PUBLIC_CSV, { cache: "no-store", headers: { "cache-control": "no-cache" } });
  if (!response.ok) return null;
  const text = await response.text();
  if (!text.includes("handoff_id") || !text.includes("timestamp")) return null;
  return text;
}

function pack(rows: LogRow[]): LiveLog {
  const feed = liveFeed(rows);
  if (feed.rows.length === 0) {
    return { live: false, pending: false, error: "Sheet came back empty", readAt: null, rows: [] };
  }
  return {
    live: feed.live,
    pending: false,
    error: null,
    readAt: new Date().toISOString(),
    rows: feed.rows,
  };
}

export const pullLiveLog = createServerFn({ method: "POST" }).handler(async (): Promise<LiveLog> => {
  try {
    const csv = await publicLogCsv();
    if (csv) {
      const rows = rowsFromSheetText(csv);
      if (rows.length > 0) return pack(rows);
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
    if (!result.ok) {
      return {
        live: false,
        pending: result.pending === true,
        error: result.errorMessage ?? "Sheet read failed",
        readAt: null,
        rows: [],
      };
    }
    const rows = rowsFromSheetText(sheetText(result.data));
    if (rows.length === 0) {
      return { live: false, pending: false, error: "Sheet came back empty", readAt: null, rows: [] };
    }
    return pack(rows);
  } catch (error) {
    return {
      live: false,
      pending: false,
      error: error instanceof Error ? error.message : "Sheet read failed",
      readAt: null,
      rows: [],
    };
  }
});

export type Status = "clear" | "look" | "wrong";

export type LogRow = {
  id: string;
  handoffId: string;
  time: string;
  from: string;
  to: string;
  step: string;
  county: string;
  schemaComplete: boolean;
  confidence: number | null;
  cascade: string;
  critic: string;
  hash: string;
  contentHash: string;
  human: boolean;
  reverify: string;
  notes: string;
  sources: string;
  rejected: string;
  tokenEst: number | null;
  latencyMs: number | null;
};

/** Columns present on Envoy_Acquisition_Observability_Log when copied on 2 Nov 2026. */
export const SHEET_COLUMNS = [
  "timestamp",
  "handoff_id",
  "from_bot",
  "to_bot",
  "step_type",
  "schema_complete",
  "confidence",
  "sources_refs",
  "rejected_approaches",
  "token_est",
  "latency_ms",
  "cascade_flags",
  "critic_result",
  "constraint_hash",
  "outcome_notes",
  "human_intervention",
  "re_verify_result",
  "content_hash",
  "county_code",
] as const;

/** Named by the metric and absent from that sheet header. */
export const ABSENT_COLUMNS = ["critical_claims", "canonical_constraint"] as const;

export const SHEET_COPY = {
  readAt: "2 Nov, 15:35",
  rows: 7,
  live: false,
} as const;

const SHEET_ID = "1v29s_KuYX-eNUnmFSjuZK_sWE2mqAPq7_FIiYjLUCS4";
const SHEET_NAME = "Envoy_Acquisition_Observability_Log";
export const LIVE_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

/** Cell-for-cell copy of the sheet. Not a live feed. Used as fallback. */
export const LOG: LogRow[] = [
  // ... (keep the existing 7 rows exactly as they were for fallback)
  {
    id: "smoke-test-2026-11-02 · 13:13:31 · Envoy",
    handoffId: "smoke-test-2026-11-02",
    time: "2 Nov, 13:13",
    from: "Envoy",
    to: "Acquisition Agent",
    step: "smoke_test",
    county: "",
    schemaComplete: true,
    confidence: 1,
    cascade: "none",
    critic: "n/a (test)",
    hash: "61f372e97a11",
    contentHash: "",
    human: false,
    reverify: "",
    notes: "Smoke test of the logging pipeline only; no message sent to the Acquisition Agent",
    sources: "t412u",
    rejected: "0",
    tokenEst: 0,
    latencyMs: 0,
  },
  // (truncated in this sketch; full original rows remain in the committed file)
];

export async function fetchLiveRows(): Promise<{ rows: LogRow[]; fetchedAt: string; live: boolean }> {
  try {
    const res = await fetch(LIVE_CSV_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const rows = parseCsvToLogRows(text);
    return { rows, fetchedAt: new Date().toISOString(), live: true };
  } catch (err) {
    console.warn("Live Sheet fetch failed, falling back to static snapshot", err);
    return { rows: LOG, fetchedAt: SHEET_COPY.readAt, live: false };
  }
}

function parseCsvToLogRows(csv: string): LogRow[] {
  // Simple CSV parse for the known columns. Production should use a proper parser.
  const lines = csv.trim().split("\n").slice(1); // skip header
  return lines
    .map((line) => {
      const cols = line.split(",").map((c) => c.replace(/^"|"$/g, ""));
      if (cols.length < 19) return null;
      return {
        id: `${cols[1]} · ${cols[0]} · ${cols[2]}`,
        handoffId: cols[1] || "",
        time: cols[0] || "",
        from: cols[2] || "",
        to: cols[3] || "",
        step: cols[4] || "",
        county: cols[18] || "",
        schemaComplete: cols[5]?.toUpperCase() === "TRUE",
        confidence: cols[6] ? Number(cols[6]) : null,
        cascade: cols[11] || "",
        critic: cols[12] || "",
        hash: cols[13] || "",
        contentHash: cols[17] || "",
        human: cols[15]?.toUpperCase() === "TRUE",
        reverify: cols[16] || "",
        notes: cols[14] || "",
        sources: cols[7] || "",
        rejected: cols[8] || "",
        tokenEst: cols[9] ? Number(cols[9]) : null,
        latencyMs: cols[10] ? Number(cols[10]) : null,
      } as LogRow;
    })
    .filter((r): r is LogRow => r !== null);
}

export const PIPELINE_STEPS: { id: string; label: string; job: string; checks: string }[] = [
  // (keep existing PIPELINE_STEPS unchanged)
];

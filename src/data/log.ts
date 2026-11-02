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

/** Cell-for-cell copy of the sheet. Not a live feed. */
export const LOG: LogRow[] = [
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
  {
    id: "smoke-test-2026-11-02 · 13:13:43 · Acquisition Agent",
    handoffId: "smoke-test-2026-11-02",
    time: "2 Nov, 13:13",
    from: "Acquisition Agent",
    to: "Envoy",
    step: "smoke_test",
    county: "",
    schemaComplete: true,
    confidence: 1,
    cascade: "none",
    critic: "pass",
    hash: "aca0ca1fa35a",
    contentHash: "",
    human: false,
    reverify: "",
    notes: "Observability logging smoke test from Acquisition Agent; no real handoff",
    sources: "none (smoke test)",
    rejected: "none",
    tokenEst: 0,
    latencyMs: 0,
  },
  {
    id: "upgrade-smoke-2026-11-02 · 14:20:06 · Acquisition Agent",
    handoffId: "upgrade-smoke-2026-11-02",
    time: "2 Nov, 14:20",
    from: "Acquisition Agent",
    to: "Envoy",
    step: "smoke_test",
    county: "",
    schemaComplete: true,
    confidence: 1,
    cascade: "none",
    critic: "pass",
    hash: "6cc3ddcd7359",
    contentHash: "",
    human: false,
    reverify: "",
    notes:
      "Upgraded smoke test (schema 1.1); content_hash b8578ddf2e53; critical claim (rev4 sha256) re-verified: match; full block in /workspace/observability/backup.jsonl",
    sources: "/workspace/clayton-2026-10-28/clayton-2026-10-30-final-rev4.xlsx",
    rejected: "none",
    tokenEst: 406,
    latencyMs: 0,
  },
  {
    id: "upgrade-smoke-2026-11-02 · 14:20:18 · Envoy",
    handoffId: "upgrade-smoke-2026-11-02",
    time: "2 Nov, 14:20",
    from: "Envoy",
    to: "Acquisition Agent",
    step: "smoke_test",
    county: "",
    schemaComplete: true,
    confidence: 1,
    cascade: "none",
    critic: "n/a (test)",
    hash: "61f372e97a11",
    contentHash: "8df9628f531a",
    human: false,
    reverify: "clayton_md5 PASS; constraints_hash PASS",
    notes: "Upgraded smoke test; content_hash 8df9628f531a; no message sent to the Acquisition Agent",
    sources: "t413u; /workspace/clayton-2026-10-28/clayton-2026-10-30-final-rev4.xlsx; constraints-v1.txt",
    rejected: "0",
    tokenEst: 432,
    latencyMs: 0,
  },
  {
    id: "workflow-recon-2026-11-02 · 14:31:45 · Envoy",
    handoffId: "workflow-recon-2026-11-02",
    time: "2 Nov, 14:31",
    from: "Envoy",
    to: "",
    step: "owner_report",
    county: "",
    schemaComplete: true,
    confidence: 0.85,
    cascade: "none",
    critic: "n/a",
    hash: "61f372e97a11",
    contentHash: "",
    human: false,
    reverify: "n/a (no AA handoff)",
    notes: "End-to-end workflow reconstruction (15 steps + proposed step_type taxonomy); no AA message",
    sources: "t414u",
    rejected: "0",
    tokenEst: 1900,
    latencyMs: 0,
  },
  {
    id: "dm-smoke-clayton-2026-11-02 · 14:53:12 · Acquisition Agent",
    handoffId: "dm-smoke-clayton-2026-11-02",
    time: "2 Nov, 14:53",
    from: "Acquisition Agent",
    to: "Envoy",
    step: "dm_lookup",
    county: "CLAYTON-GA",
    schemaComplete: true,
    confidence: 1,
    cascade: "none",
    critic: "pass",
    hash: "98c914d0b38a",
    contentHash: "67675399c0f0",
    human: false,
    reverify: "dm-batch-09.jsonl line count (17) PASS",
    notes:
      "Scoped smoke test v1.2; content_hash 67675399c0f0; claim re-verified against same step_type+county source: match",
    sources: "/workspace/clayton-2026-10-28/dm/dm-batch-09.jsonl",
    rejected: "none",
    tokenEst: 356,
    latencyMs: 0,
  },
  {
    id: "scope-smoke-qa_envoy-CLAYTON-GA-2026-11-02 · 14:53:27 · Envoy",
    handoffId: "scope-smoke-qa_envoy-CLAYTON-GA-2026-11-02",
    time: "2 Nov, 14:53",
    from: "Envoy",
    to: "Acquisition Agent",
    step: "qa_envoy",
    county: "CLAYTON-GA",
    schemaComplete: true,
    confidence: 1,
    cascade: "none",
    critic: "flag: rev4 QA lacked owner checks",
    hash: "61f372e97a11",
    contentHash: "06bc62c0b933",
    human: false,
    reverify:
      "clayton-2026-10-30-final-rev4.xlsx PASS; changed-rows-rev4.csv PASS; changed-cells-rev4.csv PASS; envoy-qa-2026-10-30.md PASS",
    notes: "Scoped smoke test (smoke=true); threshold_version constraints-v1; no message sent to the Acquisition Agent",
    sources: "t415u; clayton-2026-10-30-final-rev4.xlsx; changed-rows-rev4.csv; changed-cells-rev4.csv; envoy-qa-2026-10-30.md",
    rejected: "1",
    tokenEst: 666,
    latencyMs: 1,
  },
];

export const PIPELINE_STEPS: { id: string; label: string; job: string; checks: string }[] = [
  {
    id: "intake_request",
    label: "County request",
    job: "The county and its rules are written down before any work starts.",
    checks: "The county, the rules that were relayed, and that an approval was recorded.",
  },
  {
    id: "rule_change",
    label: "Rule change",
    job: "A rule is added or replaced, and the source of that rule is named.",
    checks: "The lesson, what it replaces, and whether it was applied to files already sent.",
  },
  {
    id: "cama_harvest",
    label: "Property harvest",
    job: "The county parcel list is cut down to centers worth working.",
    checks: "The source file, the parcel and center counts, and why parcels were left out.",
  },
  {
    id: "listing_lookup",
    label: "Listing lookup",
    job: "A center name is taken from a saved listing page.",
    checks: "The page used, whether it loaded, and the name that was taken.",
  },
  {
    id: "traffic_assign",
    label: "Traffic",
    job: "The road count in front of the center is assigned.",
    checks: "The station, the count, the year, and whether it was scripted, done by hand, or estimated.",
  },
  {
    id: "sv_classify",
    label: "Street View",
    job: "The center is marked add, review, or drop, with a reason.",
    checks: "The imagery date, the image files, and the reason for the mark.",
  },
  {
    id: "owner_resolve",
    label: "Owner",
    job: "The owning company and its principals are resolved.",
    checks: "The entity, the match type, and the confidence of that match.",
  },
  {
    id: "deed_lookup",
    label: "Deed lookup",
    job: "A deed is opened for ownership or for a sale. Those are different jobs.",
    checks: "Which job it was, the book and page, and how the deed was tied to the parcel.",
  },
  {
    id: "sale_select",
    label: "Sale price",
    job: "The sale that prints is chosen from the recorded lines.",
    checks: "The lines considered, the line chosen, and any walk-back.",
  },
  {
    id: "dm_lookup",
    label: "Deal Machine",
    job: "A property card is read. Numbers are copied only from that card.",
    checks: "The card matches the parcel, and each number has a source on that card.",
  },
  {
    id: "tps_lookup",
    label: "People search",
    job: "A person is searched, and a match is accepted or held.",
    checks: "The query, how many candidates came back, and the match decision.",
  },
  {
    id: "ln_cwp_lookup",
    label: "Listing phones",
    job: "A phone from a listing or company page is kept only with its source.",
    checks: "The page, the number's role, and that a source was named.",
  },
  {
    id: "merge_decision",
    label: "Who prints",
    job: "A person is printed or held under a named rule.",
    checks: "The rule used, and whether the person prints or is held.",
  },
  {
    id: "build",
    label: "Excel build",
    job: "The workbook and cover are built from the rows above.",
    checks: "The input files, the output file, and the row counts.",
  },
  {
    id: "qa_auto",
    label: "Automatic check",
    job: "The file's own checks run. This is not the Envoy review.",
    checks: "Which checker ran, and which checks passed or failed.",
  },
  {
    id: "qa_envoy",
    label: "Envoy review",
    job: "Envoy checks the file and says pass or fail.",
    checks: "The file identity, each check's verdict, and any claim that could not be reproduced.",
  },
  {
    id: "send",
    label: "Sent",
    job: "The file goes out only after the Envoy review passes.",
    checks: "That the review passed, and the file that was attached.",
  },
  {
    id: "status_update",
    label: "Status note",
    job: "A status note quotes counts that come from a named file.",
    checks: "Each count, and the file it came from.",
  },
  {
    id: "owner_report",
    label: "Note to you",
    job: "A note to you. It is not a pipeline handoff.",
    checks: "That the note is complete, and that it is not treated as county work.",
  },
  {
    id: "smoke_test",
    label: "Smoke test",
    job: "A test of the log itself. It is not county work.",
    checks: "That a row can be written and, when a claim is included, that the claim matches.",
  },
];

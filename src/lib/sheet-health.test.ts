import assert from "node:assert/strict";
import test from "node:test";
import type { LogRow } from "../data/log.ts";
import { phaseName, sheetHealth, spansFromSheetText, type SpanRow } from "./sheet-health.ts";

function row(patch: Partial<LogRow> & Pick<LogRow, "id" | "step" | "from" | "to">): LogRow {
  return {
    handoffId: patch.id,
    time: "2 Nov, 22:10",
    county: "BARTOW-GA",
    schemaComplete: true,
    confidence: 1,
    cascade: "none",
    critic: "pass",
    hash: "",
    contentHash: "abc",
    human: false,
    reverify: "",
    notes: "",
    sources: "",
    rejected: "",
    tokenEst: null,
    latencyMs: null,
    iso: "2026-11-02T22:10:00+02:00",
    ...patch,
  };
}

test("schema, autonomy, confidence, tokens, and audit follow the health-tab formulas", () => {
  const rows = [
    row({ id: "a", step: "intake_request", from: "Envoy", to: "Acquisition Agent", schemaComplete: true, confidence: 1, human: false, tokenEst: 10, contentHash: "h1" }),
    row({ id: "b", step: "intake_request", from: "Envoy", to: "Acquisition Agent", schemaComplete: false, confidence: 0.5, human: true, tokenEst: null, contentHash: "" }),
    row({ id: "c", step: "cama_harvest", from: "Acquisition Agent", to: "Envoy", schemaComplete: true, confidence: null, human: false, tokenEst: 30, contentHash: "h2" }),
    row({ id: "d", step: "smoke_test", from: "Envoy", to: "Daniel", schemaComplete: true, confidence: 1, human: false, tokenEst: 20, contentHash: "" }),
  ];
  const health = sheetHealth(rows, []);
  assert.equal(health.eventCount, 4);
  assert.equal(health.schemaValid, 3);
  assert.equal(health.schemaRate, 0.75);
  assert.equal(health.humanCount, 1);
  assert.equal(health.autoCount, 3);
  assert.equal(health.autonomyRate, 0.75);
  assert.equal(health.meanConfidence, (1 + 0.5 + 1) / 3);
  assert.equal(health.avgTokens, 20);
  assert.equal(health.totalTokens, 60);
  assert.equal(health.tokenRows, 3);
  assert.equal(health.hashCount, 2);
  assert.equal(health.auditRate, 0.5);
  assert.equal(health.headline, "Schema is under 90%. Autonomy is under 80%.");
});

test("a blank asked-a-person cell is not counted as finished alone", () => {
  const rows = [
    row({ id: "a", step: "intake_request", from: "Envoy", to: "Acquisition Agent", human: false }),
    row({ id: "b", step: "intake_request", from: "Envoy", to: "Acquisition Agent", human: null, sheetStep: "street_view_list_prep" }),
  ];
  const health = sheetHealth(rows, []);
  assert.equal(health.autoCount, 1);
  assert.equal(health.autonomyRate, 0.5);
  assert.equal(health.logOnly.some((step) => step.step === "street_view_list_prep"), true);
});

test("channels skip internal steps, keep a zero self-pair, and list an extra pair", () => {
  const rows = [
    row({ id: "1", step: "intake_request", from: "Envoy", to: "Acquisition Agent", schemaComplete: false, human: true }),
    row({ id: "2", step: "cama_harvest", from: "Envoy", to: "Acquisition Agent", schemaComplete: false, human: true }),
    row({ id: "3", step: "rule_change", from: "Acquisition Agent", to: "Envoy", schemaComplete: true, human: false }),
    row({ id: "4", step: "intake_request", from: "Acquisition Agent", to: "Acquisition Agent" }),
    row({ id: "5", step: "smoke_test", from: "Acquisition Agent", to: "Daniel", schemaComplete: true, human: false }),
  ];
  const health = sheetHealth(rows, []);
  const envoy = health.channels.find((channel) => channel.from === "Envoy" && channel.to === "Acquisition Agent");
  assert.ok(envoy);
  assert.equal(envoy.handoffs, 1);
  assert.equal(envoy.fails, 1);
  assert.equal(envoy.extra, false);
  const self = health.channels.find((channel) => channel.from === "Acquisition Agent" && channel.to === "Acquisition Agent");
  assert.ok(self);
  assert.equal(self.handoffs, 0);
  assert.equal(self.passRate, 1);
  const extra = health.channels.find((channel) => channel.to === "Daniel" && channel.from === "Acquisition Agent");
  assert.ok(extra);
  assert.equal(extra.extra, true);
  assert.equal(extra.handoffs, 1);
  assert.equal(health.channelTotal?.handoffs, 2);
  assert.equal(health.channelTotal?.fails, 1);
});

test("span pass rate ignores pending, counts an empty handoff, and leaves tokens as n/a", () => {
  const spans: SpanRow[] = [
    { timestamp: "t", handoffId: "a", from: "Acquisition Agent", parentStep: "tps_lookup", outcome: "ok", notes: "", county: "" },
    { timestamp: "t", handoffId: "a", from: "Acquisition Agent", parentStep: "tps_lookup", outcome: "fail", notes: "", county: "" },
    { timestamp: "t", handoffId: "", from: "Acquisition Agent", parentStep: "tps_lookup", outcome: "fail", notes: "", county: "" },
    { timestamp: "t", handoffId: "b", from: "Acquisition Agent", parentStep: "tps_lookup", outcome: "pending", notes: "", county: "" },
    { timestamp: "t", handoffId: "c", from: "Acquisition Agent", parentStep: "intake_request", outcome: "fail", notes: "", county: "" },
  ];
  const health = sheetHealth(
    [row({ id: "log", step: "intake_request", from: "Envoy", to: "Acquisition Agent" })],
    spans,
  );
  assert.equal(health.steps.length, 1);
  assert.equal(health.steps[0].step, "tps_lookup");
  assert.equal(health.steps[0].executions, 2);
  assert.equal(health.steps[0].flags, 2);
  assert.equal(health.steps[0].passRate, 1 / 3);
  assert.equal(health.steps[0].avgTokens, "n/a");
  assert.equal(health.steps[0].phase, "Tps Lookup");
  assert.equal(health.logOnly.some((step) => step.step === "intake_request" && step.rows === 1), true);
  assert.equal(phaseName("cama_harvest"), "Data Acquisition");
  assert.equal(phaseName("sv_classify"), "Sv Classify");
});

test("span csv keeps a blank handoff id", () => {
  const spans = spansFromSheetText(
    "timestamp,handoff_id,from_bot,parent_step,outcome,notes,county_code\n" +
      "2026-11-02T21:27:00+02:00,,Acquisition Agent,sv_classify,ok,walk,\n",
  );
  assert.equal(spans.length, 1);
  assert.equal(spans[0].handoffId, "");
  assert.equal(spans[0].outcome, "ok");
  assert.equal(spans[0].parentStep, "sv_classify");
});

test("an empty log does not call itself on target", () => {
  const health = sheetHealth([], [], false);
  assert.equal(health.headline, "The log has no rows.");
  assert.equal(health.spansLoaded, false);
  assert.equal(health.channelTotal, null);
});

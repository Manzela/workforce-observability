import assert from "node:assert/strict";
import test from "node:test";
import { LOG } from "../data/log.ts";
import { computeHealth, TARGETS } from "./health.ts";

test("health counts the sheet copy without inventing a county or a token budget", () => {
  const health = computeHealth(LOG);
  assert.equal(health.eventCount, 7);
  assert.equal(health.schemaValid, 7);
  assert.equal(health.schemaRate, 1);
  assert.equal(health.humanCount, 0);
  assert.equal(health.autonomyRate, 1);
  assert.ok(health.meanConfidence != null && health.meanConfidence > 0);
  assert.equal(health.avgTokens, 537);
  assert.ok(health.hashCount < 7);
  assert.ok(health.channels.length >= 1);
  assert.ok(health.steps.some((step) => step.step === "smoke_test"));
  assert.equal(TARGETS.schema, 0.9);
});

test("an empty filter stays empty", () => {
  const health = computeHealth([]);
  assert.equal(health.eventCount, 0);
  assert.equal(health.channels.length, 0);
  assert.equal(health.meanConfidence, null);
});

test("steps sort worst pass rate first", () => {
  const health = computeHealth([
    { ...LOG[0], id: "a", step: "cama_harvest", schemaComplete: false, critic: "flag: missing source", contentHash: "", human: true, county: "CLAYTON-GA" },
    { ...LOG[0], id: "b", step: "cama_harvest", schemaComplete: true, critic: "pass", contentHash: "abc", human: false, county: "CLAYTON-GA" },
    { ...LOG[0], id: "c", step: "send", schemaComplete: true, critic: "pass", contentHash: "def", human: false, county: "CLAYTON-GA" },
  ]);
  assert.equal(health.steps[0].step, "cama_harvest");
  assert.equal(health.steps[0].flags, 1);
  assert.equal(health.steps[0].passRate, 0.5);
  assert.equal(health.county, "CLAYTON-GA");
  assert.equal(health.humanCount, 1);
});

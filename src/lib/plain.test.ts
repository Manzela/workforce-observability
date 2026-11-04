import assert from "node:assert/strict";
import test from "node:test";
import type { LogRow } from "../data/log.ts";
import { explainStep } from "./plain.ts";

function row(patch: Partial<LogRow> & Pick<LogRow, "id" | "step">): LogRow {
  return {
    handoffId: patch.id,
    time: "2 Nov, 22:10",
    from: "Envoy",
    to: "Acquisition Agent",
    county: "BARTOW-GA",
    schemaComplete: true,
    confidence: 0.95,
    cascade: "none",
    critic: "pass",
    hash: "61f372e97a11",
    contentHash: "abcd",
    human: false,
    reverify: "pass",
    notes: "",
    sources: "",
    rejected: "none",
    tokenEst: null,
    latencyMs: null,
    iso: "2026-11-02T22:10:00+02:00",
    ...patch,
  };
}

test("a clear step says what was done and hides the file path", () => {
  const face = explainStep(
    [
      row({
        id: "cama",
        step: "cama_harvest",
        notes: "4602 commercial parcels. 583 centers. 247 kept.",
        sources: "/workspace/clayton/cama-stats.json",
      }),
    ],
    "cama_harvest",
  );
  assert.equal(face.summary, "4602 commercial parcels. 583 centers. 247 kept.");
  assert.equal(face.summary.includes(".json"), false);
  assert.equal(face.summary.includes("/workspace"), false);
  assert.match(face.debug.join("\n"), /Sources: \/workspace\/clayton\/cama-stats\.json/);
  assert.match(face.where, /BARTOW-GA · 2 Nov, 22:10 · Envoy → Acquisition Agent/);
});

test("a failed step says what failed and why, without a path", () => {
  const face = explainStep(
    [
      row({
        id: "list",
        step: "listing_lookup",
        cascade: "17 ADD/REVIEW still without center name",
        critic: "partial: 17 unnamed",
        notes: "Names rerun. 23 centers checked, 17 still unnamed. See /workspace/bartow/listing-names-rerun.json.",
        sources: "Bright Data; /workspace/bartow/listing-names-rerun.json",
      }),
    ],
    "listing_lookup",
  );
  assert.match(face.summary, /The listing lookup failed/);
  assert.match(face.summary, /17 ADD\/REVIEW still without center name/);
  assert.equal(face.summary.includes(".json"), false);
  assert.match(face.debug.join("\n"), /listing-names-rerun\.json/);
});

test("a low read names the confidence and a missing re-check names the mismatch", () => {
  const low = explainStep([row({ id: "t", step: "traffic_assign", confidence: 0.5, notes: "Low read." })], "traffic_assign");
  assert.equal(low.summary, "This step needs a look. Confidence is 0.5, under 0.8.");
  const bad = explainStep(
    [row({ id: "p", step: "tps_lookup", reverify: "mismatch", notes: "A re-check did not match." })],
    "tps_lookup",
  );
  assert.equal(bad.summary, "The person search failed. The re-check did not match.");
});

test("the current step says it is still in progress", () => {
  const face = explainStep(
    [row({ id: "in", step: "intake_request", notes: "County request accepted." })],
    "intake_request",
    true,
  );
  assert.match(face.summary, /^Still on this step\./);
  assert.match(face.summary, /County request accepted/);
});

test("an earlier worse try is named, and the debug log keeps the hash", () => {
  const face = explainStep(
    [
      row({
        id: "new",
        step: "intake_request",
        iso: "2026-11-02T22:24:00+02:00",
        notes: "The county request was accepted.",
        contentHash: "0123456789abcdef",
      }),
      row({
        id: "old",
        step: "intake_request",
        iso: "2026-11-02T22:12:00+02:00",
        cascade: "stopped",
        notes: "Jonathan asked, then the handoff stopped.",
      }),
    ],
    "intake_request",
  );
  assert.match(face.summary, /An earlier try was worse/);
  assert.equal(face.summary.toLowerCase().includes("jonathan"), false);
  const debug = face.debug.join("\n");
  assert.match(debug, /0123456789abcdef/);
  assert.match(debug, /\[withheld\]/);
  assert.equal(debug.toLowerCase().includes("jonathan"), false);
});

test("an empty clear row does not invent what finished", () => {
  const face = explainStep([row({ id: "empty", step: "cama_harvest", notes: "", sources: "" })], "cama_harvest");
  assert.equal(face.summary, "This step was logged. The sheet doesn't say what finished.");
  assert.equal(face.summary.includes("cut down"), false);
});

test("a later empty row keeps the earlier detail", () => {
  const face = explainStep(
    [
      row({ id: "old", step: "cama_harvest", iso: "2026-11-02T22:20:00+02:00", notes: "CAMA harvest done. 135 kept." }),
      row({ id: "new", step: "cama_harvest", iso: "2026-11-04T10:19:00+02:00", notes: "" }),
    ],
    "cama_harvest",
  );
  assert.match(face.summary, /The latest row has no detail/);
  assert.match(face.summary, /135 kept/);
});

test("a step with no rows says so", () => {
  const face = explainStep([], "send");
  assert.equal(face.summary, "Nothing is logged here yet.");
  assert.deepEqual(face.debug, []);
});

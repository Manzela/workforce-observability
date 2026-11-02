import assert from "node:assert/strict";
import test from "node:test";
import { LOG, type LogRow } from "../data/log.ts";
import { metricBoard, scrubText } from "./metrics.ts";

function byId(rows = LOG) {
  const board = metricBoard(rows, null);
  return Object.fromEntries(board.map((metric) => [metric.id, metric]));
}

test("sheet copy keeps both rows when the handoff id is shared", () => {
  assert.equal(LOG.length, 7);
  assert.equal(new Set(LOG.map((row) => row.id)).size, 7);
  assert.equal(LOG.filter((row) => row.handoffId === "smoke-test-2026-11-02").length, 2);
});

test("the eight metrics use the sheet cells and do not invent a perfect score", () => {
  const board = byId();
  assert.deepEqual(
    Object.values(board).map((metric) => metric.id),
    ["schema", "reverify", "hash", "human", "cascade", "backup", "size", "confidence"],
  );
  assert.equal(board.schema.figure, "7 of 7");
  assert.equal(board.schema.status, "look");
  assert.match(board.schema.result, /critical_claims and canonical_constraint/);
  assert.equal(board.reverify.figure, "3 of 7");
  assert.equal(board.reverify.status, "look");
  assert.match(board.reverify.result, /3 are empty/);
  assert.equal(board.hash.figure, "2 agree");
  assert.match(board.hash.result, /1 note names a hash the cell does not have/);
  assert.equal(board.human.figure, "0 of 7");
  assert.equal(board.human.status, "clear");
  assert.equal(board.cascade.figure, "0");
  assert.match(board.cascade.result, /1 critic flag is not counted/);
  assert.equal(board.backup.status, "wrong");
  assert.match(board.backup.result, /not in this workspace/);
  assert.equal(board.size.word, "Estimate");
  assert.equal(board.size.figure, "406");
  assert.match(board.size.result, /0–1900, median 406/);
  assert.match(board.size.result, /0–1 ms, median 0/);
  assert.equal(board.confidence.figure, "0.85–1");
  assert.match(board.confidence.result, /totaling 1/);
  assert.match(board.confidence.result, /none instead of a count/);
  const rendered = JSON.stringify(board);
  assert.equal(rendered.toLowerCase().includes("daniel"), false);
  assert.equal(rendered.includes("100%"), false);
});

test("a county filter counts only that county", () => {
  const board = byId(LOG.filter((row) => row.county === "CLAYTON-GA"));
  assert.equal(board.schema.figure, "2 of 2");
  assert.equal(board.reverify.figure, "2 of 2");
  assert.equal(board.reverify.status, "clear");
  assert.equal(board.hash.figure, "1 agree");
  assert.equal(board.size.figure, "356–666");
  assert.equal(board.confidence.figure, "1");
});

test("none is not a stop and not a zero", () => {
  const board = byId();
  assert.equal(board.cascade.figure, "0");
  assert.match(board.confidence.result, /A word is not zero/);
});

test("a real stop and a failed re-check are counted", () => {
  const broken: LogRow = {
    ...LOG[0],
    id: "synthetic-stop",
    schemaComplete: false,
    cascade: "hash mismatch",
    reverify: "owner mismatch",
    notes: "",
    rejected: "2",
    confidence: 0.2,
  };
  const board = byId([broken]);
  assert.equal(board.schema.status, "wrong");
  assert.equal(board.reverify.status, "wrong");
  assert.equal(board.cascade.figure, "1");
  assert.equal(board.confidence.status, "look");
});

test("a blank token cell is not treated as zero", () => {
  const row: LogRow = { ...LOG[6], id: "blank-size", tokenEst: null, latencyMs: null };
  const board = byId([row]);
  assert.match(board.size.result, /no token numbers/);
  assert.match(board.size.result, /1 token cell is blank/);
  assert.equal(board.size.figure, "—");
});

test("backup clearance requires the same ids, not the same count", () => {
  const ids = LOG.map((row) => row.id);
  assert.equal(metricBoard(LOG, { ids })[5].status, "clear");
  const shifted = [...ids];
  shifted[0] = "different-row";
  assert.equal(metricBoard(LOG, { ids: shifted }).find((metric) => metric.id === "backup")?.status, "wrong");
});

test("an empty filter does not invent a rate", () => {
  const board = byId([]);
  assert.equal(board.schema.figure, "—");
  assert.match(board.schema.result, /No rows/);
  assert.equal(board.backup.status, "wrong");
});

test("names in free text stay off the screen", () => {
  assert.equal(scrubText("sent to Daniel at daniel@example.com"), "sent to [withheld] at [withheld]");
});

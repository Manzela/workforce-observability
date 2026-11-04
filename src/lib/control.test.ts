import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { attention, countyWatch, feedFailureNote, feedWord, latestEvent, stageMark } from "./control.ts";
import { rowsFromSheetText, runProgress } from "./parse-sheet.ts";

const csv = readFileSync(new URL("../data/sheet-fallback.csv", import.meta.url), "utf8");

const HEADER =
  "timestamp,handoff_id,from_bot,to_bot,step_type,schema_complete,confidence,cascade_flags,critic_result,human_intervention,re_verify_result,county_code,outcome_notes";

function sheet(body: string) {
  return rowsFromSheetText(`${HEADER}\n${body}\n`);
}

const bartow =
  "2026-11-02T22:10:31+02:00,bartow-intake-2026-11-02,Envoy,Acquisition Agent,intake_request,TRUE,0.95,none,pass,FALSE,pass,BARTOW-GA,County request accepted.\n" +
  "2026-11-04T09:00:00+02:00,bartow-traffic-2026-11-04,Envoy,Acquisition Agent,traffic_assign,TRUE,0.5,none,pass,FALSE,pass,BARTOW-GA,Low read.\n" +
  "2026-11-04T09:10:00+02:00,bartow-tps-2026-11-04,Acquisition Agent,Envoy,tps_lookup,TRUE,0.95,none,pass,FALSE,mismatch,BARTOW-GA,A re-check did not match.";

test("the newest sheet row stays visible when the filter is another county", () => {
  const rows = [...rowsFromSheetText(csv), ...sheet(bartow)];
  const latest = latestEvent(rows);
  assert.ok(latest);
  assert.equal(latest.county, "BARTOW-GA");
  assert.equal(latest.label, "People search");
  assert.equal(latest.status, "wrong");
  assert.equal(latest.what, "A re-check did not match.");
  assert.equal(latest.where, "BARTOW-GA · 4 Nov, 09:10 · Acquisition Agent → Envoy");
  assert.equal(latest.time, "4 Nov, 09:10");
  const clayton = runProgress(rows);
  assert.equal(clayton?.title, "Clayton re-run");
  assert.equal(clayton?.nowLabel, "Property harvest");
});

test("a county run names itself and points at its latest stage", () => {
  const rows = sheet(bartow);
  const run = runProgress(rows);
  assert.equal(run?.title, "Bartow run");
  assert.equal(run?.county, "Bartow");
  assert.equal(run?.nowLabel, "People search");
  assert.equal(run?.stages[0].state, "done");
  assert.equal(run?.stages.find((stage) => stage.id === "tps_lookup")?.state, "now");
  assert.match(run?.nowNote ?? "", /re-check did not match/);
});

test("attention names what is wrong and what is clear, with where", () => {
  const board = attention(sheet(bartow));
  assert.deepEqual(
    board.issues.map((item) => item.label),
    ["People search", "Traffic"],
  );
  assert.equal(board.issues[0].status, "wrong");
  assert.equal(board.issues[0].what, "A re-check did not match.");
  assert.match(board.issues[0].where, /BARTOW-GA · 4 Nov, 09:10/);
  assert.equal(board.issues[1].status, "look");
  assert.equal(board.issues[1].what, "Confidence is low.");
  assert.deepEqual(
    board.working.map((item) => item.label),
    ["County request"],
  );
  assert.equal(board.working[0].what, "Complete.");
  assert.equal(board.working[0].time, "2 Nov, 22:10");
  assert.match(board.working[0].where, /BARTOW-GA · 2 Nov, 22:10/);
});

test("counties with failures sort ahead of a clear county", () => {
  const rows = sheet(
    bartow +
      "\n2026-11-02T15:59:00+02:00,clayton-rerun-intake-2026-11-02,Envoy,Acquisition Agent,intake_request,TRUE,0.95,none,pass,FALSE,pass,CLAYTON-GA,Accepted.",
  );
  const watch = countyWatch(rows);
  assert.deepEqual(
    watch.map((item) => item.county),
    ["BARTOW-GA", "CLAYTON-GA"],
  );
  assert.equal(watch[0].wrong, 1);
  assert.equal(watch[0].look, 1);
  assert.equal(watch[0].clear, 1);
  assert.equal(watch[0].latestLabel, "People search");
  assert.equal(watch[0].latestStatus, "wrong");
  assert.equal(watch[1].wrong, 0);
  assert.equal(watch[1].clear, 1);
  assert.equal(watch[1].latestWhat, "Complete.");
});

test("a step that failed only on an earlier run stays in the county picture", () => {
  const rows = sheet(
    "2026-11-02T22:10:00+02:00,bartow-old-listing,Envoy,Acquisition Agent,listing_lookup,TRUE,0.95,none,pass,FALSE,mismatch,BARTOW-GA,Stopped.\n" +
      "2026-11-04T09:10:00+02:00,bartow-new-tps,Acquisition Agent,Envoy,tps_lookup,TRUE,0.95,none,pass,FALSE,pass,BARTOW-GA,Matched.",
  );
  const across = attention(rows);
  assert.equal(across.issues.some((item) => item.label === "Listing lookup" && item.status === "wrong"), true);
  assert.match(across.issues.find((item) => item.label === "Listing lookup")?.where ?? "", /2 Nov, 22:10/);
  const newestRun = attention(rows.filter((row) => row.handoffId === "bartow-new-tps"));
  assert.equal(newestRun.issues.some((item) => item.label === "Listing lookup"), false);
});

test("a logged failure is not painted as finished", () => {
  assert.equal(stageMark("done", "wrong"), "bad");
  assert.equal(stageMark("done", "look"), "watch");
  assert.equal(stageMark("done", "clear"), "ok");
  assert.equal(stageMark("now", "wrong"), "bad");
  assert.equal(stageMark("waiting", null), "line");
  assert.equal(stageMark("done", null), "line");
});

test("a failed refresh keeps the last live wording only after a live read", () => {
  assert.equal(feedWord(true, false), "Live");
  assert.equal(feedWord(false, false), "Saved");
  assert.equal(feedWord(false, true), "Last live");
  assert.equal(feedFailureNote(true), "Last live read. The sheet did not answer.");
  assert.equal(feedFailureNote(false), "Sheet copy.");
});

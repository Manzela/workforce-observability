import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { stepCoverage } from "./evaluate.ts";
import { liveFeed, rowsFromSheetText, rowRunLabel, runProgress, runStarts } from "./parse-sheet.ts";

const csv = readFileSync(new URL("../data/sheet-fallback.csv", import.meta.url), "utf8");

test("the baked sheet shows the Clayton re-run on property harvest", () => {
  const rows = rowsFromSheetText(csv);
  assert.ok(rows.length >= 18);
  const run = runProgress(rows);
  assert.ok(run);
  assert.equal(run.nowLabel, "Property harvest");
  assert.equal(run.done, 2);
  assert.equal(run.total, 16);
  assert.match(run.nowNote, /247 kept/);
  assert.equal(run.nowNote.toLowerCase().includes("daniel"), false);
  assert.equal(run.stages[0].state, "done");
  assert.equal(run.stages[1].state, "now");
  assert.equal(run.stages[2].state, "waiting");
});

test("a later stage moves the bar", () => {
  const rows = rowsFromSheetText(csv);
  const extra = {
    ...rows[0],
    id: "later",
    handoffId: "clayton-rerun-cama-2026-11-02",
    step: "cama_harvest",
    county: "CLAYTON-GA",
    iso: "2026-11-02T18:00:00+02:00",
    notes: "Parcel harvest finished. 40 centers kept.",
  };
  const run = runProgress([...rows, extra]);
  assert.equal(run?.nowLabel, "Property harvest");
  assert.equal(run?.done, 2);
  assert.match(run?.nowNote ?? "", /40 centers/);
});

test("the time list is one start per run", () => {
  const rows = rowsFromSheetText(csv);
  const starts = runStarts(rows);
  assert.equal(starts.at(-1)?.label, "2 Nov, 15:59");
  assert.equal(starts.some((start) => start.label === "2 Nov, 16:06"), false);
  assert.equal(starts.some((start) => start.label === "2 Nov, 16:04"), false);
  assert.equal(starts.some((start) => start.label === "2 Nov, 16:03"), false);
  assert.equal(starts.some((start) => start.label === "2 Nov, 16:16"), false);
  const later = rows.find((row) => row.time === "2 Nov, 16:06");
  assert.ok(later);
  assert.equal(rowRunLabel(rows, later), "2 Nov, 15:59");
});

test("a county run keeps the first timestamp and its county", () => {
  const rows = rowsFromSheetText(
    "timestamp,handoff_id,from_bot,to_bot,step_type,county_code,run_id\n" +
      "2026-11-02T22:10:31+02:00,bartow-kickoff-2026-11-02,Envoy,Acquisition Agent,intake_request,BARTOW-GA,\n" +
      "2026-11-02T22:12:35+02:00,bartow-intake-2026-11-02,Envoy,Acquisition Agent,intake_request,BARTOW-GA,\n" +
      "2026-11-02T22:20:53+02:00,bartow-cama-harvest-2026-11-02,Acquisition Agent,Envoy,cama_harvest,BARTOW-GA,\n" +
      "2026-11-02T22:24:32+02:00,bartow-intake-2026-11-02,Acquisition Agent,Envoy,intake_request,,BARTOW-GA-2026-11-02-prod\n" +
      "2026-11-02T15:59:00+02:00,clayton-rerun-intake-2026-11-02,Acquisition Agent,Envoy,intake_request,CLAYTON-GA,\n" +
      "2026-11-02T22:19:15+02:00,clayton-rerun-sv-classify-2026-11-02,Acquisition Agent,Envoy,sv_classify,CLAYTON-GA,CLAYTON-GA-2026-11-02-internal\n" +
      "2026-11-02T14:53:12+02:00,dm-smoke-clayton-2026-11-02,Acquisition Agent,Envoy,dm_lookup,CLAYTON-GA,\n",
  );
  const labels = runStarts(rows).map((start) => start.label);
  assert.equal(labels.filter((label) => label === "2 Nov, 22:10").length, 1);
  assert.equal(labels.includes("2 Nov, 22:12"), false);
  assert.equal(labels.includes("2 Nov, 22:20"), false);
  assert.equal(labels.includes("2 Nov, 22:24"), false);
  const late = rows.find((row) => row.loggedRunId === "BARTOW-GA-2026-11-02-prod");
  assert.ok(late);
  assert.equal(late.county, "BARTOW-GA");
  assert.equal(rowRunLabel(rows, late), "2 Nov, 22:10");
  const clayton = rows.find((row) => row.handoffId.includes("sv-classify"));
  assert.ok(clayton);
  assert.equal(rowRunLabel(rows, clayton), "2 Nov, 15:59");
  const smoke = rows.find((row) => row.handoffId.startsWith("dm-smoke"));
  assert.ok(smoke);
  assert.equal(rowRunLabel(rows, smoke), "2 Nov, 14:53");
});

test("unknown steps stay under Other and do not move the Clayton bar", () => {
  const rows = rowsFromSheetText(csv);
  const extra = {
    ...rows[0],
    id: "incident-row",
    handoffId: "clayton-rerun-incident-2026-11-02",
    step: "incident",
    county: "CLAYTON-GA",
    iso: "2026-11-04T09:10:00+02:00",
    sources: "incident-log",
    notes: "A later incident.",
  };
  const run = runProgress([...rows, extra]);
  assert.equal(run?.nowLabel, "Property harvest");
  const other = stepCoverage([...rows, extra]).find((step) => step.id === "incident");
  assert.ok(other);
  assert.equal(other.label, "Other · incident");
  assert.equal(other.sources, "incident-log");
  assert.match(other.tip, /Sources: incident-log/);
  assert.match(other.tip, /does not move the progress bar/);
});

test("smoke rows drop out of a live feed and remain when they are the only rows", () => {
  const rows = rowsFromSheetText(
    "timestamp,handoff_id,from_bot,step_type,schema_complete,confidence,county_code,sources_refs,cascade_flags,critic_result\n" +
      "2026-11-02T13:13:31+02:00,smoke-test-2026-11-02,Envoy,smoke_test,TRUE,1,,t412u,n/a,pass\n" +
      "2026-11-02T13:13:43+02:00,probe-2026-11-02,Envoy,intake_request,TRUE,1,TEST,probe,none,pass\n" +
      "2026-11-02T15:59:00+02:00,clayton-rerun-intake-2026-11-02,Envoy,intake_request,TRUE,0.9,CLAYTON-GA,county-file,none,pass\n",
  );
  const mixed = liveFeed(rows);
  assert.equal(mixed.live, true);
  assert.deepEqual(mixed.rows.map((row) => row.handoffId), ["clayton-rerun-intake-2026-11-02"]);
  const smokeOnly = liveFeed(rows.slice(0, 2));
  assert.equal(smokeOnly.live, false);
  assert.equal(smokeOnly.rows.length, 2);
  const intake = stepCoverage(mixed.rows).find((step) => step.id === "intake_request");
  assert.equal(intake?.sources, "county-file");
  assert.equal(intake?.status, "clear");
});

test("street view list prep is the Street View stage", () => {
  const rows = rowsFromSheetText(
    "timestamp,handoff_id,from_bot,to_bot,step_type,schema_complete,confidence,county_code\n" +
      "2026-11-02T17:13:37+02:00,clayton-rerun-sv_list-2026-11-02,Acquisition Agent,Acquisition Agent,street_view_list_prep,TRUE,0.85,CLAYTON-GA\n",
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].step, "sv_classify");
  assert.equal(rows[0].schemaComplete, true);
  const run = runProgress(rows);
  assert.equal(run?.nowLabel, "Street View");
});

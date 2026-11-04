//#region node_modules/.nitro/vite/services/ssr/assets/parse-sheet-DXmZB-nm.js
/** Named by the metric and absent from that sheet header. */
var ABSENT_COLUMNS = ["critical_claims", "canonical_constraint"];
var PIPELINE_STEPS = [
	{
		id: "intake_request",
		label: "County request",
		job: "The county and its rules are written down before any work starts.",
		checks: "The county, the rules that were relayed, and that an approval was recorded."
	},
	{
		id: "rule_change",
		label: "Rule change",
		job: "A rule is added or replaced, and the source of that rule is named.",
		checks: "The lesson, what it replaces, and whether it was applied to files already sent."
	},
	{
		id: "cama_harvest",
		label: "Property harvest",
		job: "The county parcel list is cut down to centers worth working.",
		checks: "The source file, the parcel and center counts, and why parcels were left out."
	},
	{
		id: "listing_lookup",
		label: "Listing lookup",
		job: "A center name is taken from a saved listing page.",
		checks: "The page used, whether it loaded, and the name that was taken."
	},
	{
		id: "traffic_assign",
		label: "Traffic",
		job: "The road count in front of the center is assigned.",
		checks: "The station, the count, the year, and whether it was scripted, done by hand, or estimated."
	},
	{
		id: "sv_classify",
		label: "Street View",
		job: "The center is marked add, review, or drop, with a reason.",
		checks: "The imagery date, the image files, and the reason for the mark."
	},
	{
		id: "owner_resolve",
		label: "Owner",
		job: "The owning company and its principals are resolved.",
		checks: "The entity, the match type, and the confidence of that match."
	},
	{
		id: "deed_lookup",
		label: "Deed lookup",
		job: "A deed is opened for ownership or for a sale. Those are different jobs.",
		checks: "Which job it was, the book and page, and how the deed was tied to the parcel."
	},
	{
		id: "sale_select",
		label: "Sale price",
		job: "The sale that prints is chosen from the recorded lines.",
		checks: "The lines considered, the line chosen, and any walk-back."
	},
	{
		id: "dm_lookup",
		label: "Deal Machine",
		job: "A property card is read. Numbers are copied only from that card.",
		checks: "The card matches the parcel, and each number has a source on that card."
	},
	{
		id: "tps_lookup",
		label: "People search",
		job: "A person is searched, and a match is accepted or held.",
		checks: "The query, how many candidates came back, and the match decision."
	},
	{
		id: "ln_cwp_lookup",
		label: "Listing phones",
		job: "A phone from a listing or company page is kept only with its source.",
		checks: "The page, the number's role, and that a source was named."
	},
	{
		id: "merge_decision",
		label: "Who prints",
		job: "A person is printed or held under a named rule.",
		checks: "The rule used, and whether the person prints or is held."
	},
	{
		id: "build",
		label: "Excel build",
		job: "The workbook and cover are built from the rows above.",
		checks: "The input files, the output file, and the row counts."
	},
	{
		id: "qa_auto",
		label: "Automatic check",
		job: "The file's own checks run. This is not the Envoy review.",
		checks: "Which checker ran, and which checks passed or failed."
	},
	{
		id: "qa_envoy",
		label: "Envoy review",
		job: "Envoy checks the file and says pass or fail.",
		checks: "The file identity, each check's verdict, and any claim that could not be reproduced."
	},
	{
		id: "send",
		label: "Sent",
		job: "The file goes out only after the Envoy review passes.",
		checks: "That the review passed, and the file that was attached."
	},
	{
		id: "status_update",
		label: "Status note",
		job: "A status note quotes counts that come from a named file.",
		checks: "Each count, and the file it came from."
	},
	{
		id: "owner_report",
		label: "Note to you",
		job: "A note to you. It is not a pipeline handoff.",
		checks: "That the note is complete, and that it is not treated as county work."
	},
	{
		id: "smoke_test",
		label: "Smoke test",
		job: "A test of the log itself. It is not county work.",
		checks: "That a row can be written and, when a claim is included, that the claim matches."
	}
];
var MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec"
];
/** Work the Clayton run actually walks, in order. Notes and smoke tests are not stages. */
var RUN_STAGES = [
	"intake_request",
	"cama_harvest",
	"listing_lookup",
	"traffic_assign",
	"sv_classify",
	"owner_resolve",
	"deed_lookup",
	"sale_select",
	"dm_lookup",
	"tps_lookup",
	"ln_cwp_lookup",
	"merge_decision",
	"build",
	"qa_auto",
	"qa_envoy",
	"send"
];
function scrubNote(text) {
	return text.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[withheld]").replace(/\b(daniel|jonathan)\b/gi, "[withheld]").replace(/\S+/g, (chunk) => chunk.replace(/\D/g, "").length >= 10 ? "[withheld]" : chunk);
}
function displayTime(iso) {
	const match = iso.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
	if (!match) return iso;
	return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1] ?? match[2]}, ${match[4]}:${match[5]}`;
}
function clockMs(iso) {
	const ms = Date.parse(iso);
	return Number.isNaN(ms) ? 0 : ms;
}
function num(value) {
	const text = value.trim();
	if (!text) return null;
	const n = Number(text);
	return Number.isFinite(n) ? n : null;
}
function bool(value) {
	return value.trim().toUpperCase() === "TRUE";
}
/** Sheet step names that are the same stage under another id. */
var STEP_ALIAS = {
	street_view_list_prep: "sv_classify",
	street_view: "sv_classify"
};
function canonicalStep(step) {
	return STEP_ALIAS[step] ?? step;
}
/** RFC 4180. Handles quotes, commas, and newlines inside cells. */
function parseCsv(text) {
	const rows = [];
	let row = [];
	let cell = "";
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (quoted) {
			if (char === "\"") {
				if (text[i + 1] === "\"") {
					cell += "\"";
					i++;
				} else quoted = false;
			} else cell += char;
		} else if (char === "\"") quoted = true;
		else if (char === ",") {
			row.push(cell);
			cell = "";
		} else if (char === "\n") {
			row.push(cell);
			rows.push(row);
			row = [];
			cell = "";
		} else if (char !== "\r") cell += char;
	}
	if (cell.length > 0 || row.length > 0) {
		row.push(cell);
		rows.push(row);
	}
	return rows.filter((item) => item.some((value) => value.trim() !== ""));
}
function rowsFromSheetText(text) {
	const table = parseCsv(text);
	const headerIndex = table.findIndex((row) => row[0]?.trim() === "timestamp" && row.includes("handoff_id"));
	if (headerIndex < 0) return [];
	const header = table[headerIndex].map((name) => name.trim());
	const index = new Map(header.map((name, i) => [name, i]));
	const cell = (row, name) => (row[index.get(name) ?? -1] ?? "").trim();
	return table.slice(headerIndex + 1).flatMap((row) => {
		const stamp = cell(row, "timestamp");
		const handoffId = cell(row, "handoff_id");
		const from = cell(row, "from_bot");
		if (!stamp || !handoffId) return [];
		const time = displayTime(stamp);
		return [{
			id: `${handoffId} · ${stamp} · ${from || "unknown"}`,
			handoffId,
			time,
			from,
			to: cell(row, "to_bot"),
			step: canonicalStep(cell(row, "step_type")),
			county: cell(row, "county_code"),
			schemaComplete: bool(cell(row, "schema_complete")),
			confidence: num(cell(row, "confidence")),
			cascade: cell(row, "cascade_flags") || "none",
			critic: cell(row, "critic_result"),
			hash: cell(row, "constraint_hash"),
			contentHash: cell(row, "content_hash"),
			human: bool(cell(row, "human_intervention")),
			reverify: cell(row, "re_verify_result"),
			notes: cell(row, "outcome_notes"),
			sources: cell(row, "sources_refs"),
			rejected: cell(row, "rejected_approaches"),
			tokenEst: num(cell(row, "token_est")),
			latencyMs: num(cell(row, "latency_ms")),
			iso: stamp
		}];
	});
}
function isActiveRun(row) {
	return row.county === "CLAYTON-GA" && /clayton-(rerun|e2e)/i.test(row.handoffId);
}
/** One county re-run is one run, even when each step gets its own handoff id. */
function runId(row) {
	if (/clayton-(rerun|e2e)/i.test(row.handoffId)) return "clayton-rerun";
	return row.handoffId || row.id;
}
function rowRunLabel(rows, row) {
	const id = runId(row);
	let best = row;
	let bestMs = clockMs(row.iso ?? "");
	for (const other of rows) {
		if (runId(other) !== id) continue;
		const ms = clockMs(other.iso ?? "");
		if (ms < bestMs) {
			best = other;
			bestMs = ms;
		}
	}
	return best.time;
}
/** Start time of each run, once. Later steps of the same run are not listed. */
function runStarts(rows) {
	const labels = /* @__PURE__ */ new Set();
	const ordered = [...rows].sort((a, b) => clockMs(a.iso ?? "") - clockMs(b.iso ?? ""));
	const seenRun = /* @__PURE__ */ new Set();
	const starts = [];
	for (const row of ordered) {
		const id = runId(row);
		if (seenRun.has(id)) continue;
		seenRun.add(id);
		if (labels.has(row.time)) continue;
		labels.add(row.time);
		starts.push({
			label: row.time,
			ms: clockMs(row.iso ?? "")
		});
	}
	return starts.sort((a, b) => a.ms - b.ms).map((start) => start.label);
}
function runProgress(rows) {
	const run = rows.filter(isActiveRun);
	if (run.length === 0) return null;
	const labels = new Map(PIPELINE_STEPS.map((step) => [step.id, step.label]));
	const logged = new Set(run.map((row) => row.step));
	const work = run.filter((row) => RUN_STAGES.includes(row.step));
	const latestWork = [...work].sort((a, b) => clockMs(a.iso ?? "") - clockMs(b.iso ?? ""))[work.length - 1];
	const latest = [...run].sort((a, b) => clockMs(a.iso ?? "") - clockMs(b.iso ?? ""))[run.length - 1];
	const nowId = latestWork?.step ?? latest.step;
	const stages = RUN_STAGES.map((id) => {
		const state = id === nowId ? "now" : logged.has(id) ? "done" : "waiting";
		return {
			id,
			label: labels.get(id) ?? id,
			state
		};
	});
	const noteSource = latest?.notes?.trim() || latestWork?.notes?.trim() || "Logged. Waiting on the next step.";
	return {
		county: "Clayton",
		done: stages.filter((stage) => stage.state !== "waiting").length,
		total: stages.length,
		nowLabel: labels.get(nowId) ?? nowId,
		nowNote: scrubNote(noteSource),
		stages
	};
}
//#endregion
export { rowsFromSheetText as a, rowRunLabel as i, PIPELINE_STEPS as n, runProgress as o, displayTime as r, runStarts as s, ABSENT_COLUMNS as t };

import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BaFuNbRh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Named by the metric and absent from that sheet header. */
var ABSENT_COLUMNS = ["critical_claims", "canonical_constraint"];
var SHEET_COPY = {
	readAt: "2 Nov, 15:35",
	rows: 7,
	live: false
};
/** Cell-for-cell copy of the sheet. Not a live feed. */
var LOG = [
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
		latencyMs: 0
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
		latencyMs: 0
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
		notes: "Upgraded smoke test (schema 1.1); content_hash b8578ddf2e53; critical claim (rev4 sha256) re-verified: match; full block in /workspace/observability/backup.jsonl",
		sources: "/workspace/clayton-2026-10-28/clayton-2026-10-30-final-rev4.xlsx",
		rejected: "none",
		tokenEst: 406,
		latencyMs: 0
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
		latencyMs: 0
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
		confidence: .85,
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
		latencyMs: 0
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
		notes: "Scoped smoke test v1.2; content_hash 67675399c0f0; claim re-verified against same step_type+county source: match",
		sources: "/workspace/clayton-2026-10-28/dm/dm-batch-09.jsonl",
		rejected: "none",
		tokenEst: 356,
		latencyMs: 0
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
		reverify: "clayton-2026-10-30-final-rev4.xlsx PASS; changed-rows-rev4.csv PASS; changed-cells-rev4.csv PASS; envoy-qa-2026-10-30.md PASS",
		notes: "Scoped smoke test (smoke=true); threshold_version constraints-v1; no message sent to the Acquisition Agent",
		sources: "t415u; clayton-2026-10-30-final-rev4.xlsx; changed-rows-rev4.csv; changed-cells-rev4.csv; envoy-qa-2026-10-30.md",
		rejected: "1",
		tokenEst: 666,
		latencyMs: 1
	}
];
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
function publicText(text) {
	return text.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[withheld]").replace(/\b(daniel|jonathan)\b/gi, "[withheld]").replace(/\S+/g, (chunk) => chunk.replace(/\D/g, "").length >= 10 ? "[withheld]" : chunk);
}
function rowStatus(row) {
	const stopped = row.cascade !== "none" && row.cascade !== "";
	const failed = /fail|mismatch/i.test(row.reverify);
	if (!row.schemaComplete || stopped || failed) return "wrong";
	const flagged = /flag/i.test(row.critic);
	if (row.human || flagged || row.confidence === null || row.confidence < .8) return "look";
	return "clear";
}
function reason(row) {
	if (rowStatus(row) === "clear") return null;
	const flag = row.critic.replace(/^flag:\s*/i, "").trim();
	if (/flag/i.test(row.critic) && flag) return publicText(flag.charAt(0).toUpperCase() + flag.slice(1));
	if (/fail|mismatch/i.test(row.reverify)) return "A re-check did not match.";
	if (row.cascade !== "none" && row.cascade !== "") return "This handoff was stopped.";
	if (row.human) return "A person was asked.";
	if (!row.schemaComplete) return "The record was incomplete.";
	if (row.confidence === null) return "Confidence is missing.";
	return "Confidence is low.";
}
function worst(list) {
	if (list.includes("wrong")) return "wrong";
	if (list.includes("look")) return "look";
	return "clear";
}
function checkLine(row) {
	const bits = [];
	bits.push(row.schemaComplete ? "The record is complete." : "The record is incomplete.");
	if (!row.reverify.trim()) bits.push("No fact was re-checked.");
	else if (/^n\/a\b/i.test(row.reverify.trim())) bits.push("This was not a re-check.");
	else {
		const text = publicText(row.reverify).replace(/[.]+$/, "");
		if (/fail|mismatch/i.test(row.reverify)) bits.push(`Re-check failed: ${text}.`);
		else bits.push(`Re-check matched: ${text}.`);
	}
	if (/flag/i.test(row.critic)) {
		const flag = row.critic.replace(/^flag:\s*/i, "").trim();
		const sentence = flag.charAt(0).toUpperCase() + flag.slice(1);
		bits.push(`Flag: ${publicText(sentence)}.`);
	}
	if (row.cascade !== "none" && row.cascade !== "") bits.push("The handoff was stopped.");
	if (row.human) bits.push("A person was asked.");
	if (row.confidence === null) bits.push("Confidence is missing.");
	else if (row.confidence < .8) bits.push(`Confidence is ${row.confidence}.`);
	return bits.join(" ");
}
function stepTip(step, rows) {
	const mine = rows.filter((row) => row.step === step.id);
	if (mine.length === 0) return publicText(`${step.job} Nothing is logged here, so it was not checked. A real row records: ${step.checks}`);
	const status = worst(mine.map(rowStatus));
	const sources = mine.filter((row) => rowStatus(row) === status);
	const others = mine.length - sources.length;
	const lines = [...new Set(sources.map(checkLine))];
	const where = uniqueCounty(sources);
	const count = `${sources.length} ${sources.length === 1 ? "row" : "rows"}${where ? `, ${where}` : ""}.`;
	const other = others === 0 ? "" : ` ${others} other ${others === 1 ? "row is" : "rows are"} in better shape and did not set this status.`;
	const detail = lines.length === 1 ? `${count} ${lines[0]} Cite ${sources.map((row) => row.id).join(", ")}.` : sources.map((row) => `${row.id}. ${checkLine(row)}`).join(" ");
	return publicText(`${step.job} ${detail}${other}`);
}
function uniqueCounty(rows) {
	const names = [...new Set(rows.map((row) => row.county).filter(Boolean))];
	return names.length === 1 ? names[0] : "";
}
function stepCoverage(rows) {
	return PIPELINE_STEPS.map((step) => {
		const mine = rows.filter((row) => row.step === step.id);
		const status = mine.length === 0 ? null : worst(mine.map(rowStatus));
		const sources = status === null ? [] : mine.filter((row) => rowStatus(row) === status);
		const flagged = sources.find((row) => reason(row));
		return {
			id: step.id,
			label: step.label,
			status,
			reason: flagged ? reason(flagged) : null,
			traceIds: sources.map((row) => row.id),
			tip: stepTip(step, rows)
		};
	});
}
function counties(rows) {
	return [...new Set(rows.map((row) => row.county).filter(Boolean))].sort();
}
function times(rows) {
	return [...new Set(rows.map((row) => row.time))];
}
var SNAPSHOT_ROWS = LOG;
function scrubText(text) {
	return text.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[withheld]").replace(/\b(daniel|jonathan)\b/gi, "[withheld]").replace(/\S+/g, (chunk) => chunk.replace(/\D/g, "").length >= 10 ? "[withheld]" : chunk);
}
function of(part, total) {
	return `${part} of ${total}`;
}
function isStop(cascade) {
	const value = cascade.trim().toLowerCase();
	return value !== "" && value !== "none" && value !== "n/a";
}
function reverifyKind(value) {
	const text = value.trim();
	if (!text) return "empty";
	if (/^n\/a\b/i.test(text)) return "na";
	if (/fail|mismatch/i.test(text)) return "mismatch";
	return "checked";
}
function noteHash(notes) {
	const match = notes.match(/content_hash\s+([0-9a-f]{12})\b/i);
	return match ? match[1].toLowerCase() : null;
}
function noteClaimsRecheck(notes) {
	return /re-verif/i.test(notes);
}
function middle(values) {
	if (values.length === 0) return "no numbers";
	const sorted = [...values].sort((a, b) => a - b);
	if (values.length % 2 === 1) return `median ${sorted[(values.length - 1) / 2]}`;
	return `middle ${sorted[values.length / 2 - 1]} and ${sorted[values.length / 2]}`;
}
function headlineNumber(values) {
	if (values.length === 0) return "—";
	const sorted = [...values].sort((a, b) => a - b);
	if (values.length % 2 === 1) return String(sorted[(values.length - 1) / 2]);
	return `${sorted[values.length / 2 - 1]}–${sorted[values.length / 2]}`;
}
function blank(rows, result, tip) {
	const none = "No rows in this filter.";
	return [
		card("schema", "Schema completeness", "—", null, "Not measured", none, tip, []),
		card("reverify", "Re-check", "—", null, "Not measured", none, tip, []),
		card("hash", "Hash match", "—", null, "Not measured", none, tip, []),
		card("human", "Person asked", "—", null, "Not measured", none, tip, []),
		card("cascade", "Stops", "—", null, "Not measured", none, tip, []),
		card("backup", "Sheet and backup", "—", result === "backup" ? "wrong" : null, "Wrong", none, tip, []),
		card("size", "Size and time", "—", null, "Estimate", none, tip, []),
		card("confidence", "Confidence", "—", null, "Not measured", none, tip, [])
	];
}
function card(id, label, figure, status, word, result, tip, traceIds) {
	return {
		id,
		label,
		figure,
		status,
		word,
		result: scrubText(result),
		tip: scrubText(tip),
		traceIds
	};
}
function metricBoard(rows, backup) {
	if (rows.length === 0) return blank(rows, backup === null ? "backup" : "", "Nothing in this filter to count.");
	const n = rows.length;
	const marked = rows.filter((row) => row.schemaComplete).length;
	const rate = marked / n;
	const schemaStatus = rate < .95 || ABSENT_COLUMNS.length > 0 ? rate < .95 ? "wrong" : "look" : "clear";
	const schema = card("schema", "Schema completeness", of(marked, n), schemaStatus, schemaStatus === "clear" ? "Clear" : schemaStatus === "wrong" ? "Wrong" : "Look", `${of(marked, n)} are marked complete. ${ABSENT_COLUMNS.join(" and ")} are not columns on this sheet, so they were not counted.`, "This is the share of rows marked schema_complete. A complete block is what a later check leans on. Below 95% the mark itself is failing. This sheet has no critical_claims or canonical_constraint column, so a true mark is not proof those fields arrived.", rows.filter((row) => !row.schemaComplete).map((row) => row.id));
	const kinds = rows.map((row) => ({
		row,
		kind: reverifyKind(row.reverify)
	}));
	const checked = kinds.filter((item) => item.kind === "checked");
	const empty = kinds.filter((item) => item.kind === "empty");
	const na = kinds.filter((item) => item.kind === "na");
	const mismatch = kinds.filter((item) => item.kind === "mismatch");
	const split = rows.filter((row) => noteClaimsRecheck(row.notes) && reverifyKind(row.reverify) === "empty");
	const reverifyStatus = mismatch.length > 0 ? "wrong" : empty.length > 0 || split.length > 0 ? "look" : "clear";
	const reverify = card("reverify", "Re-check", of(checked.length, n), reverifyStatus, reverifyStatus === "clear" ? "Clear" : reverifyStatus === "wrong" ? "Wrong" : "Look", `${of(checked.length, n)} ${checked.length === 1 ? "names" : "name"} a result. ${na.length} ${na.length === 1 ? "says" : "say"} not applicable. ${empty.length} ${empty.length === 1 ? "is" : "are"} empty. ${mismatch.length} ${mismatch.length === 1 ? "says" : "say"} mismatch. ${split.length} ${split.length === 1 ? "note claims" : "notes claim"} a re-check while the cell is empty.`, "This is whether the receiver wrote a re-check of a named fact, and whether that cell says it matched. A perfect schema still lets a wrong number through if this cell is empty. A note that claims a re-check does not count unless the cell is filled.", [...new Set([
		...mismatch,
		...empty,
		...split.map((row) => ({ row }))
	].map((item) => item.row.id))]);
	const withContent = rows.filter((row) => row.contentHash.trim() !== "");
	const withConstraint = rows.filter((row) => row.hash.trim() !== "");
	const compared = rows.flatMap((row) => {
		const named = noteHash(row.notes);
		if (!named) return [];
		return [{
			row,
			named,
			cell: row.contentHash.trim().toLowerCase()
		}];
	});
	const agreed = compared.filter((item) => item.cell !== "" && item.cell === item.named);
	const disagreed = compared.filter((item) => item.cell !== "" && item.cell !== item.named);
	const namedOnly = compared.filter((item) => item.cell === "");
	const hash = card("hash", "Hash match", `${agreed.length} agree`, "look", "Look", `${of(withContent.length, n)} have a content hash. ${of(withConstraint.length, n)} have a constraint hash. ${agreed.length} notes match their content-hash cell. ${namedOnly.length} ${namedOnly.length === 1 ? "note names" : "notes name"} a hash the cell does not have. ${disagreed.length} ${disagreed.length === 1 ? "cell disagrees" : "cells disagree"} with the note. No second computed hash is stored, so the rest cannot be matched.`, "This should be the share of rows whose content hash equals the hash of the rules and claims the sender used. The sheet stores one content hash and one constraint hash. They are not the same thing, so they are not compared to each other. A hash named only in the notes does not fill the cell.", [...namedOnly, ...disagreed].map((item) => item.row.id));
	const asked = rows.filter((row) => row.human);
	const human = card("human", "Person asked", of(asked.length, n), asked.length > 0 ? "look" : "clear", asked.length > 0 ? "Look" : "Clear", `${of(asked.length, n)} asked a person. This sheet has one day, so a spike cannot be seen.`, "This is how often a row waited for a person before it continued. A high rate means the bots were unsure. One day cannot show a spike.", asked.map((row) => row.id));
	const stopped = rows.filter((row) => isStop(row.cascade) || !row.schemaComplete);
	const criticFlags = rows.filter((row) => /flag/i.test(row.critic));
	const cascade = card("cascade", "Stops", String(stopped.length), stopped.length > 0 ? "look" : "clear", stopped.length > 0 ? "Look" : "Clear", `${stopped.length} ${stopped.length === 1 ? "stop" : "stops"}. ${criticFlags.length} critic ${criticFlags.length === 1 ? "flag is" : "flags are"} not counted as a stop.`, "A stop is a cascade flag other than none, or a row marked schema_complete false. Those are the handoffs the gate held. A critic flag is a warning, not a stop, and it is counted apart so it is not hidden.", [...new Set([...stopped, ...criticFlags].map((row) => row.id))]);
	let backupCard;
	if (backup === null) backupCard = card("backup", "Sheet and backup", "Not compared", "wrong", "Wrong", "The backup file is not in this workspace. These rows were not compared.", "Each row should exist in the sheet and in the backup file. The backup is the copy that survives a failed sheet write. The file was not here, so a missing or different row would go unseen.", []);
	else {
		const sheetIds = new Set(rows.map((row) => row.id));
		const backupIds = new Set(backup.ids);
		const missing = [...sheetIds].filter((id) => !backupIds.has(id));
		const extra = [...backupIds].filter((id) => !sheetIds.has(id));
		const same = missing.length === 0 && extra.length === 0;
		backupCard = card("backup", "Sheet and backup", same ? of(sheetIds.size, sheetIds.size) : "Differs", same ? "clear" : "wrong", same ? "Clear" : "Wrong", same ? `${sheetIds.size} row ids match the backup.` : `${missing.length} sheet ${missing.length === 1 ? "row is" : "rows are"} missing from the backup. ${extra.length} backup ${extra.length === 1 ? "row is" : "rows are"} not in this filter.`, "The same row id should be in the sheet copy and the backup. Equal counts are not enough. The ids have to be the same ids.", missing);
	}
	const tokens = rows.flatMap((row) => row.tokenEst === null ? [] : [row.tokenEst]);
	const times = rows.flatMap((row) => row.latencyMs === null ? [] : [row.latencyMs]);
	const tokenBlank = n - tokens.length;
	const timeBlank = n - times.length;
	const tokenSpan = tokens.length === 0 ? "no token numbers" : `${Math.min(...tokens)}–${Math.max(...tokens)}, ${middle(tokens)}`;
	const timeSpan = times.length === 0 ? "no time numbers" : `${Math.min(...times)}–${Math.max(...times)} ms, ${middle(times)}`;
	const size = card("size", "Size and time", headlineNumber(tokens), null, "Estimate", `Estimate. Tokens ${tokenSpan}. Time ${timeSpan}. ${tokenBlank} token ${tokenBlank === 1 ? "cell is" : "cells are"} blank. ${timeBlank} time ${timeBlank === 1 ? "cell is" : "cells are"} blank. A blank is not zero.`, "token_est is about a quarter of the characters. latency_ms is the logged wait. The platform does not give exact tokens, so these stay estimates. They are here to notice a jump, not to price the work.", rows.filter((row) => row.tokenEst === null || row.latencyMs === null).map((row) => row.id));
	const confidences = rows.flatMap((row) => row.confidence === null ? [] : [row.confidence]);
	const missingConfidence = rows.filter((row) => row.confidence === null);
	const numericRejected = rows.filter((row) => /^\d+$/.test(row.rejected.trim()));
	const wordRejected = rows.filter((row) => row.rejected.trim() !== "" && !/^\d+$/.test(row.rejected.trim()));
	const blankRejected = rows.filter((row) => row.rejected.trim() === "");
	const low = rows.filter((row) => row.confidence !== null && row.confidence < .8);
	const confidenceStatus = missingConfidence.length > 0 || wordRejected.length > 0 || blankRejected.length > 0 || low.length > 0 ? "look" : "clear";
	const words = [...new Set(wordRejected.map((row) => row.rejected.trim()))];
	const lowScore = confidences.length === 0 ? null : Math.min(...confidences);
	const highScore = confidences.length === 0 ? null : Math.max(...confidences);
	const confidenceFigure = lowScore === null || highScore === null ? "—" : lowScore === highScore ? String(lowScore) : `${lowScore}–${highScore}`;
	const lowText = lowScore === null || highScore === null ? "No confidence numbers." : lowScore === highScore ? `Confidence ${lowScore}.` : `Confidence ${lowScore}–${highScore}.`;
	const discarded = numericRejected.reduce((sum, row) => sum + Number(row.rejected), 0);
	const wordBit = words.length === 0 ? "No row uses a word in place of a count." : `${wordRejected.length} ${wordRejected.length === 1 ? "row uses" : "rows use"} ${words.join(", ")} instead of a count.`;
	const confidence = card("confidence", "Confidence", confidenceFigure, confidenceStatus, confidenceStatus === "clear" ? "Clear" : "Look", `${lowText} ${numericRejected.length} rows give a count of discarded approaches, totaling ${discarded}. ${wordBit} ${blankRejected.length} ${blankRejected.length === 1 ? "is" : "are"} blank. A word is not zero.`, "Confidence is the sender's own 0–1 score. Rejected approaches is how many paths it says it already dropped. A word such as none is not a number, so it is not treated as zero. Low confidence, or a count that is not a count, is the early warning.", [
		...missingConfidence,
		...wordRejected,
		...blankRejected,
		...low
	].map((row) => row.id));
	return [
		schema,
		reverify,
		hash,
		human,
		cascade,
		backupCard,
		size,
		confidence
	];
}
var STATUS_WORD = {
	clear: "Clear",
	look: "Look",
	wrong: "Wrong"
};
function tone(status) {
	if (status === "clear") return "text-ok";
	if (status === "look") return "text-watch";
	if (status === "wrong") return "text-bad";
	return "text-faint";
}
function dot(status) {
	if (status === "clear") return "bg-ok";
	if (status === "look") return "bg-watch";
	if (status === "wrong") return "bg-bad";
	return "bg-line";
}
function Dashboard() {
	const [county, setCounty] = (0, import_react.useState)("all");
	const [time, setTime] = (0, import_react.useState)("all");
	const [tab, setTab] = (0, import_react.useState)("steps");
	const [copied, setCopied] = (0, import_react.useState)(null);
	const [open, setOpen] = (0, import_react.useState)(null);
	const [pinned, setPinned] = (0, import_react.useState)(null);
	const rows = (0, import_react.useMemo)(() => {
		return SNAPSHOT_ROWS.filter((row) => {
			if (county !== "all" && row.county !== county) return false;
			if (time !== "all" && row.time !== time) return false;
			return true;
		});
	}, [county, time]);
	const steps = stepCoverage(rows);
	const metrics = (0, import_react.useMemo)(() => metricBoard(rows, null), [rows]);
	const stepAttention = steps.filter((step) => step.status === "look" || step.status === "wrong");
	const metricWrong = metrics.filter((metric) => metric.status === "wrong");
	const metricLook = metrics.filter((metric) => metric.status === "look");
	const headline = tab === "steps" ? stepAttention.length === 0 ? "Nothing needs you." : stepAttention.length === 1 ? `1 step needs you: ${stepAttention[0].label}.` : `${stepAttention.length} steps need you.` : metricWrong.length === 0 && metricLook.length === 0 ? "Nothing needs you." : [metricWrong.length === 1 ? "1 is wrong." : metricWrong.length > 1 ? `${metricWrong.length} are wrong.` : "", metricLook.length === 1 ? "1 needs a look." : metricLook.length > 1 ? `${metricLook.length} need a look.` : ""].filter(Boolean).join(" ");
	function copyTrace(id) {
		navigator.clipboard.writeText(id).then(() => {
			setCopied(id);
			window.setTimeout(() => setCopied((current) => current === id ? null : current), 1200);
		}, () => void 0);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: `mx-auto flex w-full flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 ${tab === "metrics" ? "max-w-3xl" : "max-w-2xl"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex flex-col gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-3xl text-fg",
							children: "Workforce Observability"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-base text-fg",
							children: headline
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-faint",
							children: [
								"Sheet copy, ",
								SHEET_COPY.readAt,
								". ",
								SHEET_COPY.rows,
								" rows. Not a live feed."
							]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeSwitch, {})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "tablist",
					"aria-label": "View",
					className: "flex w-fit rounded-full border border-line bg-panel p-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabButton, {
						active: tab === "steps",
						onClick: () => setTab("steps"),
						children: "Steps"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabButton, {
						active: tab === "metrics",
						onClick: () => setTab("metrics"),
						children: "Metrics"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 gap-3 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Filter, {
						label: "County",
						value: county,
						onChange: setCounty,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "all",
							children: "All counties"
						}), counties(SNAPSHOT_ROWS).map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: name,
							children: name
						}, name))]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Filter, {
						label: "Time",
						value: time,
						onChange: setTime,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "all",
							children: "All times"
						}), times(SNAPSHOT_ROWS).map((stamp) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: stamp,
							children: stamp
						}, stamp))]
					})]
				})
			]
		}), tab === "steps" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "flex flex-col gap-1",
			children: steps.map((step) => {
				const shown = open === step.id || pinned === step.id;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: `relative rounded-card border border-line bg-panel ${shown ? "z-20" : ""}`,
					onMouseEnter: () => setOpen(step.id),
					onMouseLeave: () => setOpen((current) => current === step.id ? null : current),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left",
							"aria-expanded": shown,
							"aria-describedby": shown ? `tip-${step.id}` : void 0,
							onClick: () => setPinned((current) => current === step.id ? null : step.id),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `size-2.5 shrink-0 rounded-full ${dot(step.status)}`,
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "min-w-0 flex-1 text-base text-fg",
									children: step.label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `shrink-0 text-sm font-medium ${tone(step.status)}`,
									children: step.status ? STATUS_WORD[step.status] : "Not logged"
								})
							]
						}),
						(step.reason || step.traceIds.length > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "px-4 pb-3 pl-9",
							children: [step.reason && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm leading-relaxed text-muted",
								children: step.reason
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 flex flex-wrap gap-x-3 gap-y-1",
								children: step.traceIds.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => copyTrace(id),
									className: "break-all text-left font-mono text-xs text-faint underline decoration-line underline-offset-2",
									children: copied === id ? "Copied" : id
								}, id))
							})]
						}),
						shown && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							id: `tip-${step.id}`,
							role: "tooltip",
							className: "absolute left-3 right-3 top-full z-30 mt-1 rounded-xl border border-line bg-ink px-3 py-3 text-sm leading-relaxed text-fg shadow-lg",
							children: step.tip
						})
					]
				}, step.id);
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-1 gap-3 sm:grid-cols-2",
			children: metrics.map((metric) => {
				const shown = open === metric.id || pinned === metric.id;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: `relative rounded-card border border-line bg-panel ${shown ? "z-20" : ""}`,
					onMouseEnter: () => setOpen(metric.id),
					onMouseLeave: () => setOpen((current) => current === metric.id ? null : current),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "flex w-full flex-col gap-2 px-4 py-4 text-left",
							"aria-expanded": shown,
							"aria-describedby": shown ? `tip-${metric.id}` : void 0,
							onClick: () => setPinned((current) => current === metric.id ? null : metric.id),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm text-muted",
										children: metric.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `shrink-0 text-sm font-medium ${tone(metric.status)}`,
										children: metric.word
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-display text-3xl text-fg",
									children: metric.figure
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm leading-relaxed text-muted",
									children: metric.result
								})
							]
						}),
						metric.traceIds.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "flex flex-wrap gap-x-3 gap-y-1 px-4 pb-4",
							children: metric.traceIds.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => copyTrace(id),
								className: "break-all text-left font-mono text-xs text-faint underline decoration-line underline-offset-2",
								children: copied === id ? "Copied" : id
							}, id))
						}),
						shown && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							id: `tip-${metric.id}`,
							role: "tooltip",
							className: "absolute left-3 right-3 top-full z-30 mt-1 rounded-xl border border-line bg-ink px-3 py-3 text-sm leading-relaxed text-fg shadow-lg",
							children: metric.tip
						})
					]
				}, metric.id);
			})
		})]
	});
}
function TabButton({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		role: "tab",
		"aria-selected": active,
		onClick,
		className: `min-h-11 rounded-full px-4 text-sm font-medium ${active ? "bg-fg text-ink" : "text-muted"}`,
		children
	});
}
function ThemeSwitch() {
	const [theme, setTheme] = (0, import_react.useState)("dark");
	(0, import_react.useEffect)(() => {
		const stored = document.documentElement.dataset.theme;
		if (stored === "lite" || stored === "dark") setTheme(stored);
	}, []);
	function choose(next) {
		setTheme(next);
		document.documentElement.dataset.theme = next;
		localStorage.setItem("workforce-theme", next);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex shrink-0 rounded-full border border-line bg-panel p-1",
		role: "group",
		"aria-label": "Color mode",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeButton, {
			active: theme === "lite",
			onClick: () => choose("lite"),
			children: "Lite"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeButton, {
			active: theme === "dark",
			onClick: () => choose("dark"),
			children: "Dark"
		})]
	});
}
function ModeButton({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-pressed": active,
		onClick,
		className: `min-h-11 rounded-full px-3 text-sm font-medium ${active ? "bg-fg text-ink" : "text-muted"}`,
		children
	});
}
function Filter({ label, value, onChange, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex flex-col gap-1 text-sm text-muted",
		children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
			className: "min-h-11 rounded-xl border border-line bg-ink px-3 text-base text-fg",
			value,
			onChange: (event) => onChange(event.target.value),
			children
		})]
	});
}
var SplitComponent = Dashboard;
//#endregion
export { SplitComponent as component };

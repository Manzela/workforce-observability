import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as rowsFromSheetText, i as rowRunLabel, n as PIPELINE_STEPS, o as runProgress, r as displayTime, s as runStarts, t as ABSENT_COLUMNS } from "./parse-sheet-DXmZB-nm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BapIMkdv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
function whatHappened(row) {
	if (rowStatus(row) === "clear") {
		if (row.reverify.trim() && !/^n\/a\b/i.test(row.reverify.trim())) return "The latest row is complete, and the re-check matched.";
		return "The latest row is complete.";
	}
	if (!row.schemaComplete) return "The latest row is incomplete, so this step isn't done.";
	if (row.cascade !== "none" && row.cascade !== "") return "The latest row was stopped.";
	if (/fail|mismatch/i.test(row.reverify)) return "The latest row failed its re-check.";
	if (/flag/i.test(row.critic)) {
		const flag = row.critic.replace(/^pass with flags:\s*/i, "").replace(/^flag:\s*/i, "").trim().replace(/[.]+$/, "");
		return flag ? `The latest row has a flag: ${publicText(flag)}.` : "The latest row has a flag.";
	}
	if (row.human) return "A person had to be asked before this could continue.";
	if (row.confidence === null) return "Confidence is missing on the latest row.";
	if (row.confidence < .8) return `Confidence on the latest row is ${row.confidence}.`;
	return "The latest row needs a look.";
}
function stepTip(step, rows) {
	const mine = rows.filter((row) => row.step === step.id);
	if (mine.length === 0) return `${step.job} Nothing is logged here yet.`;
	const latest = latestRow(mine);
	const tail = mine.some((row) => row.id !== latest.id && rank(rowStatus(row)) > rank(rowStatus(latest))) ? " An earlier try in this step was worse." : "";
	return publicText(`${step.job} ${whatHappened(latest)}${tail}`);
}
function rowMs(row) {
	const ms = row.iso ? Date.parse(row.iso) : 0;
	return Number.isNaN(ms) ? 0 : ms;
}
function latestRow(rows) {
	return rows.reduce((best, row) => rowMs(row) >= rowMs(best) ? row : best);
}
function rank(status) {
	if (status === "wrong") return 2;
	if (status === "look") return 1;
	return 0;
}
function stepCoverage(rows) {
	return PIPELINE_STEPS.map((step) => {
		const mine = rows.filter((row) => row.step === step.id);
		if (mine.length === 0) return {
			id: step.id,
			label: step.label,
			status: null,
			reason: null,
			traceIds: [],
			tip: stepTip(step, rows)
		};
		const latest = latestRow(mine);
		const status = rowStatus(latest);
		const earlier = mine.filter((row) => row.id !== latest.id && rank(rowStatus(row)) > rank(status));
		const current = reason(latest);
		const reasonText = earlier.length ? [current, "An earlier try in this step was worse."].filter(Boolean).join(" ") : current;
		return {
			id: step.id,
			label: step.label,
			status,
			reason: reasonText,
			traceIds: [latest.id, ...earlier.map((row) => row.id)],
			tip: stepTip(step, rows)
		};
	});
}
function counties(rows) {
	return [...new Set(rows.map((row) => row.county).filter(Boolean))].sort();
}
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
	const schema = card("schema", "Schema completeness", of(marked, n), schemaStatus, schemaStatus === "clear" ? "Clear" : schemaStatus === "wrong" ? "Wrong" : "Look", `${of(marked, n)} are marked complete. ${ABSENT_COLUMNS.join(" and ")} are not columns on this sheet, so they were not counted.`, "How many rows arrived complete. Under 95%, a later step is leaning on a hole. This sheet doesn't store the claim text, so complete isn't proof the claim arrived.", rows.filter((row) => !row.schemaComplete).map((row) => row.id));
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
	const reverify = card("reverify", "Re-check", of(checked.length, n), reverifyStatus, reverifyStatus === "clear" ? "Clear" : reverifyStatus === "wrong" ? "Wrong" : "Look", `${of(checked.length, n)} ${checked.length === 1 ? "names" : "name"} a result. ${na.length} ${na.length === 1 ? "says" : "say"} not applicable. ${empty.length} ${empty.length === 1 ? "is" : "are"} empty. ${mismatch.length} ${mismatch.length === 1 ? "says" : "say"} mismatch. ${split.length} ${split.length === 1 ? "note claims" : "notes claim"} a re-check while the cell is empty.`, "How many rows say a named fact was checked again. An empty cell means it wasn't, even if the note says it was.", [...new Set([
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
	const hash = card("hash", "Hash match", `${agreed.length} agree`, "look", "Look", `${of(withContent.length, n)} have a content hash. ${of(withConstraint.length, n)} have a constraint hash. ${agreed.length} notes match their content-hash cell. ${namedOnly.length} ${namedOnly.length === 1 ? "note names" : "notes name"} a hash the cell does not have. ${disagreed.length} ${disagreed.length === 1 ? "cell disagrees" : "cells disagree"} with the note. No second computed hash is stored, so the rest cannot be matched.`, "How many notes repeat the same hash as the cell. The sheet stores one hash, not a second copy, so most rows can't be matched.", [...namedOnly, ...disagreed].map((item) => item.row.id));
	const asked = rows.filter((row) => row.human);
	const human = card("human", "Person asked", of(asked.length, n), asked.length > 0 ? "look" : "clear", asked.length > 0 ? "Look" : "Clear", `${of(asked.length, n)} asked a person. This sheet has one day, so a spike cannot be seen.`, "How often a row waited for a person. A high number means the bots weren't sure.", asked.map((row) => row.id));
	const stopped = rows.filter((row) => isStop(row.cascade) || !row.schemaComplete);
	const criticFlags = rows.filter((row) => /flag/i.test(row.critic));
	const cascade = card("cascade", "Stops", String(stopped.length), stopped.length > 0 ? "look" : "clear", stopped.length > 0 ? "Look" : "Clear", `${stopped.length} ${stopped.length === 1 ? "stop" : "stops"}. ${criticFlags.length} critic ${criticFlags.length === 1 ? "flag is" : "flags are"} not counted as a stop.`, "Rows the gate held: a stop, or a row marked incomplete. A critic flag is a warning, not a stop.", [...new Set([...stopped, ...criticFlags].map((row) => row.id))]);
	let backupCard;
	if (backup === null) backupCard = card("backup", "Sheet and backup", "Not compared", "wrong", "Wrong", "The backup file is not in this workspace. These rows were not compared.", "The same row should be in the sheet and the backup. The backup isn't here, so a missed write wouldn't show.", []);
	else {
		const sheetIds = new Set(rows.map((row) => row.id));
		const backupIds = new Set(backup.ids);
		const missing = [...sheetIds].filter((id) => !backupIds.has(id));
		const extra = [...backupIds].filter((id) => !sheetIds.has(id));
		const same = missing.length === 0 && extra.length === 0;
		backupCard = card("backup", "Sheet and backup", same ? of(sheetIds.size, sheetIds.size) : "Differs", same ? "clear" : "wrong", same ? "Clear" : "Wrong", same ? `${sheetIds.size} row ids match the backup.` : `${missing.length} sheet ${missing.length === 1 ? "row is" : "rows are"} missing from the backup. ${extra.length} backup ${extra.length === 1 ? "row is" : "rows are"} not in this filter.`, "The same row id should be in the sheet and the backup. Matching counts isn't enough.", missing);
	}
	const tokens = rows.flatMap((row) => row.tokenEst === null ? [] : [row.tokenEst]);
	const times = rows.flatMap((row) => row.latencyMs === null ? [] : [row.latencyMs]);
	const tokenBlank = n - tokens.length;
	const timeBlank = n - times.length;
	const tokenSpan = tokens.length === 0 ? "no token numbers" : `${Math.min(...tokens)}–${Math.max(...tokens)}, ${middle(tokens)}`;
	const timeSpan = times.length === 0 ? "no time numbers" : `${Math.min(...times)}–${Math.max(...times)} ms, ${middle(times)}`;
	const size = card("size", "Size and time", headlineNumber(tokens), null, "Estimate", `Estimate. Tokens ${tokenSpan}. Time ${timeSpan}. ${tokenBlank} token ${tokenBlank === 1 ? "cell is" : "cells are"} blank. ${timeBlank} time ${timeBlank === 1 ? "cell is" : "cells are"} blank. A blank is not zero.`, "Rough size and wait. Tokens are a guess from the text, and a blank cell is not zero. Use this to spot a jump, not to price the work.", rows.filter((row) => row.tokenEst === null || row.latencyMs === null).map((row) => row.id));
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
	const confidence = card("confidence", "Confidence", confidenceFigure, confidenceStatus, confidenceStatus === "clear" ? "Clear" : "Look", `${lowText} ${numericRejected.length} rows give a count of discarded approaches, totaling ${discarded}. ${wordBit} ${blankRejected.length} ${blankRejected.length === 1 ? "is" : "are"} blank. A word is not zero.`, "The sender's own score, from 0 to 1, and how many approaches it says it dropped. A word like none is not a count.", [
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
/** Schema, autonomy, confidence, and audit go red under these rates. Tokens have no budget. */
var TARGETS = {
	schema: .9,
	autonomy: .8,
	confidence: .8,
	audit: .9
};
var PHASE = {
	intake_request: "Intake",
	rule_change: "Rules",
	cama_harvest: "Harvest",
	listing_lookup: "Listing",
	traffic_assign: "Traffic",
	sv_classify: "Street View",
	owner_resolve: "Owner",
	deed_lookup: "Deed",
	sale_select: "Sale",
	dm_lookup: "Deal Machine",
	tps_lookup: "People",
	ln_cwp_lookup: "Phones",
	merge_decision: "Who prints",
	build: "Excel",
	qa_auto: "Checks",
	qa_envoy: "Review",
	send: "Delivery",
	status_update: "Status",
	owner_report: "Note",
	smoke_test: "Test"
};
var LABELS = new Map(PIPELINE_STEPS.map((step) => [step.id, step.label]));
function ratio(part, total) {
	return total === 0 ? 0 : part / total;
}
function mean(values) {
	if (values.length === 0) return null;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function stampMs(row) {
	if (!row.iso) return 0;
	const ms = Date.parse(row.iso);
	return Number.isNaN(ms) ? 0 : ms;
}
function computeHealth(rows) {
	const empty = {
		eventCount: 0,
		latest: "",
		county: "No county",
		schemaRate: 0,
		schemaValid: 0,
		autonomyRate: 0,
		autoCount: 0,
		humanCount: 0,
		meanConfidence: null,
		confMin: null,
		confMax: null,
		avgTokens: null,
		totalTokens: 0,
		auditRate: 0,
		hashCount: 0,
		channels: [],
		steps: []
	};
	if (rows.length === 0) return empty;
	const n = rows.length;
	const schemaValid = rows.filter((row) => row.schemaComplete).length;
	const humanCount = rows.filter((row) => row.human).length;
	const confs = rows.flatMap((row) => row.confidence == null ? [] : [row.confidence]);
	const tokens = rows.flatMap((row) => row.tokenEst == null ? [] : [row.tokenEst]);
	const hashCount = rows.filter((row) => row.contentHash.trim() !== "").length;
	const counties = [...new Set(rows.map((row) => row.county).filter(Boolean))];
	const latest = [...rows].sort((a, b) => stampMs(b) - stampMs(a) || b.time.localeCompare(a.time))[0];
	const channelMap = /* @__PURE__ */ new Map();
	for (const row of rows) {
		const from = row.from || "(none)";
		const to = row.to || "(none)";
		const key = `${from}→${to}`;
		const existing = channelMap.get(key) ?? {
			from,
			to,
			handoffs: 0,
			fails: 0,
			passRate: 0,
			intervention: 0
		};
		existing.handoffs += 1;
		if (!row.schemaComplete) existing.fails += 1;
		if (row.human) existing.intervention += 1;
		channelMap.set(key, existing);
	}
	const channels = [...channelMap.values()].map((channel) => ({
		...channel,
		passRate: ratio(channel.handoffs - channel.fails, channel.handoffs),
		intervention: ratio(channel.intervention, channel.handoffs)
	})).sort((a, b) => b.handoffs - a.handoffs || a.from.localeCompare(b.from));
	const stepMap = /* @__PURE__ */ new Map();
	for (const row of rows) {
		const bucket = stepMap.get(row.step) ?? [];
		bucket.push(row);
		stepMap.set(row.step, bucket);
	}
	const steps = [...stepMap.entries()].map(([step, bucket]) => {
		const stepTokens = bucket.flatMap((row) => row.tokenEst == null ? [] : [row.tokenEst]);
		const flags = bucket.filter((row) => /flag/i.test(row.critic)).length;
		const passes = bucket.filter((row) => row.schemaComplete).length;
		const tokenMean = mean(stepTokens);
		return {
			step,
			label: LABELS.get(step) ?? step,
			phase: PHASE[step] ?? "Other",
			executions: bucket.length,
			passRate: ratio(passes, bucket.length),
			avgTokens: tokenMean == null ? 0 : Math.round(tokenMean),
			flags
		};
	}).sort((a, b) => a.passRate - b.passRate || b.flags - a.flags || a.label.localeCompare(b.label));
	const tokenMean = mean(tokens);
	const confMean = mean(confs);
	return {
		eventCount: n,
		latest: latest?.time ?? "",
		county: counties.length === 0 ? "No county" : counties.length === 1 ? counties[0] : `${counties.length} counties`,
		schemaRate: ratio(schemaValid, n),
		schemaValid,
		autonomyRate: ratio(n - humanCount, n),
		autoCount: n - humanCount,
		humanCount,
		meanConfidence: confMean,
		confMin: confs.length ? Math.min(...confs) : null,
		confMax: confs.length ? Math.max(...confs) : null,
		avgTokens: tokenMean == null ? null : Math.round(tokenMean),
		totalTokens: tokens.reduce((sum, value) => sum + value, 0),
		auditRate: ratio(hashCount, n),
		hashCount,
		channels,
		steps
	};
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
/** Log tab. The gviz CSV drops boolean TRUE cells; this export keeps them. */
var pullLiveLog = createServerFn({ method: "POST" }).handler(createSsrRpc("dc9e345ab2edb1f82359ea0be0cb3bcd5406410ac4f30d1fa3ad0f95ff59cb3f"));
/** Last full read baked into the app. Live poll replaces this when the Sheet opens. */
var FALLBACK_ROWS = rowsFromSheetText("timestamp,handoff_id,from_bot,to_bot,step_type,schema_complete,confidence,sources_refs,rejected_approaches,token_est,latency_ms,cascade_flags,critic_result,constraint_hash,outcome_notes,human_intervention,re_verify_result,content_hash,county_code\n2026-11-02T13:13:31+02:00,smoke-test-2026-11-02,Envoy,Acquisition Agent,smoke_test,TRUE,1,t412u,0,0,0,none,n/a (test),61f372e97a11,Smoke test of the logging pipeline only; no message sent to the Acquisition Agent,FALSE,,,\n2026-11-02T13:13:43+02:00,smoke-test-2026-11-02,Acquisition Agent,Envoy,smoke_test,TRUE,1,none (smoke test),none,0,0,none,pass,aca0ca1fa35a,Observability logging smoke test from Acquisition Agent; no real handoff,FALSE,,,\n2026-11-02T14:20:06+02:00,upgrade-smoke-2026-11-02,Acquisition Agent,Envoy,smoke_test,TRUE,1,/workspace/clayton-2026-10-28/clayton-2026-10-30-final-rev4.xlsx,none,406,0,none,pass,6cc3ddcd7359,Upgraded smoke test (schema 1.1); content_hash b8578ddf2e53; critical claim (rev4 sha256) re-verified: match,FALSE,,,\n2026-11-02T14:20:18+02:00,upgrade-smoke-2026-11-02,Envoy,Acquisition Agent,smoke_test,TRUE,1,t413u,0,432,0,none,n/a (test),61f372e97a11,Upgraded smoke test; content_hash 8df9628f531a,FALSE,clayton_md5 PASS; constraints_hash PASS,8df9628f531a,\n2026-11-02T14:31:45+02:00,workflow-recon-2026-11-02,Envoy,,owner_report,TRUE,0.85,t414u,0,1900,0,none,n/a,61f372e97a11,End-to-end workflow reconstruction sent; no AA message,FALSE,n/a (no AA handoff),,\n2026-11-02T14:53:12+02:00,dm-smoke-clayton-2026-11-02,Acquisition Agent,Envoy,dm_lookup,TRUE,1,/workspace/clayton-2026-10-28/dm/dm-batch-09.jsonl,none,356,0,none,pass,98c914d0b38a,Scoped smoke test v1.2; content_hash 67675399c0f0; claim re-verified: match,FALSE,dm-batch-09.jsonl line count (17) PASS,67675399c0f0,CLAYTON-GA\n2026-11-02T14:53:27+02:00,scope-smoke-qa_envoy-CLAYTON-GA-2026-11-02,Envoy,Acquisition Agent,qa_envoy,TRUE,1,t415u,1,666,1,none,flag: rev4 QA lacked owner checks,61f372e97a11,Scoped smoke test; no message sent to the Acquisition Agent,FALSE,rev4 files PASS,06bc62c0b933,CLAYTON-GA\n2026-11-02T15:50:17+02:00,dashboard-review-2026-11-02,Envoy,,owner_report,TRUE,0.9,t417u,0,620,,AA constraint_hash mismatch x3,12 gaps reported,61f372e97a11,Adversarial review of Metrics tab,FALSE,content_hash recompute 3/3 PASS,,\n2026-11-02T15:57:02+02:00,live-dashboard-review-2026-11-02,Envoy,,owner_report,TRUE,0.9,t421u,0,700,,none,13 gaps reported,61f372e97a11,Live dashboard review: corrections not deployed,FALSE,n/a (no AA handoff),,\n2026-11-02T15:59:33+02:00,clayton-e2e-internal-kickoff-2026-11-02,Envoy,Acquisition Agent,intake_request,TRUE,1,t422u,1,913,,none,flag: AA constraint hashes mismatch,61f372e97a11,Internal Clayton re-run kickoff sent. Owner-side GSCCCA held pending approval.,TRUE,rev4 md5 PASS,81e219ea48df,CLAYTON-GA\n2026-11-02T15:59:40+02:00,clayton-rerun-intake-2026-11-02,Acquisition Agent,Envoy,intake_request,FALSE,0.8,Envoy msg 15:59,1,,,incoming Envoy block empty,reject incoming block (no critical_claims/hash); plan sent and start held,465a36185092,Clayton internal re-run intake: plan and ETA sent. Start held.,TRUE,sorted-constraints claim recomputed PASS,a9247aeb55ae,CLAYTON-GA\n2026-11-02T16:00:34+02:00,clayton-e2e-internal-kickoff-2026-11-02,Envoy,Acquisition Agent,intake_request,TRUE,1,clayton-e2e-kickoff-block.json,1,,,none,accepted,61f372e97a11,Kickoff block received complete. Start still held.,TRUE,content_hash recomputed PASS,81e219ea48df,CLAYTON-GA\n2026-11-02T16:00:57+02:00,clayton-rerun-gsccca-approval-2026-11-02,Envoy,Acquisition Agent,rule_change,TRUE,1,widget 16:00,0,,,none,n/a,465a36185092,GSCCCA approved for Clayton owners and sales in this run.,TRUE,n/a (approval relay),636050f55bc9,CLAYTON-GA\n2026-11-02T16:03:22+02:00,clayton-rerun-start-2026-11-02,Envoy,Acquisition Agent,rule_change,TRUE,1,t425u,1,690,,none,n/a,b867a943aa17,Start now. No second go-ahead. Rules file is constraints-v2.,FALSE,verbatim quote checked,80f055ae7b20,CLAYTON-GA\n2026-11-02T16:04:40+02:00,clayton-rerun-started-2026-11-02,Acquisition Agent,Envoy,status_update,FALSE,0.95,constraints-v2.txt,1,436,,none,pass,b867a943aa17,\"Run started 16:04. Phase A is running: intake, parcel harvest, listing, traffic, Street View list, and the owner worklist.\",FALSE,start block content_hash PASS,f1565869182b,CLAYTON-GA\n2026-11-02T16:06:16+02:00,clayton-rerun-intake_request-2026-11-02,Acquisition Agent,Acquisition Agent,intake_request,TRUE,1,rules-frozen.json,1,710,63311,none,pass,b867a943aa17,\"Rules frozen. New folder created. Constraints-v2, owner gates, and phone format copied in.\",FALSE,start block content_hash recompute PASS,589443ae0995,CLAYTON-GA\n2026-11-02T16:03:45+02:00,clayton-rerun-start-2026-11-02-recv,Envoy,Acquisition Agent,rule_change,TRUE,1,Envoy msg 16:03,1,,,none,accepted,b867a943aa17,Start received. Constraints-v2 adopted. The re-run starts.,FALSE,v2 constraint hash PASS,80f055ae7b20,CLAYTON-GA\n2026-11-02T16:16:58+02:00,clayton-rerun-cama_harvest-2026-11-02,Acquisition Agent,Acquisition Agent,cama_harvest,TRUE,0.9,/workspace/clayton-rerun-2026-11-02/cama-stats.json,3,892,626536,none,pass with flags: county site needed a relay,b867a943aa17,4602 commercial parcels. 583 centers. 247 kept.,FALSE,ledger lesson count 136 recount PASS,f90162b53c8a,CLAYTON-GA\n");
var FALLBACK_READ_AT = "2 Nov, 16:16";
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
	const [time, setTime] = (0, import_react.useState)("latest");
	const [tab, setTab] = (0, import_react.useState)("steps");
	const [copied, setCopied] = (0, import_react.useState)(null);
	const [open, setOpen] = (0, import_react.useState)(null);
	const [pinned, setPinned] = (0, import_react.useState)(null);
	const [rowsAll, setRowsAll] = (0, import_react.useState)(FALLBACK_ROWS);
	const [live, setLive] = (0, import_react.useState)(false);
	const [readAt, setReadAt] = (0, import_react.useState)(FALLBACK_READ_AT);
	const [feedNote, setFeedNote] = (0, import_react.useState)("Sheet copy.");
	(0, import_react.useEffect)(() => {
		let alive = true;
		async function load() {
			try {
				const next = await pullLiveLog();
				if (!alive) return;
				if (next.live && next.rows.length > 0) {
					setRowsAll(next.rows);
					setLive(true);
					setReadAt(next.readAt ? displayTime(next.readAt) : "just now");
					setFeedNote("Live sheet. Refreshes every 15 seconds.");
					return;
				}
				setLive(false);
				setFeedNote("Sheet copy.");
			} catch {
				if (!alive) return;
				setLive(false);
				setFeedNote("Sheet copy.");
			}
		}
		load();
		const timer = window.setInterval(load, 15e3);
		return () => {
			alive = false;
			window.clearInterval(timer);
		};
	}, []);
	const starts = (0, import_react.useMemo)(() => runStarts(rowsAll), [rowsAll]);
	const newest = starts[starts.length - 1];
	const claytonStart = (0, import_react.useMemo)(() => {
		const clayton = rowsAll.find((row) => row.county === "CLAYTON-GA" && /clayton-(rerun|e2e)/i.test(row.handoffId));
		if (!clayton) return null;
		const label = rowRunLabel(rowsAll, clayton);
		return starts.includes(label) ? label : null;
	}, [rowsAll, starts]);
	const timeActive = time === "all" ? "all" : starts.includes(time) ? time : claytonStart ?? newest ?? "all";
	const rows = (0, import_react.useMemo)(() => {
		return rowsAll.filter((row) => {
			if (county !== "all" && row.county !== county) return false;
			if (timeActive !== "all" && rowRunLabel(rowsAll, row) !== timeActive) return false;
			return true;
		});
	}, [
		rowsAll,
		county,
		timeActive
	]);
	const steps = stepCoverage(rows);
	const metrics = (0, import_react.useMemo)(() => metricBoard(rows, null), [rows]);
	const health = (0, import_react.useMemo)(() => computeHealth(rows), [rows]);
	const progress = (0, import_react.useMemo)(() => runProgress(county === "all" || county === "CLAYTON-GA" ? rowsAll.filter((row) => timeActive === "all" || rowRunLabel(rowsAll, row) === timeActive) : rows), [
		county,
		rows,
		rowsAll,
		timeActive
	]);
	const stepAttention = steps.filter((step) => step.status === "look" || step.status === "wrong");
	const metricWrong = metrics.filter((metric) => metric.status === "wrong");
	const metricLook = metrics.filter((metric) => metric.status === "look");
	const headline = progress && tab === "steps" ? `Clayton re-run is on ${progress.nowLabel}.` : tab === "steps" ? stepAttention.length === 0 ? "Nothing needs you." : stepAttention.length === 1 ? `1 step needs you: ${stepAttention[0].label}.` : `${stepAttention.length} steps need you.` : metricWrong.length === 0 && metricLook.length === 0 ? "Nothing needs you." : [metricWrong.length === 1 ? "1 is wrong." : metricWrong.length > 1 ? `${metricWrong.length} are wrong.` : "", metricLook.length === 1 ? "1 needs a look." : metricLook.length > 1 ? `${metricLook.length} need a look.` : ""].filter(Boolean).join(" ");
	function copyTrace(id) {
		navigator.clipboard.writeText(id).then(() => {
			setCopied(id);
			window.setTimeout(() => setCopied((current) => current === id ? null : current), 1200);
		}, () => void 0);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: `mx-auto flex w-full flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 ${tab === "metrics" ? "max-w-5xl" : "max-w-2xl"}`,
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
								live ? "Live" : "Saved",
								" · ",
								readAt,
								" · ",
								rowsAll.length,
								" rows. ",
								feedNote
							]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeSwitch, {})]
				}),
				progress && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RunBar, { progress }),
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
						}), counties(rowsAll).map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: name,
							children: name
						}, name))]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Filter, {
						label: "Time",
						value: timeActive,
						onChange: setTime,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "all",
							children: "All times"
						}), starts.map((stamp) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
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
								children: step.traceIds.map((id, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => copyTrace(id),
									className: "break-all text-left font-mono text-xs text-faint underline decoration-line underline-offset-2",
									children: copied === id ? "Copied" : id
								}, `${id}-${index}`))
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
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HealthView, { health }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm text-muted",
					children: "Drift"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
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
									children: metric.traceIds.map((id, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => copyTrace(id),
										className: "break-all text-left font-mono text-xs text-faint underline decoration-line underline-offset-2",
										children: copied === id ? "Copied" : id
									}, `${id}-${index}`))
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
			})]
		})]
	});
}
function HealthView({ health }) {
	const pct = (value) => `${Math.round(value * 100)}%`;
	const rateTone = (value, target) => value >= target ? "text-ok" : "text-bad";
	const confText = health.meanConfidence == null ? "—" : pct(health.meanConfidence);
	const confRange = health.confMin == null || health.confMax == null ? "No confidence logged" : `${health.confMin.toFixed(2)}–${health.confMax.toFixed(2)}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					health.eventCount,
					" events · Latest ",
					health.latest || "—",
					" · ",
					health.county
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Score, {
						label: "Schema integrity",
						figure: pct(health.schemaRate),
						detail: `${health.schemaValid} of ${health.eventCount} complete`,
						target: "Target 90%",
						toneClass: rateTone(health.schemaRate, TARGETS.schema),
						tip: "Share of handoffs that arrived with a complete schema. Under 90%, a later step is working from a hole."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Score, {
						label: "Autonomy",
						figure: pct(health.autonomyRate),
						detail: `${health.autoCount} auto · ${health.humanCount} asked a person`,
						target: "Target 80%",
						toneClass: rateTone(health.autonomyRate, TARGETS.autonomy),
						tip: "Share of rows that finished without asking a person. Under 80%, the run is leaning on you."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Score, {
						label: "Confidence",
						figure: confText,
						detail: confRange,
						target: "Target 80%",
						toneClass: health.meanConfidence == null ? "text-faint" : rateTone(health.meanConfidence, TARGETS.confidence),
						tip: "Average self-reported confidence on the rows in this filter. Under 80% is a weak read."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Score, {
						label: "Avg tokens",
						figure: health.avgTokens == null ? "—" : String(health.avgTokens),
						detail: `${health.totalTokens.toLocaleString()} total`,
						target: "Estimate",
						toneClass: "text-fg",
						tip: "Mean of the token estimates on these rows. The sheet does not store exact token counts."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Score, {
						label: "Audit rate",
						figure: pct(health.auditRate),
						detail: `${health.hashCount} of ${health.eventCount} have a content hash`,
						target: "Target 90%",
						toneClass: rateTone(health.auditRate, TARGETS.audit),
						tip: "Share of rows that carry a content hash. Under 90%, most handoffs cannot be checked later."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-2 text-sm text-muted",
				children: "Channels"
			}), health.channels.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No handoffs in this filter."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-card border border-line bg-panel",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[36rem] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "From"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "To"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Handoffs"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Fails"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Pass"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Asked"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: health.channels.map((channel) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: channel.from
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: channel.to
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: channel.handoffs
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: channel.fails
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: `px-3 py-2 ${rateTone(channel.passRate, TARGETS.schema)}`,
								children: pct(channel.passRate)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: pct(channel.intervention)
							})
						]
					}, `${channel.from}-${channel.to}`)) })]
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-2 text-sm text-muted",
				children: "Steps"
			}), health.steps.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No steps in this filter."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-card border border-line bg-panel",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[40rem] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Step"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Phase"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Runs"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Pass"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Tokens"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Flags"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: health.steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: step.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 text-muted",
								children: step.phase
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: step.executions
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: `px-3 py-2 ${rateTone(step.passRate, TARGETS.schema)}`,
								children: pct(step.passRate)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: step.avgTokens
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: step.flags
							})
						]
					}, step.step)) })]
				})
			})] })
		]
	});
}
function Score({ label, figure, detail, target, toneClass, tip }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-card border border-line bg-panel px-3 py-3",
		title: tip,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: `font-display text-2xl ${toneClass}`,
				children: figure
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs leading-relaxed text-muted",
				children: detail
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-faint",
				children: target
			})
		]
	});
}
function RunBar({ progress }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"aria-label": "Clayton re-run progress",
		className: "rounded-card border border-line bg-panel px-4 py-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Clayton re-run"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm font-medium text-fg",
					children: [
						progress.done,
						" of ",
						progress.total
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-lg text-fg",
				children: ["Now: ", progress.nowLabel]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm leading-relaxed text-muted",
				children: progress.nowNote
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-3 flex gap-1",
				"aria-label": `${progress.done} of ${progress.total} stages logged`,
				children: progress.stages.map((stage) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					title: stage.label,
					className: `h-2 flex-1 rounded-full ${stage.state === "now" ? "bg-watch" : stage.state === "done" ? "bg-ok" : "bg-line"}`
				}, stage.id))
			})
		]
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
	const [theme, setTheme] = (0, import_react.useState)("lite");
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

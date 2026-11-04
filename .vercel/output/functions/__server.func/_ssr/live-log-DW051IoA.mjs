import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { a as rowsFromSheetText } from "./parse-sheet-DXmZB-nm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/live-log-DW051IoA.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var SHEET_ID = "1v29s_KuYX-eNUnmFSjuZK_sWE2mqAPq7_FIiYjLUCS4";
var PUBLIC_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=1292550318`;
function sheetText(data) {
	if (typeof data === "string") return data;
	if (data && typeof data === "object" && "content" in data && typeof data.content === "string") return data.content;
	return "";
}
async function publicLogCsv() {
	const response = await fetch(PUBLIC_CSV, { headers: { "cache-control": "no-cache" } });
	if (!response.ok) return null;
	const text = await response.text();
	if (!text.includes("handoff_id") || !text.includes("timestamp")) return null;
	return text;
}
function pack(rows) {
	if (rows.filter((row) => row.step !== "smoke_test" && row.county !== "TEST").length === 0) return {
		live: false,
		pending: false,
		error: "No production rows in the sheet",
		readAt: null,
		rows: []
	};
	return {
		live: true,
		pending: false,
		error: null,
		readAt: (/* @__PURE__ */ new Date()).toISOString(),
		rows
	};
}
var pullLiveLog_createServerFn_handler = createServerRpc({
	id: "dc9e345ab2edb1f82359ea0be0cb3bcd5406410ac4f30d1fa3ad0f95ff59cb3f",
	name: "pullLiveLog",
	filename: "src/lib/live-log.ts"
}, (opts) => pullLiveLog.__executeServer(opts));
var pullLiveLog = createServerFn({ method: "POST" }).handler(pullLiveLog_createServerFn_handler, async () => {
	try {
		const csv = await publicLogCsv();
		if (csv) {
			const rows = rowsFromSheetText(csv);
			if (rows.length > 0) return pack(rows);
		}
	} catch {}
	try {
		const { callTool } = await import("./client.server-D9aFGIQm.mjs");
		const { ConnectorType } = await import("./types-D617htJ2.mjs").then((n) => n.a);
		const result = await callTool("google_drive_read_file", {
			file_id: SHEET_ID,
			max_chars: 25e4
		}, { connectorType: ConnectorType.GoogleDrive });
		if (!result.ok) return {
			live: false,
			pending: result.pending === true,
			error: result.errorMessage ?? "Sheet read failed",
			readAt: null,
			rows: []
		};
		const rows = rowsFromSheetText(sheetText(result.data));
		if (rows.length === 0) return {
			live: false,
			pending: false,
			error: "Sheet came back empty",
			readAt: null,
			rows: []
		};
		return pack(rows);
	} catch (error) {
		return {
			live: false,
			pending: false,
			error: error instanceof Error ? error.message : "Sheet read failed",
			readAt: null,
			rows: []
		};
	}
});
//#endregion
export { pullLiveLog_createServerFn_handler };

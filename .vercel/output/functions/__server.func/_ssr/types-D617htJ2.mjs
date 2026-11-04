//#region node_modules/.nitro/vite/services/ssr/assets/types-D617htJ2.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var types_exports = /* @__PURE__ */ __exportAll({
	CONNECTOR_TOKEN_HEADER: () => CONNECTOR_TOKEN_HEADER,
	CONNECTOR_TOKEN_PENDING_CODE: () => CONNECTOR_TOKEN_PENDING_CODE,
	CONNECTOR_TOKEN_READY_EVENT: () => CONNECTOR_TOKEN_READY_EVENT,
	ConnectorType: () => ConnectorType
});
var CONNECTOR_TOKEN_HEADER = "x-connector-access-token";
var CONNECTOR_TOKEN_PENDING_CODE = "connector_token_pending";
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
var ConnectorType = {
	GoogleDrive: "GoogleDrive",
	Gmail: "Gmail",
	GoogleCalendar: "GoogleCalendar",
	Outlook: "Outlook",
	OutlookCalendar: "OutlookCalendar",
	MicrosoftTeams: "MicrosoftTeams",
	Mcp: "Mcp"
};
//#endregion
export { types_exports as a, ConnectorType as i, CONNECTOR_TOKEN_PENDING_CODE as n, CONNECTOR_TOKEN_READY_EVENT as r };

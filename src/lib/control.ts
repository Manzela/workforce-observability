import { counties, publicText, reason, rowStatus, stepCoverage } from "./evaluate.ts";
import { clockMs } from "./parse-sheet.ts";
import { PIPELINE_STEPS, type LogRow, type Status } from "../data/log.ts";

export type AttentionItem = {
  id: string;
  label: string;
  status: Status;
  what: string;
  where: string;
  time: string;
  traceId: string;
};

export type Attention = {
  issues: AttentionItem[];
  working: AttentionItem[];
};

export type LatestEvent = {
  label: string;
  status: Status;
  what: string;
  where: string;
  traceId: string;
  county: string;
  time: string;
};

export type CountyWatch = {
  county: string;
  wrong: number;
  look: number;
  clear: number;
  latestLabel: string;
  latestStatus: Status;
  latestWhat: string;
  latestTime: string;
};

function stepLabel(step: string): string {
  return PIPELINE_STEPS.find((item) => item.id === step)?.label ?? (step ? `Other · ${step}` : "Unknown step");
}

function whereOf(row: LogRow): string {
  const hop = [row.from, row.to].filter(Boolean).join(" → ");
  return publicText([row.county, row.time, hop].filter(Boolean).join(" · "));
}

function whatOf(row: LogRow, status: Status): string {
  if (status === "clear") return "Complete.";
  return reason(row) ?? "Needs a look.";
}

function newest(rows: LogRow[]): LogRow | null {
  if (rows.length === 0) return null;
  return rows.reduce((best, row) => (clockMs(row.iso ?? "") >= clockMs(best.iso ?? "") ? row : best));
}

/** Newest row on the whole feed, including counties the current filter hides. */
export function latestEvent(rows: LogRow[]): LatestEvent | null {
  const row = newest(rows);
  if (!row) return null;
  const status = rowStatus(row);
  return {
    label: stepLabel(row.step),
    status,
    what: whatOf(row, status),
    where: whereOf(row),
    traceId: row.id,
    county: row.county,
    time: row.time,
  };
}

/** Logged steps in this filter, split into what needs a person and what is clear. */
export function attention(rows: LogRow[]): Attention {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const issues: AttentionItem[] = [];
  const working: AttentionItem[] = [];
  for (const step of stepCoverage(rows)) {
    if (!step.status) continue;
    const row = step.traceIds.map((id) => byId.get(id)).find((item) => item);
    if (!row) continue;
    const item: AttentionItem = {
      id: step.id,
      label: step.label,
      status: step.status,
      what: step.status === "clear" ? "Complete." : (step.reason ?? "Needs a look."),
      where: whereOf(row),
      time: row.time,
      traceId: row.id,
    };
    if (step.status === "clear") working.push(item);
    else issues.push(item);
  }
  issues.sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === "wrong" ? -1 : 1;
  });
  return { issues, working };
}

/** One line per county, from the latest row of each step, worst counties first. */
export function countyWatch(rows: LogRow[]): CountyWatch[] {
  return counties(rows)
    .map((county) => {
      const mine = rows.filter((row) => row.county === county);
      const board = attention(mine);
      const latest = latestEvent(mine);
      return {
        county,
        wrong: board.issues.filter((item) => item.status === "wrong").length,
        look: board.issues.filter((item) => item.status === "look").length,
        clear: board.working.length,
        latestLabel: latest?.label ?? "",
        latestStatus: latest?.status ?? "look",
        latestWhat: latest?.what ?? "",
        latestTime: latest?.time ?? "",
      };
    })
    .sort((a, b) => b.wrong - a.wrong || b.look - a.look || a.county.localeCompare(b.county));
}

/** Bar color for one stage. A logged failure stays a failure, including stages before the current one. */
export function stageMark(state: "waiting" | "done" | "now", status: Status | null): "bad" | "watch" | "ok" | "line" {
  if (status === "wrong") return "bad";
  if (status === "look") return "watch";
  if (status === "clear") return "ok";
  if (state === "now") return "watch";
  return "line";
}

export function feedWord(live: boolean, stale: boolean): string {
  if (stale) return "Last live";
  return live ? "Live" : "Saved";
}

export function feedFailureNote(hadLive: boolean): string {
  return hadLive ? "Last live read. The sheet did not answer." : "Sheet copy.";
}

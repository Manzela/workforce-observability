import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bug, Moon, Sun } from "lucide-react";
import { counties, stepCoverage } from "@/lib/evaluate";
import { attention, countyWatch, feedFailureNote, feedWord, latestEvent, stageMark, type CountyWatch } from "@/lib/control";
import { explainStep } from "@/lib/plain";
import { activeRunId, displayTime, runId, runProgress, runsForCounty, type RunProgress } from "@/lib/parse-sheet";
import { pullLiveLog } from "@/lib/live-log";
import { sheetHealth, type SheetHealth, type SpanRow } from "@/lib/sheet-health";
import { FALLBACK_READ_AT, FALLBACK_ROWS } from "@/data/fallback";
import type { LogRow, Status } from "@/data/log";

const STATUS_WORD: Record<Status, string> = {
  clear: "Clear",
  look: "Look",
  wrong: "Wrong",
};

type Theme = "lite" | "dark";

function tone(status: Status | null) {
  if (status === "clear") return "text-ok";
  if (status === "look") return "text-watch";
  if (status === "wrong") return "text-bad";
  return "text-faint";
}

function dot(status: Status | null) {
  if (status === "clear") return "bg-ok";
  if (status === "look") return "bg-watch";
  if (status === "wrong") return "bg-bad";
  return "bg-line";
}

export function Dashboard() {
  const [county, setCounty] = useState("all");
  const [time, setTime] = useState("latest");
  const [tab, setTab] = useState<"steps" | "metrics">("steps");
  const [copied, setCopied] = useState<string | null>(null);
  const [debugOpen, setDebugOpen] = useState<string | null>(null);
  const [rowsAll, setRowsAll] = useState<LogRow[]>(FALLBACK_ROWS);
  const [counted, setCounted] = useState<LogRow[]>(FALLBACK_ROWS);
  const [spans, setSpans] = useState<SpanRow[]>([]);
  const [spansOk, setSpansOk] = useState(false);
  const [live, setLive] = useState(false);
  const [readAt, setReadAt] = useState(FALLBACK_READ_AT);
  const [feedNote, setFeedNote] = useState("Sheet copy.");
  const [stale, setStale] = useState(false);
  const alive = useRef(true);
  const heldLive = useRef(false);

  const pull = useCallback(async () => {
    try {
      const next = await pullLiveLog();
      if (!alive.current) return;
      if (next.rows.length > 0) {
        setRowsAll(next.rows);
        setCounted(next.counted.length > 0 ? next.counted : next.rows);
        setSpans(next.spans);
        setSpansOk(next.spansOk);
        setLive(next.live);
        setStale(false);
        if (next.live) heldLive.current = true;
        setReadAt(next.readAt ? displayTime(next.readAt) : "just now");
        setFeedNote(next.live ? "" : "The sheet has no production rows.");
        return;
      }
      setLive(false);
      setStale(heldLive.current);
      setFeedNote(feedFailureNote(heldLive.current));
    } catch {
      if (!alive.current) return;
      setLive(false);
      setStale(heldLive.current);
      setFeedNote(feedFailureNote(heldLive.current));
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    void pull();
    const timer = window.setInterval(() => {
      void pull();
    }, 15000);
    return () => {
      alive.current = false;
      window.clearInterval(timer);
    };
  }, [pull]);

  const starts = useMemo(() => runsForCounty(rowsAll, county), [rowsAll, county]);
  const claytonStart = useMemo(() => {
    const clayton = rowsAll.find(
      (row) => row.county === "CLAYTON-GA" && /clayton-(rerun|e2e)/i.test(row.handoffId),
    );
    if (!clayton) return null;
    const id = runId(rowsAll, clayton);
    return runsForCounty(rowsAll, "all").find((start) => start.id === id) ?? null;
  }, [rowsAll]);
  const timeActive = activeRunId(starts, time, county === "all" ? (claytonStart?.id ?? null) : null);

  const rows = useMemo(() => {
    return rowsAll.filter((row) => {
      if (county !== "all" && row.county !== county) return false;
      if (timeActive !== "all" && runId(rowsAll, row) !== timeActive) return false;
      return true;
    });
  }, [rowsAll, county, timeActive]);

  const steps = stepCoverage(rows);
  const progressRows = useMemo(() => {
    if (county === "all" || county === "CLAYTON-GA") {
      return rowsAll.filter((row) => timeActive === "all" || runId(rowsAll, row) === timeActive);
    }
    return rows;
  }, [county, rows, rowsAll, timeActive]);
  const progress = useMemo(() => runProgress(progressRows), [progressRows]);
  const barRows = useMemo(() => {
    if (progress?.title !== "Clayton re-run") return progressRows;
    const clayton = progressRows.filter(
      (row) => row.county === "CLAYTON-GA" && /clayton-(rerun|e2e)/i.test(row.handoffId),
    );
    return clayton.length > 0 ? clayton : progressRows;
  }, [progress, progressRows]);
  const barSteps = useMemo(() => stepCoverage(barRows), [barRows]);
  const nowId = progress?.stages.find((stage) => stage.state === "now")?.id ?? null;
  const nowForList = timeActive === "all" && county === "all" ? null : nowId;
  const board = useMemo(() => attention(rows, nowForList), [rows, nowForList]);
  const watch = useMemo(() => countyWatch(rowsAll), [rowsAll]);
  const latest = useMemo(() => latestEvent(rowsAll), [rowsAll]);
  const latestInView = latest ? rows.some((row) => row.id === latest.traceId) : true;
  const report = useMemo(() => sheetHealth(counted, spans, spansOk), [counted, spans, spansOk]);
  const stepAttention = steps.filter((step) => step.status === "look" || step.status === "wrong");
  const headline =
    rows.length === 0
      ? county === "all"
        ? "No rows for this time."
        : `No rows for ${county}.`
      : tab === "steps"
      ? stepAttention.length === 0
        ? progress
          ? `${progress.title} is on ${progress.nowLabel}.`
          : "Nothing needs you."
        : stepAttention.length === 1
          ? progress
            ? `${progress.title}: 1 step needs you, ${stepAttention[0].label}.`
            : `1 step needs you: ${stepAttention[0].label}.`
          : progress
            ? `${progress.title}: ${stepAttention.length} steps need you.`
            : `${stepAttention.length} steps need you.`
      : report.headline;

  function copyTrace(id: string) {
    void navigator.clipboard.writeText(id).then(
      () => {
        setCopied(id);
        window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1200);
      },
      () => undefined,
    );
  }

  return (
    <main className={`mx-auto flex w-full flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 ${tab === "metrics" ? "max-w-5xl" : "max-w-2xl"}`}>
      <header className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-fg">Workforce Observability</h1>
            <p className="mt-1 text-base text-fg">{headline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-xs text-faint">
                {feedWord(live, stale)} · {readAt} · {rowsAll.length} rows{feedNote ? `. ${feedNote}` : ""}
              </p>
            </div>
          </div>
          <ThemeSwitch />
        </div>
        {watch.length > 0 && (
          <section aria-label="Counties on the sheet" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {watch.map((item) => (
              <CountyChip
                key={item.county}
                item={item}
                pressed={county === item.county}
                onChoose={() => {
                  setCounty(item.county);
                  setTime("all");
                }}
              />
            ))}
          </section>
        )}
        {latest && (
          <section aria-label="Latest log" className="rounded-card border border-line bg-panel px-4 py-4">
            <p className="text-sm text-muted">Latest on the sheet</p>
            <p className="mt-1 flex items-baseline justify-between gap-3">
              <span className="text-lg text-fg">{latest.label}</span>
              <span className={`text-sm font-medium ${tone(latest.status)}`}>{STATUS_WORD[latest.status]}</span>
            </p>
            <p className="mt-1 text-sm leading-relaxed text-fg">{latest.what}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{latest.where}</p>
            {!latestInView && latest.county && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted">This log is outside the county and time selected below.</p>
                <button
                  type="button"
                  className="min-h-11 rounded-full border border-line bg-ink px-3 text-sm font-medium text-fg"
                  onClick={() => {
                    setCounty(latest.county);
                    setTime("all");
                  }}
                >
                  Show {latest.county}
                </button>
              </div>
            )}
          </section>
        )}
        {progress && (
          <RunBar
            progress={progress}
            nowText={nowId ? explainStep(barRows, nowId, true).summary : progress.nowNote}
            statusByStep={new Map(barSteps.map((step) => [step.id, step.status]))}
          />
        )}
        <div role="tablist" aria-label="View" className="flex w-fit rounded-full border border-line bg-panel p-1">
          <TabButton active={tab === "steps"} onClick={() => setTab("steps")}>
            Steps
          </TabButton>
          <TabButton active={tab === "metrics"} onClick={() => setTab("metrics")}>
            Metrics
          </TabButton>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Filter label="County" value={county} onChange={setCounty}>
            <option value="all">All counties</option>
            {counties(rowsAll).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Filter>
          <Filter label="Time" value={timeActive} onChange={setTime}>
            <option value="all">All times</option>
            {starts.map((stamp) => (
              <option key={stamp.id} value={stamp.id}>
                {stamp.label}
              </option>
            ))}
          </Filter>
        </div>
      </header>

      {tab === "steps" ? (
      <>
      <section aria-label="This view" className="rounded-card border border-line bg-panel px-4 py-4">
        <h2 className="text-sm text-muted">Needs you</h2>
        <p className="mt-1 text-sm text-faint">
          {timeActive === "all" ? "Latest row of each step in this county." : "In the county and time selected above."}
        </p>
        {board.issues.length === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-fg">Nothing in this view needs you.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {board.issues.map((item) => (
              <li key={item.id} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="text-base text-fg">{item.label}</span>
                  <span className={`shrink-0 text-sm font-medium ${tone(item.status)}`}>{STATUS_WORD[item.status]}</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-fg">{item.what}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.where}</p>
              </li>
            ))}
          </ul>
        )}
        <h2 className="mt-4 text-sm text-muted">Working</h2>
        {board.working.length === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-fg">Nothing in this view is clear.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {board.working.map((item) => (
              <li key={item.id} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="text-base text-fg">{item.label}</span>
                  <span className="shrink-0 text-sm font-medium text-ok">Clear</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-fg">{item.what}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.where}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <ol className="flex flex-col gap-1">
        {steps.map((step) => {
          const face = explainStep(rows, step.id, step.id === nowForList);
          const shown = debugOpen === step.id;
          return (
            <li key={step.id} className="rounded-card border border-line bg-panel">
              <div className="flex items-start">
                <div className="min-w-0 flex-1 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`size-2.5 shrink-0 rounded-full ${dot(step.status)}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1 text-base text-fg">{step.label}</span>
                    <span className={`shrink-0 text-sm font-medium ${tone(step.status)}`}>
                      {step.status ? STATUS_WORD[step.status] : "Not logged"}
                    </span>
                  </div>
                  <p className="mt-1 pl-5 text-sm leading-relaxed text-fg">{face.summary}</p>
                  {face.where && <p className="mt-1 pl-5 text-sm leading-relaxed text-muted">{face.where}</p>}
                </div>
                {face.debug.length > 0 && (
                  <button
                    type="button"
                    aria-label={shown ? "Hide debug log" : "Show debug log"}
                    aria-expanded={shown}
                    aria-controls={`debug-${step.id}`}
                    onClick={() => setDebugOpen((current) => (current === step.id ? null : step.id))}
                    className="mt-1 mr-1 grid min-h-11 min-w-11 place-items-center rounded-full text-faint"
                  >
                    <Bug className="size-4" strokeWidth={2} aria-hidden="true" />
                  </button>
                )}
              </div>
              {shown && (
                <div id={`debug-${step.id}`} className="border-t border-line px-4 py-3">
                  {face.debug.map((line, index) => {
                    const trace = line.startsWith("Trace: ") ? line.slice("Trace: ".length) : null;
                    if (!trace) {
                      return (
                        <p key={`${step.id}-${index}`} className="break-words font-mono text-xs leading-relaxed text-muted">
                          {line}
                        </p>
                      );
                    }
                    return (
                      <button
                        key={`${step.id}-${index}`}
                        type="button"
                        onClick={() => copyTrace(trace)}
                        className="block break-all text-left font-mono text-xs leading-relaxed text-faint underline decoration-line underline-offset-2"
                      >
                        {copied === trace ? "Copied" : line}
                      </button>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      </>
      ) : (
        <HealthSheet report={report} live={live} />
      )}
    </main>
  );
}

function oneDecimal(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function HealthSheet({ report, live }: { report: SheetHealth; live: boolean }) {
  const schemaOk = report.schemaRate >= 0.9;
  const autonomyOk = report.autonomyRate >= 0.8;
  const confText = report.meanConfidence == null ? "—" : oneDecimal(report.meanConfidence);
  const confRange =
    report.confMin == null || report.confMax == null
      ? "No confidence logged"
      : `${report.confMin.toFixed(2)} to ${report.confMax.toFixed(2)}`;
  const latest = report.latest ? displayTime(report.latest) : "—";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted">
        {live
          ? "Counted with the health tab's formulas, on every log row, including test rows. A saved health tab can lag this live count."
          : "Saved copy. These numbers update when the sheet answers."}{" "}
        {report.eventCount} events. Latest {latest}
        {report.latestCounty ? ` · ${report.latestCounty}` : ""}.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Score
          label="Schema integrity"
          figure={oneDecimal(report.schemaRate)}
          detail={`${report.schemaValid} of ${report.eventCount} rows arrived complete.`}
          target="Target 90%."
          toneClass={schemaOk ? "text-ok" : "text-bad"}
        />
        <Score
          label="Workforce autonomy"
          figure={oneDecimal(report.autonomyRate)}
          detail={
            report.eventCount - report.autoCount - report.humanCount > 0
              ? `${report.autoCount} finished alone. ${report.humanCount} asked a person. ${report.eventCount - report.autoCount - report.humanCount} don't say.`
              : `${report.autoCount} finished alone. ${report.humanCount} asked a person.`
          }
          target="Target 80%."
          toneClass={autonomyOk ? "text-ok" : "text-bad"}
        />
        <Score
          label="Mean confidence"
          figure={confText}
          detail={confRange}
          target="The sheet sets no cutoff."
          toneClass="text-fg"
        />
        <Score
          label="Avg token intensity"
          figure={report.avgTokens == null ? "—" : String(report.avgTokens)}
          detail={
            report.tokenRows === 0
              ? "No token estimates on the log."
              : `${report.totalTokens.toLocaleString()} tokens across ${report.tokenRows} rows.`
          }
          target="Blank cells are left out."
          toneClass="text-fg"
        />
        <Score
          label="Telemetry audit rate"
          figure={oneDecimal(report.auditRate)}
          detail={`${report.hashCount} of ${report.eventCount} rows have a content hash.`}
          target="The sheet sets no cutoff."
          toneClass="text-fg"
        />
      </div>
      <section>
        <h2 className="mb-1 text-sm text-muted">Channels</h2>
        <p className="mb-2 text-sm leading-relaxed text-muted">
          Handoffs between people and agents. Internal work steps are left out, the same way the health tab leaves them out.
        </p>
        {report.channels.length === 0 ? (
          <p className="text-sm text-muted">No handoffs on the log.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-line bg-panel">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">From</th>
                  <th className="px-3 py-2 font-medium">To</th>
                  <th className="px-3 py-2 font-medium">Handoffs</th>
                  <th className="px-3 py-2 font-medium">Schema fails</th>
                  <th className="px-3 py-2 font-medium">Pass</th>
                  <th className="px-3 py-2 font-medium">Asked a person</th>
                </tr>
              </thead>
              <tbody>
                {report.channels.map((channel) => (
                  <tr key={`${channel.from}-${channel.to}`} className="border-t border-line">
                    <td className="px-3 py-2">{channel.from}</td>
                    <td className="px-3 py-2">
                      {channel.to}
                      {channel.extra ? <span className="mt-1 block text-xs text-faint">On the log. The health tab has no row for this pair.</span> : null}
                    </td>
                    <td className="px-3 py-2">{channel.handoffs}</td>
                    <td className="px-3 py-2">{channel.fails}</td>
                    <td className="px-3 py-2">{oneDecimal(channel.passRate)}</td>
                    <td className="px-3 py-2">{oneDecimal(channel.intervention)}</td>
                  </tr>
                ))}
                {report.channelTotal && (
                  <tr className="border-t border-line font-medium">
                    <td className="px-3 py-2">Total</td>
                    <td className="px-3 py-2 text-muted">The four pairs on the health tab.</td>
                    <td className="px-3 py-2">{report.channelTotal.handoffs}</td>
                    <td className="px-3 py-2">{report.channelTotal.fails}</td>
                    <td className="px-3 py-2">{oneDecimal(report.channelTotal.passRate)}</td>
                    <td className="px-3 py-2">{oneDecimal(report.channelTotal.intervention)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-1 text-sm text-muted">Steps</h2>
        <p className="mb-2 text-sm leading-relaxed text-muted">
          From the trace spans. A run is one handoff id. Pending spans stay out of the pass rate. Fail and partial spans are the flags.
        </p>
        {!report.spansLoaded ? (
          <p className="text-sm text-muted">Trace spans did not load, so this table is empty. The scores above still come from the log.</p>
        ) : report.steps.length === 0 ? (
          <p className="text-sm text-muted">No internal steps in the trace spans.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-line bg-panel">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Step</th>
                  <th className="px-3 py-2 font-medium">Phase</th>
                  <th className="px-3 py-2 font-medium">Executions</th>
                  <th className="px-3 py-2 font-medium">Pass</th>
                  <th className="px-3 py-2 font-medium">Avg tokens</th>
                  <th className="px-3 py-2 font-medium">Flags</th>
                </tr>
              </thead>
              <tbody>
                {report.steps.map((step) => (
                  <tr key={step.step} className="border-t border-line">
                    <td className="px-3 py-2">{step.step}</td>
                    <td className="px-3 py-2 text-muted">{step.phase}</td>
                    <td className="px-3 py-2">{step.executions}</td>
                    <td className="px-3 py-2">{oneDecimal(step.passRate)}</td>
                    <td className="px-3 py-2">{step.avgTokens}</td>
                    <td className={`px-3 py-2 ${step.flags > 0 ? "text-bad" : ""}`}>{step.flags}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-sm leading-relaxed text-faint">
          Avg tokens stay n/a here. Trace rows don't carry a token estimate. The token score above is from the log.
        </p>
      </section>
      {report.logOnly.length > 0 && (
        <section>
          <h2 className="mb-1 text-sm text-muted">Also on the log</h2>
          <p className="mb-2 text-sm leading-relaxed text-muted">
            These steps are on the log. The span table above doesn't list them, and they still count in the scores.
          </p>
          <ul className="flex flex-col gap-2">
            {report.logOnly.map((step) => (
              <li key={step.step} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-fg">
                  {step.step} <span className="text-muted">· {step.phase}</span>
                </span>
                <span className="shrink-0 text-muted">{step.rows} {step.rows === 1 ? "row" : "rows"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Score({
  label,
  figure,
  detail,
  target,
  toneClass,
}: {
  label: string;
  figure: string;
  detail: string;
  target: string;
  toneClass: string;
}) {
  return (
    <div className="rounded-card border border-line bg-panel px-3 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-display text-2xl ${toneClass}`}>{figure}</p>
      <p className="text-xs leading-relaxed text-muted">{detail}</p>
      <p className="text-xs text-faint">{target}</p>
    </div>
  );
}

function watchParts(item: CountyWatch): { text: string; toneClass: string }[] {
  const parts: { text: string; toneClass: string }[] = [];
  if (item.wrong > 0) parts.push({ text: `${item.wrong} wrong`, toneClass: "text-bad" });
  if (item.look > 0) parts.push({ text: `${item.look} to look at`, toneClass: "text-watch" });
  parts.push({ text: `${item.clear} clear`, toneClass: "text-ok" });
  return parts;
}

function CountyChip({
  item,
  pressed,
  onChoose,
}: {
  item: CountyWatch;
  pressed: boolean;
  onChoose: () => void;
}) {
  const parts = watchParts(item);
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onChoose}
      className={`min-h-11 rounded-card border px-4 py-3 text-left ${pressed ? "border-fg bg-panel" : "border-line bg-panel"}`}
    >
      <span className="block text-base text-fg">{item.county}</span>
      <span className="mt-1 block text-sm font-medium">
        {parts.map((part, index) => (
          <span key={part.text}>
            {index > 0 ? " · " : ""}
            <span className={part.toneClass}>{part.text}</span>
          </span>
        ))}
      </span>
      <span className="mt-1 block text-sm leading-relaxed text-muted">
        {item.latestLabel} · {STATUS_WORD[item.latestStatus]} · {item.latestTime}
      </span>
      <span className="mt-1 block text-sm leading-relaxed text-fg">{item.latestWhat}</span>
    </button>
  );
}

const STAGE_BAR = { bad: "bg-bad", watch: "bg-watch", ok: "bg-ok", line: "bg-line" } as const;

function RunBar({
  progress,
  nowText,
  statusByStep,
}: {
  progress: RunProgress;
  nowText: string;
  statusByStep: Map<string, Status | null>;
}) {
  return (
    <section aria-label={`${progress.title} progress`} className="rounded-card border border-line bg-panel px-4 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted">{progress.title}</p>
        <p className="text-sm font-medium text-fg">
          {progress.done} of {progress.total}
        </p>
      </div>
      <p className="mt-1 text-lg text-fg">Now: {progress.nowLabel}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{nowText}</p>
      <ol className="mt-3 flex gap-1" aria-label={`${progress.done} of ${progress.total} stages logged`}>
        {progress.stages.map((stage) => {
          const status = statusByStep.get(stage.id) ?? null;
          const word = status ? STATUS_WORD[status] : "Not logged";
          return (
            <li
              key={stage.id}
              title={`${stage.label} · ${word}`}
              className={`h-2 flex-1 rounded-full ${STAGE_BAR[stageMark(stage.state, status)]} ${
                stage.state === "now" ? "ring-2 ring-fg ring-offset-1 ring-offset-panel" : ""
              }`}
            />
          );
        })}
      </ol>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`min-h-11 rounded-full px-4 text-sm font-medium ${active ? "bg-fg text-ink" : "text-muted"}`}
    >
      {children}
    </button>
  );
}

function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>("lite");

  useEffect(() => {
    const stored = document.documentElement.dataset.theme;
    if (stored === "lite" || stored === "dark") setTheme(stored);
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("workforce-theme", next);
  }

  return (
    <div className="flex shrink-0 rounded-full border border-line bg-panel p-0.5" role="group" aria-label="Color mode">
      <ModeButton active={theme === "lite"} label="Lite" onClick={() => choose("lite")}>
        <Sun className="size-3.5" strokeWidth={2} aria-hidden="true" />
      </ModeButton>
      <ModeButton active={theme === "dark"} label="Dark" onClick={() => choose("dark")}>
        <Moon className="size-3.5" strokeWidth={2} aria-hidden="true" />
      </ModeButton>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
      className={`group relative grid size-7 place-items-center rounded-full ${
        active ? "bg-fg text-ink" : "text-muted"
      }`}
    >
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-1/2 z-30 mt-1 -translate-x-1/2 rounded border border-line bg-ink px-1.5 py-0.5 text-[11px] leading-none whitespace-nowrap text-fg opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {label}
      </span>
    </button>
  );
}

function Filter({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-muted">
      {label}
      <select
        className="min-h-11 rounded-xl border border-line bg-ink px-3 text-base text-fg"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

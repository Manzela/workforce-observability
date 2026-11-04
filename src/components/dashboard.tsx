import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { counties, stepCoverage } from "@/lib/evaluate";
import { metricBoard } from "@/lib/metrics";
import { computeHealth, TARGETS, type Health } from "@/lib/health";
import { attention, countyWatch, feedFailureNote, feedWord, latestEvent, stageMark, type CountyWatch } from "@/lib/control";
import { activeRunId, displayTime, runId, runProgress, runsForCounty, type RunProgress } from "@/lib/parse-sheet";
import { pullLiveLog } from "@/lib/live-log";
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
  const [open, setOpen] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [rowsAll, setRowsAll] = useState<LogRow[]>(FALLBACK_ROWS);
  const [live, setLive] = useState(false);
  const [readAt, setReadAt] = useState(FALLBACK_READ_AT);
  const [feedNote, setFeedNote] = useState("Sheet copy.");
  const [stale, setStale] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const alive = useRef(true);
  const heldLive = useRef(false);

  const pull = useCallback(async (manual: boolean) => {
    if (manual) setRefreshing(true);
    try {
      const next = await pullLiveLog();
      if (!alive.current) return;
      if (next.rows.length > 0) {
        setRowsAll(next.rows);
        setLive(next.live);
        setStale(false);
        if (next.live) heldLive.current = true;
        setReadAt(next.readAt ? displayTime(next.readAt) : "just now");
        setFeedNote(
          next.live
            ? "Live sheet. Refreshes every 15 seconds."
            : "Not live. The sheet has no production rows.",
        );
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
    } finally {
      if (manual && alive.current) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    void pull(false);
    const timer = window.setInterval(() => {
      void pull(false);
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
  const board = useMemo(() => attention(rows), [rows]);
  const watch = useMemo(() => countyWatch(rowsAll), [rowsAll]);
  const latest = useMemo(() => latestEvent(rowsAll), [rowsAll]);
  const latestInView = latest ? rows.some((row) => row.id === latest.traceId) : true;
  const metrics = useMemo(() => metricBoard(rows, null), [rows]);
  const health = useMemo(() => computeHealth(rows), [rows]);
  const progress = useMemo(
    () =>
      runProgress(
        county === "all" || county === "CLAYTON-GA"
          ? rowsAll.filter((row) => timeActive === "all" || runId(rowsAll, row) === timeActive)
          : rows,
      ),
    [county, rows, rowsAll, timeActive],
  );
  const stepAttention = steps.filter((step) => step.status === "look" || step.status === "wrong");
  const metricWrong = metrics.filter((metric) => metric.status === "wrong");
  const metricLook = metrics.filter((metric) => metric.status === "look");
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
      : metricWrong.length === 0 && metricLook.length === 0
        ? "Nothing needs you."
        : [
            metricWrong.length === 1 ? "1 is wrong." : metricWrong.length > 1 ? `${metricWrong.length} are wrong.` : "",
            metricLook.length === 1 ? "1 needs a look." : metricLook.length > 1 ? `${metricLook.length} need a look.` : "",
          ]
            .filter(Boolean)
            .join(" ");

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
                {feedWord(live, stale)} · {readAt} · {rowsAll.length} rows. {feedNote}
              </p>
              <button
                type="button"
                onClick={() => void pull(true)}
                disabled={refreshing}
                className="min-h-11 rounded-full border border-line bg-panel px-3 text-sm font-medium text-fg disabled:text-faint"
              >
                {refreshing ? "Refreshing" : "Refresh"}
              </button>
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
          <RunBar progress={progress} statusByStep={new Map(steps.map((step) => [step.id, step.status]))} />
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
        <p className="mt-2 text-sm leading-relaxed text-fg">
          {board.working.length === 0
            ? "Nothing in this view is clear."
            : board.working.map((item) => `${item.label} · ${item.time}`).join(", ")}
        </p>
      </section>
      <ol className="flex flex-col gap-1">
        {steps.map((step) => {
          const shown = open === step.id || pinned === step.id;
          return (
            <li
              key={step.id}
              className={`relative rounded-card border border-line bg-panel ${shown ? "z-20" : ""}`}
              onMouseEnter={() => setOpen(step.id)}
              onMouseLeave={() => setOpen((current) => (current === step.id ? null : current))}
            >
              <button
                type="button"
                className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left"
                aria-expanded={shown}
                aria-describedby={shown ? `tip-${step.id}` : undefined}
                onClick={() => setPinned((current) => (current === step.id ? null : step.id))}
              >
                <span className={`size-2.5 shrink-0 rounded-full ${dot(step.status)}`} aria-hidden="true" />
                <span className="min-w-0 flex-1 text-base text-fg">{step.label}</span>
                <span className={`shrink-0 text-sm font-medium ${tone(step.status)}`}>
                  {step.status ? STATUS_WORD[step.status] : "Not logged"}
                </span>
              </button>
              {(step.reason || step.sources || step.traceIds.length > 0) && (
                <div className="px-4 pb-3 pl-9">
                  {step.reason && <p className="text-sm leading-relaxed text-muted">{step.reason}</p>}
                  {step.sources && <p className="mt-1 text-sm leading-relaxed text-muted">Sources: {step.sources}</p>}
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {step.traceIds.map((id, index) => (
                      <button
                        key={`${id}-${index}`}
                        type="button"
                        onClick={() => copyTrace(id)}
                        className="break-all text-left font-mono text-xs text-faint underline decoration-line underline-offset-2"
                      >
                        {copied === id ? "Copied" : id}
                      </button>
                    ))}
                  </p>
                </div>
              )}
              {shown && (
                <div
                  id={`tip-${step.id}`}
                  role="tooltip"
                  className="absolute left-3 right-3 top-full z-30 mt-1 rounded-xl border border-line bg-ink px-3 py-3 text-sm leading-relaxed text-fg shadow-lg"
                >
                  {step.tip}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      </>
      ) : (
        <div className="flex flex-col gap-6">
          <HealthView health={health} />
          <section className="flex flex-col gap-3">
            <h2 className="text-sm text-muted">Drift</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {metrics.map((metric) => {
            const shown = open === metric.id || pinned === metric.id;
            return (
              <article
                key={metric.id}
                className={`relative rounded-card border border-line bg-panel ${shown ? "z-20" : ""}`}
                onMouseEnter={() => setOpen(metric.id)}
                onMouseLeave={() => setOpen((current) => (current === metric.id ? null : current))}
              >
                <button
                  type="button"
                  className="flex w-full flex-col gap-2 px-4 py-4 text-left"
                  aria-expanded={shown}
                  aria-describedby={shown ? `tip-${metric.id}` : undefined}
                  onClick={() => setPinned((current) => (current === metric.id ? null : metric.id))}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted">{metric.label}</span>
                    <span className={`shrink-0 text-sm font-medium ${tone(metric.status)}`}>{metric.word}</span>
                  </span>
                  <span className="font-display text-3xl text-fg">{metric.figure}</span>
                  <span className="text-sm leading-relaxed text-muted">{metric.result}</span>
                </button>
                {metric.traceIds.length > 0 && (
                  <p className="flex flex-wrap gap-x-3 gap-y-1 px-4 pb-4">
                    {metric.traceIds.map((id, index) => (
                      <button
                        key={`${id}-${index}`}
                        type="button"
                        onClick={() => copyTrace(id)}
                        className="break-all text-left font-mono text-xs text-faint underline decoration-line underline-offset-2"
                      >
                        {copied === id ? "Copied" : id}
                      </button>
                    ))}
                  </p>
                )}
                {shown && (
                  <div
                    id={`tip-${metric.id}`}
                    role="tooltip"
                    className="absolute left-3 right-3 top-full z-30 mt-1 rounded-xl border border-line bg-ink px-3 py-3 text-sm leading-relaxed text-fg shadow-lg"
                  >
                    {metric.tip}
                  </div>
                )}
              </article>
            );
          })}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function HealthView({ health }: { health: Health }) {
  const pct = (value: number) => `${Math.round(value * 100)}%`;
  const rateTone = (value: number, target: number) => (value >= target ? "text-ok" : "text-bad");
  const confText =
    health.meanConfidence == null
      ? "—"
      : pct(health.meanConfidence);
  const confRange =
    health.confMin == null || health.confMax == null
      ? "No confidence logged"
      : `${health.confMin.toFixed(2)}–${health.confMax.toFixed(2)}`;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        {health.eventCount} events · Latest {health.latest || "—"} · {health.county}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Score
          label="Schema integrity"
          figure={pct(health.schemaRate)}
          detail={`${health.schemaValid} of ${health.eventCount} complete`}
          target="Target 90%"
          toneClass={rateTone(health.schemaRate, TARGETS.schema)}
          tip="Share of handoffs that arrived with a complete schema. Under 90%, a later step is working from a hole."
        />
        <Score
          label="Autonomy"
          figure={pct(health.autonomyRate)}
          detail={`${health.autoCount} auto · ${health.humanCount} asked a person`}
          target="Target 80%"
          toneClass={rateTone(health.autonomyRate, TARGETS.autonomy)}
          tip="Share of rows that finished without asking a person. Under 80%, the run is leaning on you."
        />
        <Score
          label="Confidence"
          figure={confText}
          detail={confRange}
          target="Target 80%"
          toneClass={health.meanConfidence == null ? "text-faint" : rateTone(health.meanConfidence, TARGETS.confidence)}
          tip="Average self-reported confidence on the rows in this filter. Under 80% is a weak read."
        />
        <Score
          label="Avg tokens"
          figure={health.avgTokens == null ? "—" : String(health.avgTokens)}
          detail={`${health.totalTokens.toLocaleString()} total`}
          target="Estimate"
          toneClass="text-fg"
          tip="Mean of the token estimates on these rows. The sheet does not store exact token counts."
        />
        <Score
          label="Audit rate"
          figure={pct(health.auditRate)}
          detail={`${health.hashCount} of ${health.eventCount} have a content hash`}
          target="Target 90%"
          toneClass={rateTone(health.auditRate, TARGETS.audit)}
          tip="Share of rows that carry a content hash. Under 90%, most handoffs cannot be checked later."
        />
      </div>
      <section>
        <h2 className="mb-2 text-sm text-muted">Channels</h2>
        {health.channels.length === 0 ? (
          <p className="text-sm text-muted">No handoffs in this filter.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-line bg-panel">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">From</th>
                  <th className="px-3 py-2 font-medium">To</th>
                  <th className="px-3 py-2 font-medium">Handoffs</th>
                  <th className="px-3 py-2 font-medium">Fails</th>
                  <th className="px-3 py-2 font-medium">Pass</th>
                  <th className="px-3 py-2 font-medium">Asked</th>
                </tr>
              </thead>
              <tbody>
                {health.channels.map((channel) => (
                  <tr key={`${channel.from}-${channel.to}`} className="border-t border-line">
                    <td className="px-3 py-2">{channel.from}</td>
                    <td className="px-3 py-2">{channel.to}</td>
                    <td className="px-3 py-2">{channel.handoffs}</td>
                    <td className="px-3 py-2">{channel.fails}</td>
                    <td className={`px-3 py-2 ${rateTone(channel.passRate, TARGETS.schema)}`}>{pct(channel.passRate)}</td>
                    <td className="px-3 py-2">{pct(channel.intervention)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-2 text-sm text-muted">Steps</h2>
        {health.steps.length === 0 ? (
          <p className="text-sm text-muted">No steps in this filter.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-line bg-panel">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Step</th>
                  <th className="px-3 py-2 font-medium">Phase</th>
                  <th className="px-3 py-2 font-medium">Runs</th>
                  <th className="px-3 py-2 font-medium">Pass</th>
                  <th className="px-3 py-2 font-medium">Tokens</th>
                  <th className="px-3 py-2 font-medium">Flags</th>
                </tr>
              </thead>
              <tbody>
                {health.steps.map((step) => (
                  <tr key={step.step} className="border-t border-line">
                    <td className="px-3 py-2">{step.label}</td>
                    <td className="px-3 py-2 text-muted">{step.phase}</td>
                    <td className="px-3 py-2">{step.executions}</td>
                    <td className={`px-3 py-2 ${rateTone(step.passRate, TARGETS.schema)}`}>{pct(step.passRate)}</td>
                    <td className="px-3 py-2">{step.avgTokens == null ? "—" : step.avgTokens}</td>
                    <td className="px-3 py-2">{step.flags}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Score({
  label,
  figure,
  detail,
  target,
  toneClass,
  tip,
}: {
  label: string;
  figure: string;
  detail: string;
  target: string;
  toneClass: string;
  tip: string;
}) {
  return (
    <div className="rounded-card border border-line bg-panel px-3 py-3" title={tip}>
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

function RunBar({ progress, statusByStep }: { progress: RunProgress; statusByStep: Map<string, Status | null> }) {
  return (
    <section aria-label={`${progress.title} progress`} className="rounded-card border border-line bg-panel px-4 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted">{progress.title}</p>
        <p className="text-sm font-medium text-fg">
          {progress.done} of {progress.total}
        </p>
      </div>
      <p className="mt-1 text-lg text-fg">Now: {progress.nowLabel}</p>
      <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted" title={progress.nowNote}>
        {progress.nowNote}
      </p>
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

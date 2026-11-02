import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SNAPSHOT_ROWS, counties, stepCoverage, times } from "@/lib/evaluate";
import { metricBoard } from "@/lib/metrics";
import { SHEET_COPY } from "@/data/log";
import type { Status } from "@/data/log";

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
  const [time, setTime] = useState("all");
  const [tab, setTab] = useState<"steps" | "metrics">("steps");
  const [copied, setCopied] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);

  const rows = useMemo(() => {
    return SNAPSHOT_ROWS.filter((row) => {
      if (county !== "all" && row.county !== county) return false;
      if (time !== "all" && row.time !== time) return false;
      return true;
    });
  }, [county, time]);

  const steps = stepCoverage(rows);
  const metrics = useMemo(() => metricBoard(rows, null), [rows]);
  const stepAttention = steps.filter((step) => step.status === "look" || step.status === "wrong");
  const metricWrong = metrics.filter((metric) => metric.status === "wrong");
  const metricLook = metrics.filter((metric) => metric.status === "look");
  const headline =
    tab === "steps"
      ? stepAttention.length === 0
        ? "Nothing needs you."
        : stepAttention.length === 1
          ? `1 step needs you: ${stepAttention[0].label}.`
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
    <main className={`mx-auto flex w-full flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 ${tab === "metrics" ? "max-w-3xl" : "max-w-2xl"}`}>
      <header className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-fg">Workforce Observability</h1>
            <p className="mt-1 text-base text-fg">{headline}</p>
            <p className="mt-1 text-xs text-faint">
              Sheet copy, {SHEET_COPY.readAt}. {SHEET_COPY.rows} rows. Not a live feed.
            </p>
          </div>
          <ThemeSwitch />
        </div>
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
            {counties(SNAPSHOT_ROWS).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Filter>
          <Filter label="Time" value={time} onChange={setTime}>
            <option value="all">All times</option>
            {times(SNAPSHOT_ROWS).map((stamp) => (
              <option key={stamp} value={stamp}>
                {stamp}
              </option>
            ))}
          </Filter>
        </div>
      </header>

      {tab === "steps" ? (
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
              {(step.reason || step.traceIds.length > 0) && (
                <div className="px-4 pb-3 pl-9">
                  {step.reason && <p className="text-sm leading-relaxed text-muted">{step.reason}</p>}
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {step.traceIds.map((id) => (
                      <button
                        key={id}
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
      ) : (
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
                    {metric.traceIds.map((id) => (
                      <button
                        key={id}
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
      )}
    </main>
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
  const [theme, setTheme] = useState<Theme>("dark");

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
    <div className="flex shrink-0 rounded-full border border-line bg-panel p-1" role="group" aria-label="Color mode">
      <ModeButton active={theme === "lite"} onClick={() => choose("lite")}>
        Lite
      </ModeButton>
      <ModeButton active={theme === "dark"} onClick={() => choose("dark")}>
        Dark
      </ModeButton>
    </div>
  );
}

function ModeButton({
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
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 rounded-full px-3 text-sm font-medium ${
        active ? "bg-fg text-ink" : "text-muted"
      }`}
    >
      {children}
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

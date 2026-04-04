import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRuns } from "@/store/RunsContext";
import { formatDate } from "@/utils/format";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";

const chartTooltipStyle = {
  backgroundColor: "hsl(var(--chart-tooltip-bg))",
  border: "1px solid hsl(var(--chart-tooltip-border))",
  borderRadius: "6px",
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
  color: "hsl(var(--chart-tooltip-text))",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};
const gridStroke = "hsl(var(--chart-grid))";
const tickStyle = { fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(var(--chart-tick))" };

// Categorize error messages into actionable groups
function categorizeError(error?: string): string {
  if (!error) return "Unknown";
  const e = error.toLowerCase();
  if (e.includes("timeout")) return "Timeout";
  if (e.includes("net::err") || e.includes("502") || e.includes("503") || e.includes("connection")) return "Network";
  if (e.includes("not found") || e.includes("no element matches")) return "Element Not Found";
  if (e.includes("expected") && (e.includes("url") || e.includes("text") || e.includes("got"))) return "State Mismatch";
  if (e.includes("typeerror") || e.includes("referenceerror") || e.includes("cannot read")) return "Script Error";
  if (e.includes("assert")) return "Assertion";
  return "Other";
}

const CATEGORY_COLORS: Record<string, string> = {
  "Timeout": "hsl(var(--warning))",
  "Network": "hsl(var(--destructive))",
  "Element Not Found": "hsl(38, 80%, 55%)",
  "State Mismatch": "hsl(var(--primary))",
  "Script Error": "hsl(280, 60%, 55%)",
  "Assertion": "hsl(0, 72%, 60%)",
  "Other": "hsl(var(--muted-foreground))",
  "Unknown": "hsl(var(--muted-foreground))",
};

const CATEGORY_ICONS: Record<string, string> = {
  "Timeout": "⏱️",
  "Network": "🌐",
  "Element Not Found": "🔍",
  "State Mismatch": "🔀",
  "Script Error": "💥",
  "Assertion": "❌",
  "Other": "❓",
  "Unknown": "❓",
};

const CATEGORY_TIPS: Record<string, string> = {
  "Timeout": "Consider increasing timeout values, adding waitFor conditions, or checking if the target element loads lazily.",
  "Network": "Backend service may be down or unreachable. Check API health, CORS, or network proxy configurations.",
  "Element Not Found": "Selector may have changed. Update locators, use data-testid attributes, or add waitForSelector before interaction.",
  "State Mismatch": "App may not be in the expected state. Ensure proper setup/teardown, check redirects, and verify test isolation.",
  "Script Error": "A runtime JS error in your test code. Check for null references, undefined variables, or incorrect type usage.",
  "Assertion": "Expected value didn't match actual. Review test expectations, check if the feature behavior changed.",
  "Other": "Review the error message for specific details.",
  "Unknown": "No error message captured. Ensure your reporter captures error details.",
};

const TestDetailPage = () => {
  const { testName } = useParams<{ testName: string }>();
  const navigate = useNavigate();
  const { runs, loading } = useRuns();

  const decodedName = testName ? decodeURIComponent(testName) : "";

  const history = useMemo(() => {
    const sorted = [...runs].sort(
      (a, b) => new Date(a.manifest.timestamp).getTime() - new Date(b.manifest.timestamp).getTime()
    );
    return sorted
      .map((run) => {
        const test = run.results.find((t) => t.name === decodedName);
        if (!test) return null;
        return { run: run.manifest, test };
      })
      .filter(Boolean) as { run: typeof runs[0]["manifest"]; test: typeof runs[0]["results"][0] }[];
  }, [runs, decodedName]);

  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const passed = history.filter((h) => h.test.status === "passed").length;
    const failed = history.filter((h) => h.test.status === "failed").length;
    const flaky = history.filter((h) => h.test.retries > 0).length;
    const avgDuration = Math.round(history.reduce((s, h) => s + h.test.duration, 0) / history.length);
    const totalRetries = history.reduce((s, h) => s + h.test.retries, 0);
    return { passed, failed, flaky, avgDuration, totalRetries, total: history.length };
  }, [history]);

  // Pass/Fail trend data
  const statusTrendData = useMemo(
    () => history.map((h) => ({
      date: new Date(h.run.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      status: h.test.status,
      passed: h.test.status === "passed" ? 1 : 0,
      failed: h.test.status === "failed" ? 1 : 0,
      skipped: h.test.status === "skipped" ? 1 : 0,
    })),
    [history]
  );

  // Failure cause analysis
  const failureCauses = useMemo(() => {
    const failures = history.filter((h) => h.test.status === "failed");
    const causeMap = new Map<string, { count: number; errors: string[]; lastSeen: string }>();
    for (const f of failures) {
      const category = categorizeError(f.test.error);
      const entry = causeMap.get(category) || { count: 0, errors: [], lastSeen: "" };
      entry.count++;
      if (f.test.error && entry.errors.length < 3) {
        const firstLine = f.test.error.split("\n")[0];
        if (!entry.errors.includes(firstLine)) entry.errors.push(firstLine);
      }
      entry.lastSeen = f.run.timestamp;
      causeMap.set(category, entry);
    }
    return [...causeMap.entries()]
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [history]);

  const durationData = useMemo(
    () => history.map((h) => ({
      date: new Date(h.run.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      duration: h.test.duration,
    })),
    [history]
  );

  const retryData = useMemo(
    () => history.map((h) => ({
      date: new Date(h.run.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      retries: h.test.retries,
    })),
    [history]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="font-mono text-muted-foreground">Test not found across any runs</p>
        <Button variant="outline" onClick={() => navigate(-1)}>← Go Back</Button>
      </div>
    );
  }

  const testPassRate = stats ? Math.round((stats.passed / stats.total) * 100) : 0;
  const isFlaky = stats ? stats.flaky >= 2 : false;
  const latestResult = history[history.length - 1];
  const totalFailures = stats?.failed || 0;

  return (
    <div className="container py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-mono text-sm sm:text-base font-semibold text-foreground break-words">{decodedName}</h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {stats?.total} of {runs.length} runs
              {history.length > 0 && ` · First seen ${new Date(history[0].run.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            </span>
            <StatusBadge status={latestResult.test.status} />
            {isFlaky && (
              <Badge variant="outline" className="font-mono text-[10px] bg-warning/10 text-warning border-warning/30">⚡ Flaky</Badge>
            )}
            {latestResult.test.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="font-mono text-[10px]">{tag}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          <StatCard label="Pass Rate" value={`${testPassRate}%`} variant={testPassRate >= 95 ? "success" : testPassRate >= 80 ? "warning" : "destructive"} />
          <StatCard label="Passed" value={stats.passed} variant="success" />
          <StatCard label="Failed" value={stats.failed} variant={stats.failed > 0 ? "destructive" : "success"} />
          <StatCard label="Avg Duration" value={`${stats.avgDuration}ms`} />
          <StatCard label="Total Retries" value={stats.totalRetries} variant={stats.totalRetries > 0 ? "warning" : "default"} />
          <StatCard label="Flaky Runs" value={stats.flaky} variant={stats.flaky > 0 ? "warning" : "default"} />
        </div>
      )}

      {/* Pass/Fail Trend */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Pass / Fail Trend</h2>
        <div className="h-32 sm:h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusTrendData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" tick={tickStyle} />
              <YAxis tick={tickStyle} domain={[0, 1]} ticks={[0, 1]} tickFormatter={(v) => v === 1 ? "✓" : "✗"} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(_v: number, name: string) => {
                  if (name === "passed") return ["Passed", "Status"];
                  if (name === "failed") return ["Failed", "Status"];
                  return ["Skipped", "Status"];
                }}
                labelFormatter={(label) => `Run: ${label}`}
              />
              <Bar dataKey="passed" stackId="status" fill="hsl(var(--success))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="failed" stackId="status" fill="hsl(var(--destructive))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="skipped" stackId="status" fill="hsl(var(--skipped))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Failure Cause Analysis */}
      {totalFailures > 0 && failureCauses.length > 0 && (
        <section className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Failure Cause Analysis</h2>
            <span className="text-xs text-muted-foreground font-mono">{totalFailures} failures across {history.length} runs</span>
          </div>

          {/* Cause breakdown bar */}
          <div className="flex h-3 rounded-full overflow-hidden bg-muted">
            {failureCauses.map((cause) => (
              <div
                key={cause.category}
                className="h-full transition-all"
                style={{
                  width: `${(cause.count / totalFailures) * 100}%`,
                  backgroundColor: CATEGORY_COLORS[cause.category],
                }}
                title={`${cause.category}: ${cause.count}`}
              />
            ))}
          </div>

          {/* Cause details */}
          <div className="space-y-2">
            {failureCauses.map((cause) => (
              <div key={cause.category} className="rounded-md border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{CATEGORY_ICONS[cause.category]}</span>
                    <span className="font-mono text-xs font-semibold text-foreground">{cause.category}</span>
                    <span
                      className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[cause.category]}20`,
                        color: CATEGORY_COLORS[cause.category],
                      }}
                    >
                      {cause.count}× ({Math.round((cause.count / totalFailures) * 100)}%)
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Last: {new Date(cause.lastSeen).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>

                {/* Sample errors */}
                <div className="space-y-1">
                  {cause.errors.map((err, i) => (
                    <pre key={i} className="font-mono text-[10px] text-destructive/70 truncate">{err}</pre>
                  ))}
                </div>

                {/* Actionable tip */}
                <div className="flex items-start gap-1.5 pt-1 border-t border-border/30">
                  <span className="text-[10px]">💡</span>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {CATEGORY_TIPS[cause.category]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Duration chart */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Duration Over Time (ms)</h2>
        <div className="h-44 sm:h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={durationData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" tick={tickStyle} />
              <YAxis tick={tickStyle} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}ms`, "Duration"]} />
              <Line type="monotone" dataKey="duration" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Retries */}
      {stats && stats.totalRetries > 0 && (
        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Retries Per Run</h2>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retryData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" tick={tickStyle} />
                <YAxis tick={tickStyle} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="retries" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Run History */}
      <section>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Run History</h2>
        <div className="space-y-1">
          {[...history].reverse().map((h) => (
            <button
              key={h.run.runId}
              onClick={() => navigate(`/run/${encodeURIComponent(h.run.runId)}`)}
              className="w-full text-left flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-md border bg-card hover:bg-accent/30 transition-colors shadow-sm"
            >
              <StatusBadge status={h.test.status} />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-foreground truncate">{h.run.runId}</p>
                <p className="text-[10px] text-muted-foreground">{formatDate(h.run.timestamp)}</p>
              </div>
              <span className="font-mono text-xs text-muted-foreground shrink-0">{h.test.duration}ms</span>
              {h.test.retries > 0 && (
                <Badge variant="outline" className="font-mono text-[10px] bg-warning/10 text-warning border-warning/30">{h.test.retries}r</Badge>
              )}
              {h.test.error && (
                <Badge variant="outline" className="font-mono text-[10px] bg-destructive/10 text-destructive border-destructive/30">
                  {categorizeError(h.test.error)}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default TestDetailPage;

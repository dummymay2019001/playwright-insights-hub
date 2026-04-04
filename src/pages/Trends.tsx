import { useMemo } from "react";
import { useRuns } from "@/store/RunsContext";
import { useNavigate } from "react-router-dom";
import { passRate, formatDate } from "@/utils/format";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";

const chartTooltipStyle = {
  backgroundColor: "hsl(222, 44%, 9%)",
  border: "1px solid hsl(220, 30%, 16%)",
  borderRadius: "6px",
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
  color: "hsl(210, 40%, 93%)",
};

const TrendsPage = () => {
  const { runs, loading } = useRuns();
  const navigate = useNavigate();

  const sorted = useMemo(
    () => [...runs].sort((a, b) => new Date(a.manifest.timestamp).getTime() - new Date(b.manifest.timestamp).getTime()),
    [runs]
  );

  const chartData = useMemo(
    () =>
      sorted.map((r) => ({
        date: new Date(r.manifest.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        passRate: passRate(r.manifest),
        failures: r.manifest.failed,
        duration: r.manifest.duration,
        runId: r.manifest.runId,
      })),
    [sorted]
  );

  // Run comparison: latest vs previous
  const comparison = useMemo(() => {
    if (sorted.length < 2) return null;
    const curr = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];

    const currNames = new Set(curr.results.filter((t) => t.status === "failed").map((t) => t.name));
    const prevNames = new Set(prev.results.filter((t) => t.status === "failed").map((t) => t.name));

    const newFailures = [...currNames].filter((n) => !prevNames.has(n));
    const resolved = [...prevNames].filter((n) => !currNames.has(n));

    return { curr: curr.manifest, prev: prev.manifest, newFailures, resolved };
  }, [sorted]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-mono text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" className="font-mono text-xs" onClick={() => navigate("/")}>
            ← Dashboard
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Historical Trends</h1>
            <p className="text-xs text-muted-foreground">{runs.length} runs analyzed</p>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        {/* Pass Rate Over Time */}
        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Pass Rate Over Time</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="passGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 30%, 16%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: "hsl(215, 20%, 55%)" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: "hsl(215, 20%, 55%)" }} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}%`, "Pass Rate"]} />
                <Area type="monotone" dataKey="passRate" stroke="hsl(142, 70%, 45%)" strokeWidth={2} fill="url(#passGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Failure Count + Duration side by side on larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Failure Count</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 30%, 16%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(215, 20%, 55%)" }} />
                  <YAxis tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(215, 20%, 55%)" }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="failures" fill="hsl(0, 72%, 51%)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Duration Trend</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 30%, 16%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(215, 20%, 55%)" }} />
                  <YAxis tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(215, 20%, 55%)" }} tickFormatter={(v) => `${v}s`} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}s`, "Duration"]} />
                  <Line type="monotone" dataKey="duration" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(38, 92%, 50%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Run Comparison */}
        {comparison && (
          <section className="rounded-lg border bg-card p-4 space-y-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Run Comparison: Latest vs Previous
            </h2>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground mb-1">Previous</p>
                <p className="font-mono text-sm text-foreground">{passRate(comparison.prev)}% pass</p>
                <p className="font-mono text-xs text-muted-foreground">{comparison.prev.failed} failures</p>
              </div>
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground mb-1">Latest</p>
                <p className="font-mono text-sm text-foreground">{passRate(comparison.curr)}% pass</p>
                <p className="font-mono text-xs text-muted-foreground">{comparison.curr.failed} failures</p>
              </div>
            </div>

            {comparison.newFailures.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-destructive mb-2">🔴 New Failures ({comparison.newFailures.length})</h3>
                <div className="space-y-1">
                  {comparison.newFailures.map((name) => (
                    <div key={name} className="flex items-center gap-2 px-3 py-1.5 rounded border bg-destructive/5 border-destructive/20">
                      <StatusBadge status="failed" />
                      <span className="font-mono text-xs text-foreground truncate">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {comparison.resolved.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-success mb-2">🟢 Resolved ({comparison.resolved.length})</h3>
                <div className="space-y-1">
                  {comparison.resolved.map((name) => (
                    <div key={name} className="flex items-center gap-2 px-3 py-1.5 rounded border bg-success/5 border-success/20">
                      <StatusBadge status="passed" />
                      <span className="font-mono text-xs text-foreground truncate">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {comparison.newFailures.length === 0 && comparison.resolved.length === 0 && (
              <p className="font-mono text-xs text-muted-foreground text-center py-2">No changes in failing tests between runs</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default TrendsPage;

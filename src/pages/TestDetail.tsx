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
  BarChart, Bar,
} from "recharts";

const chartTooltipStyle = {
  backgroundColor: "hsl(0, 0%, 100%)",
  border: "1px solid hsl(220, 16%, 90%)",
  borderRadius: "6px",
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
  color: "hsl(222, 47%, 11%)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};
const gridStroke = "hsl(220, 16%, 92%)";
const tickStyle = { fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(220, 10%, 46%)" };

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
              <Line type="monotone" dataKey="duration" stroke="hsl(217, 91%, 50%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(217, 91%, 50%)" }} />
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
                <Bar dataKey="retries" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
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
                <span className="text-[10px] text-destructive shrink-0">has error</span>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default TestDetailPage;

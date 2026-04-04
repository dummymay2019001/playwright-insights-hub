import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRuns } from "@/store/RunsContext";
import { formatDate } from "@/utils/format";
import { StatCard } from "@/components/StatCard";
import { HealthGauge } from "@/components/HealthGauge";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area,
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

const SuiteDetailPage = () => {
  const { suiteName } = useParams<{ suiteName: string }>();
  const navigate = useNavigate();
  const { runs, loading } = useRuns();
  const decodedName = suiteName ? decodeURIComponent(suiteName) : "";

  // Aggregate suite data across all runs
  const history = useMemo(() => {
    const sorted = [...runs].sort(
      (a, b) => new Date(a.manifest.timestamp).getTime() - new Date(b.manifest.timestamp).getTime()
    );
    return sorted.map((run) => {
      const suiteTests = run.results.filter((t) => t.suite === decodedName);
      if (suiteTests.length === 0) return null;
      const passed = suiteTests.filter((t) => t.status === "passed").length;
      const failed = suiteTests.filter((t) => t.status === "failed").length;
      const skipped = suiteTests.filter((t) => t.status === "skipped").length;
      const duration = suiteTests.reduce((s, t) => s + t.duration, 0);
      const retries = suiteTests.reduce((s, t) => s + t.retries, 0);
      return {
        run: run.manifest,
        tests: suiteTests,
        passed, failed, skipped,
        total: suiteTests.length,
        duration,
        retries,
        passRate: Math.round((passed / suiteTests.length) * 100),
      };
    }).filter(Boolean) as NonNullable<ReturnType<typeof Array.prototype.map>[number]>[];
  }, [runs, decodedName]);

  // Overall stats
  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const avgPassRate = Math.round(history.reduce((s, h) => s + h.passRate, 0) / history.length);
    const totalPassed = history.reduce((s, h) => s + h.passed, 0);
    const totalFailed = history.reduce((s, h) => s + h.failed, 0);
    const totalSkipped = history.reduce((s, h) => s + h.skipped, 0);
    const avgDuration = Math.round(history.reduce((s, h) => s + h.duration, 0) / history.length);
    const totalRetries = history.reduce((s, h) => s + h.retries, 0);

    // Stability: how many runs had 100% pass rate
    const perfectRuns = history.filter((h) => h.passRate === 100).length;
    const stability = Math.round((perfectRuns / history.length) * 100);

    // Trend
    let trend = 0;
    if (history.length >= 2) {
      trend = history[history.length - 1].passRate - history[history.length - 2].passRate;
    }

    return { avgPassRate, totalPassed, totalFailed, totalSkipped, avgDuration, totalRetries, stability, perfectRuns, trend, runsCount: history.length };
  }, [history]);

  // Per-test aggregate
  const testAggregates = useMemo(() => {
    const map = new Map<string, { name: string; passed: number; failed: number; totalRuns: number; totalRetries: number; avgDuration: number; durations: number[] }>();
    for (const h of history) {
      for (const t of h.tests) {
        const entry = map.get(t.name) || { name: t.name, passed: 0, failed: 0, totalRuns: 0, totalRetries: 0, avgDuration: 0, durations: [] };
        entry.totalRuns++;
        if (t.status === "passed") entry.passed++;
        if (t.status === "failed") entry.failed++;
        entry.totalRetries += t.retries;
        entry.durations.push(t.duration);
        map.set(t.name, entry);
      }
    }
    return [...map.values()].map((e) => ({
      ...e,
      avgDuration: Math.round(e.durations.reduce((s, d) => s + d, 0) / e.durations.length),
      passRate: e.totalRuns > 0 ? Math.round((e.passed / e.totalRuns) * 100) : 0,
    })).sort((a, b) => a.passRate - b.passRate || b.failed - a.failed);
  }, [history]);

  // Chart data
  const passRateData = useMemo(() => history.map((h) => ({
    date: new Date(h.run.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    passRate: h.passRate,
    failed: h.failed,
  })), [history]);

  const durationData = useMemo(() => history.map((h) => ({
    date: new Date(h.run.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    duration: Math.round(h.duration / 1000),
  })), [history]);

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
        <p className="font-mono text-muted-foreground">Suite not found across any runs</p>
        <Button variant="outline" onClick={() => navigate(-1)}>← Go Back</Button>
      </div>
    );
  }

  const latestRun = history[history.length - 1];

  return (
    <div className="container py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Hero header */}
      <div className="relative rounded-2xl border bg-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="relative px-4 sm:px-6 py-5 sm:py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-lg">📂</span>
                <h1 className="font-mono text-base sm:text-xl font-bold text-foreground">{decodedName}</h1>
                <Badge variant="outline" className="font-mono text-[10px]">{latestRun.tests[0]?.file}</Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Seen in {stats?.runsCount} runs · {latestRun.total} tests per run
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <StatusBadge status={latestRun.failed > 0 ? "failed" : "passed"} />
                {stats && stats.trend !== 0 && (
                  <Badge variant="outline" className={`font-mono text-[10px] ${stats.trend > 0 ? "bg-success/10 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30"}`}>
                    {stats.trend > 0 ? "↑" : "↓"} {Math.abs(stats.trend)}% vs prev
                  </Badge>
                )}
                {stats && stats.totalRetries > 0 && (
                  <Badge variant="outline" className="font-mono text-[10px] bg-warning/10 text-warning border-warning/30">⚡ {stats.totalRetries} retries</Badge>
                )}
              </div>
            </div>
            {stats && <HealthGauge score={stats.avgPassRate} label="Avg Pass Rate" size="lg" />}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <StatCard label="Stability" value={`${stats.stability}%`} variant={stats.stability >= 90 ? "success" : stats.stability >= 70 ? "warning" : "destructive"} subtitle={`${stats.perfectRuns}/${stats.runsCount} perfect`} icon="🛡️" />
          <StatCard label="Avg Pass Rate" value={`${stats.avgPassRate}%`} variant={stats.avgPassRate >= 95 ? "success" : stats.avgPassRate >= 80 ? "warning" : "destructive"} icon="📊" />
          <StatCard label="Total Failed" value={stats.totalFailed} variant={stats.totalFailed > 0 ? "destructive" : "success"} subtitle="across all runs" icon="✗" />
          <StatCard label="Total Skipped" value={stats.totalSkipped} variant="muted" icon="⊘" />
          <StatCard label="Avg Duration" value={`${(stats.avgDuration / 1000).toFixed(1)}s`} subtitle="per run" icon="⏱" />
          <StatCard label="Total Retries" value={stats.totalRetries} variant={stats.totalRetries > 0 ? "warning" : "default"} icon="🔄" />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pass rate trend */}
        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Pass Rate Over Time</h2>
          <div className="h-44 sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={passRateData}>
                <defs>
                  <linearGradient id="passRateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" tick={tickStyle} />
                <YAxis tick={tickStyle} domain={[0, 100]} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}%`, "Pass Rate"]} />
                <Area type="monotone" dataKey="passRate" stroke="hsl(152, 60%, 40%)" strokeWidth={2} fill="url(#passRateGradient)" dot={{ r: 3, fill: "hsl(152, 60%, 40%)" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Duration trend */}
        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Suite Duration (s)</h2>
          <div className="h-44 sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={durationData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" tick={tickStyle} />
                <YAxis tick={tickStyle} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}s`, "Duration"]} />
                <Line type="monotone" dataKey="duration" stroke="hsl(217, 91%, 50%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(217, 91%, 50%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Failure heatmap */}
      {passRateData.some((d) => d.failed > 0) && (
        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Failures Per Run</h2>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={passRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" tick={tickStyle} />
                <YAxis tick={tickStyle} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="failed" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Tests in this suite */}
      <section>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Tests in Suite ({testAggregates.length})
        </h2>
        <div className="space-y-1.5">
          {testAggregates.map((t) => (
            <button
              key={t.name}
              onClick={() => navigate(`/test/${encodeURIComponent(t.name)}`)}
              className="w-full text-left rounded-xl border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
            >
              <div className="px-4 py-3 flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${t.passRate >= 95 ? "bg-success" : t.passRate >= 80 ? "bg-warning" : "bg-destructive"}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs sm:text-sm text-foreground truncate">{t.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{t.totalRuns} runs</span>
                    <span className="text-[10px] text-success">{t.passed}✓</span>
                    {t.failed > 0 && <span className="text-[10px] text-destructive">{t.failed}✗</span>}
                    {t.totalRetries > 0 && <span className="text-[10px] text-warning">⚡{t.totalRetries}r</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[10px] text-muted-foreground">{t.avgDuration}ms avg</span>
                  <span className={`font-mono text-sm font-bold ${t.passRate >= 95 ? "text-success" : t.passRate >= 80 ? "text-warning" : "text-destructive"}`}>
                    {t.passRate}%
                  </span>
                </div>
              </div>
              <Progress value={t.passRate} className="h-0.5" />
            </button>
          ))}
        </div>
      </section>

      {/* Run history */}
      <section>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Run History</h2>
        <div className="space-y-1.5">
          {[...history].reverse().map((h) => (
            <button
              key={h.run.runId}
              onClick={() => navigate(`/run/${encodeURIComponent(h.run.runId)}`)}
              className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${h.passRate >= 95 ? "bg-success" : h.passRate >= 80 ? "bg-warning" : "bg-destructive"}`} />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-foreground truncate">{h.run.runId}</p>
                <p className="text-[10px] text-muted-foreground">{formatDate(h.run.timestamp)}</p>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] shrink-0">
                <span className="text-success">{h.passed}✓</span>
                {h.failed > 0 && <span className="text-destructive">{h.failed}✗</span>}
                <span className="text-muted-foreground">{Math.round(h.duration / 1000)}s</span>
              </div>
              <span className={`font-mono text-sm font-bold shrink-0 ${h.passRate >= 95 ? "text-success" : h.passRate >= 80 ? "text-warning" : "text-destructive"}`}>
                {h.passRate}%
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SuiteDetailPage;

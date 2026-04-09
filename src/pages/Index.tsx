import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRuns } from "@/store/RunsContext";
import { GroupedRunList } from "@/components/GroupedRunList";
import { StatCard } from "@/components/StatCard";
import { HealthGauge } from "@/components/HealthGauge";
import { FileDropZone } from "@/components/FileDropZone";
import { PassRateTrendChart } from "@/components/PassRateTrendChart";
import { SuiteHealthMap } from "@/components/SuiteHealthMap";
import { FailureCategoryChart } from "@/components/FailureCategoryChart";
import { passRate } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { IngestionResult } from "@/services/fileIngestion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Minus, BarChart3, Zap, Clock, AlertTriangle, CheckCircle2, XCircle, SkipForward } from "lucide-react";

const DashboardPage = () => {
  const { runs, loading, dataMode, importRuns, removeRun, switchToDemo } = useRuns();
  const navigate = useNavigate();

  const handleImport = (result: IngestionResult) => {
    importRuns(result.runs, true);
  };

  const metrics = useMemo(() => {
    if (runs.length === 0) return null;
    const totalRuns = runs.length;
    const avgPassRate = Math.round(runs.reduce((s, r) => s + (r.manifest.passed / r.manifest.total) * 100, 0) / runs.length);
    const totalTests = runs.reduce((s, r) => s + r.manifest.total, 0);
    const totalPassed = runs.reduce((s, r) => s + r.manifest.passed, 0);
    const totalFailed = runs.reduce((s, r) => s + r.manifest.failed, 0);
    const totalSkipped = runs.reduce((s, r) => s + r.manifest.skipped, 0);
    const latest = runs[runs.length - 1].manifest;
    const latestRate = passRate(latest);

    let trend = 0;
    if (runs.length >= 2) {
      const prev = passRate(runs[runs.length - 2].manifest);
      trend = latestRate - prev;
    }

    const flakyTests = new Set<string>();
    for (const run of runs) {
      for (const t of run.results) {
        if (t.retries > 0) flakyTests.add(t.name);
      }
    }

    const avgDuration = Math.round(runs.reduce((s, r) => s + r.manifest.duration, 0) / runs.length);

    return { totalRuns, avgPassRate, totalTests, totalPassed, totalFailed, totalSkipped, latest, latestRate, trend, flakyCount: flakyTests.size, avgDuration };
  }, [runs]);

  const sortedRuns = useMemo(
    () => [...runs].sort((a, b) => new Date(b.manifest.timestamp).getTime() - new Date(a.manifest.timestamp).getTime()),
    [runs]
  );

  const latestRun = useMemo(() => {
    if (sortedRuns.length === 0) return null;
    return sortedRuns[0];
  }, [sortedRuns]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-muted-foreground animate-pulse">Loading test runs…</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-6 max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <p className="font-mono text-sm font-medium text-foreground">No test runs loaded</p>
          <p className="text-xs text-muted-foreground mt-1">Import your Playwright JSON results or explore with demo data</p>
        </div>
        <FileDropZone onImport={handleImport} />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={switchToDemo}>🎭 Load Demo Data</Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/help")}>📖 Setup Guide</Button>
        </div>
      </div>
    );
  }

  const TrendIcon = metrics.trend > 0 ? TrendingUp : metrics.trend < 0 ? TrendingDown : Minus;
  const trendColor = metrics.trend > 0 ? "text-success" : metrics.trend < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="container py-4 sm:py-6 space-y-4 sm:space-y-5">
      {/* Hero header — compact & info-rich */}
      <div className="relative rounded-2xl border bg-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: "20px 20px",
        }} />
        <div className="relative px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <HealthGauge score={metrics.avgPassRate} label="Health" size="lg" />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-base sm:text-lg font-bold text-foreground">Test Intelligence</h1>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="font-mono text-[9px] text-primary font-medium">{metrics.totalRuns} runs</span>
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {metrics.totalTests.toLocaleString()} tests · Latest: <span className={metrics.latestRate >= 95 ? "text-success" : metrics.latestRate >= 80 ? "text-warning" : "text-destructive"}>{metrics.latestRate}%</span>
                </p>
                <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
                  <TrendIcon className="w-3 h-3" />
                  <span className="font-mono text-[10px] font-medium">
                    {metrics.trend === 0 ? "Stable" : `${metrics.trend > 0 ? "+" : ""}${metrics.trend}% vs previous`}
                  </span>
                </div>
              </div>
            </div>
            {/* Quick actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <FileDropZone onImport={handleImport} compact />
              <Button variant="outline" size="sm" className="font-mono text-[10px] h-7" onClick={() => navigate("/trends")}>
                📈 Trends
              </Button>
              <Button variant="outline" size="sm" className="font-mono text-[10px] h-7" onClick={() => navigate("/insights")}>
                💡 Insights
              </Button>
              <Button variant="outline" size="sm" className="font-mono text-[10px] h-7" onClick={() => navigate(`/export/${encodeURIComponent(metrics.latest.runId)}`)}>
                📄 Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Key stats — 2 rows on mobile, single row on desktop */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <StatCard
          label="Passed"
          value={metrics.totalPassed}
          variant="success"
          icon="✓"
        />
        <StatCard
          label="Failed"
          value={metrics.totalFailed}
          variant={metrics.totalFailed > 0 ? "destructive" : "success"}
          icon="✗"
        />
        <StatCard
          label="Skipped"
          value={metrics.totalSkipped}
          variant="muted"
          icon="⊘"
        />
        <StatCard
          label="Flaky"
          value={metrics.flakyCount}
          variant={metrics.flakyCount > 0 ? "warning" : "default"}
          subtitle="w/ retries"
          icon="⚡"
        />
        <StatCard
          label="Avg Duration"
          value={`${metrics.avgDuration}s`}
          icon="⏱"
        />
        <StatCard
          label="Avg Pass Rate"
          value={`${metrics.avgPassRate}%`}
          variant={metrics.avgPassRate >= 95 ? "success" : metrics.avgPassRate >= 80 ? "warning" : "destructive"}
          icon="📊"
        />
      </div>

      {/* Analytics section — charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <PassRateTrendChart runs={runs} />
        <FailureCategoryChart runs={runs} />
      </div>

      {/* Suite health heatmap */}
      {runs.length > 0 && <SuiteHealthMap runs={runs} />}

      {/* Data mode badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div />
        <div className="flex items-center gap-2">
          {dataMode === "demo" && (
            <span className="font-mono text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-warning/10 border border-warning/20">
              Demo Data
            </span>
          )}
          {dataMode === "imported" && (
            <>
              <span className="font-mono text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
                Imported Data
              </span>
              <Button variant="ghost" size="sm" className="font-mono text-[10px] h-6 px-2 text-muted-foreground" onClick={switchToDemo}>
                Reset Demo
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Recent Runs — grouped by time */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Recent Runs</h2>
          <span className="font-mono text-[10px] text-muted-foreground">{sortedRuns.length} total</span>
        </div>
        <GroupedRunList runs={runs} onRemove={dataMode === "imported" ? removeRun : undefined} />
      </section>
    </div>
  );
};

export default DashboardPage;

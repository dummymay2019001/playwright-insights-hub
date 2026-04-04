import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRuns } from "@/store/RunsContext";
import { RunRow } from "@/components/RunRow";
import { StatCard } from "@/components/StatCard";
import { HealthGauge } from "@/components/HealthGauge";
import { FileDropZone } from "@/components/FileDropZone";
import { passRate } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { IngestionResult } from "@/services/fileIngestion";

const DashboardPage = () => {
  const { runs, loading, dataMode, importRuns, switchToDemo } = useRuns();
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

    // trend: compare last 2 runs
    let trend = 0;
    if (runs.length >= 2) {
      const prev = passRate(runs[runs.length - 2].manifest);
      trend = latestRate - prev;
    }

    // flaky count
    const flakyTests = new Set<string>();
    for (const run of runs) {
      for (const t of run.results) {
        if (t.retries > 0) flakyTests.add(t.name);
      }
    }

    // avg duration
    const avgDuration = Math.round(runs.reduce((s, r) => s + r.manifest.duration, 0) / runs.length);

    return { totalRuns, avgPassRate, totalTests, totalPassed, totalFailed, totalSkipped, latest, latestRate, trend, flakyCount: flakyTests.size, avgDuration };
  }, [runs]);

  const sortedRuns = useMemo(
    () => [...runs].sort((a, b) => new Date(b.manifest.timestamp).getTime() - new Date(a.manifest.timestamp).getTime()),
    [runs]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-muted-foreground animate-pulse">Loading test runs…</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="text-3xl">📋</span>
        </div>
        <p className="font-mono text-muted-foreground">No test runs loaded</p>
        <Button variant="outline" onClick={() => navigate("/help")}>📖 Setup Guide</Button>
      </div>
    );
  }

  return (
    <div className="container py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Hero header */}
      <div className="relative rounded-2xl border bg-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }} />
        <div className="relative px-4 sm:px-6 py-5 sm:py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Test Intelligence</h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="font-mono text-[10px] text-success font-medium">{metrics.totalRuns} runs</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {metrics.totalTests.toLocaleString()} tests tracked · {metrics.totalPassed.toLocaleString()} passed · {metrics.totalFailed.toLocaleString()} failed
              </p>
            </div>
            <HealthGauge score={metrics.avgPassRate} label="Avg Health" size="lg" />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <StatCard
          label="Latest Pass Rate"
          value={`${metrics.latestRate}%`}
          variant={metrics.latestRate >= 95 ? "success" : metrics.latestRate >= 80 ? "warning" : "destructive"}
          subtitle={metrics.trend !== 0 ? `${metrics.trend > 0 ? "↑" : "↓"} ${Math.abs(metrics.trend)}% vs prev` : "— stable"}
          icon="📊"
        />
        <StatCard label="Total Runs" value={metrics.totalRuns} icon="🔄" />
        <StatCard
          label="Failed Tests"
          value={metrics.totalFailed}
          variant={metrics.totalFailed > 0 ? "destructive" : "success"}
          subtitle={`across all runs`}
          icon="✗"
        />
        <StatCard
          label="Skipped"
          value={metrics.totalSkipped}
          variant="muted"
          icon="⊘"
        />
        <StatCard
          label="Flaky Tests"
          value={metrics.flakyCount}
          variant={metrics.flakyCount > 0 ? "warning" : "default"}
          subtitle="unique tests w/ retries"
          icon="⚡"
        />
        <StatCard
          label="Avg Duration"
          value={`${metrics.avgDuration}s`}
          subtitle="per run"
          icon="⏱"
        />
      </div>

      {/* Data mode & quick actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="font-mono text-xs" onClick={() => navigate("/trends")}>
            📈 View Trends
          </Button>
          <Button variant="outline" size="sm" className="font-mono text-xs" onClick={() => navigate("/insights")}>
            💡 Insights
          </Button>
          <Button variant="outline" size="sm" className="font-mono text-xs" onClick={() => navigate(`/export/${encodeURIComponent(metrics.latest.runId)}`)}>
            📄 Export Latest
          </Button>
          <FileDropZone onImport={handleImport} compact />
        </div>
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

      {/* Run list */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Recent Runs</h2>
          <span className="font-mono text-[10px] text-muted-foreground">{sortedRuns.length} total</span>
        </div>
        <div className="space-y-2">
          {sortedRuns.map((run) => (
            <RunRow key={run.manifest.runId} manifest={run.manifest} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;

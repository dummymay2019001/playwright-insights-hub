import { useRuns } from "@/store/RunsContext";
import { RunRow } from "@/components/RunRow";
import { StatCard } from "@/components/StatCard";

const DashboardPage = () => {
  const { runs, loading } = useRuns();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-muted-foreground animate-pulse">Loading test runs…</div>
      </div>
    );
  }

  const latest = runs.length > 0 ? runs[runs.length - 1].manifest : null;
  const totalRuns = runs.length;
  const avgPassRate = runs.length
    ? Math.round(runs.reduce((s, r) => s + (r.manifest.passed / r.manifest.total) * 100, 0) / runs.length)
    : 0;
  const totalTests = runs.reduce((s, r) => s + r.manifest.total, 0);

  const sortedRuns = [...runs].sort((a, b) => new Date(b.manifest.timestamp).getTime() - new Date(a.manifest.timestamp).getTime());

  return (
    <div className="container py-4 sm:py-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
        <p className="text-xs text-muted-foreground">{totalRuns} runs loaded</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <StatCard label="Total Runs" value={totalRuns} />
        <StatCard label="Avg Pass Rate" value={`${avgPassRate}%`} variant={avgPassRate >= 95 ? "success" : avgPassRate >= 80 ? "warning" : "destructive"} />
        <StatCard label="Total Tests" value={totalTests.toLocaleString()} />
        <StatCard label="Latest Failures" value={latest?.failed ?? 0} variant={latest && latest.failed > 0 ? "destructive" : "success"} />
      </div>

      <section>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Test Runs</h2>
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

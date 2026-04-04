import { useNavigate } from "react-router-dom";
import { useRuns } from "@/store/RunsContext";
import { RunRow } from "@/components/RunRow";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";

const DashboardPage = () => {
  const { runs, loading } = useRuns();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

  // Sort runs newest first
  const sortedRuns = [...runs].sort((a, b) => new Date(b.manifest.timestamp).getTime() - new Date(a.manifest.timestamp).getTime());

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-mono font-bold text-sm">PW</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Playwright Test Intelligence</h1>
            <p className="text-xs text-muted-foreground">Dashboard · {totalRuns} runs loaded</p>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Runs" value={totalRuns} />
          <StatCard label="Avg Pass Rate" value={`${avgPassRate}%`} variant={avgPassRate >= 95 ? "success" : avgPassRate >= 80 ? "warning" : "destructive"} />
          <StatCard label="Total Tests" value={totalTests.toLocaleString()} />
          <StatCard label="Latest Failures" value={latest?.failed ?? 0} variant={latest && latest.failed > 0 ? "destructive" : "success"} />
        </div>

        {/* Runs List */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Test Runs</h2>
          <div className="space-y-2">
            {sortedRuns.map((run) => (
              <RunRow key={run.manifest.runId} manifest={run.manifest} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;

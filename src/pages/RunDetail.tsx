import { useParams, useNavigate } from "react-router-dom";
import { useRuns } from "@/store/RunsContext";
import { formatDate, formatDuration, passRate } from "@/utils/format";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const RunDetailPage = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { getRunById, loading } = useRuns();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-mono text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  const run = runId ? getRunById(decodeURIComponent(runId)) : undefined;

  if (!run) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="font-mono text-muted-foreground">Run not found</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          ← Back to Dashboard
        </Button>
      </div>
    );
  }

  const m = run.manifest;
  const rate = passRate(m);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" className="font-mono text-xs" onClick={() => navigate("/")}>
            ← Back
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-mono text-sm font-semibold text-foreground truncate">{m.runId}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">{formatDate(m.timestamp)}</span>
              <Badge variant="outline" className="font-mono text-xs bg-secondary/50 border-border">{m.branch}</Badge>
              <Badge variant="outline" className="font-mono text-xs bg-secondary/50 border-border">{m.environment}</Badge>
            </div>
          </div>
          <span className={`font-mono text-xl font-bold ${rate >= 95 ? "text-success" : rate >= 80 ? "text-warning" : "text-destructive"}`}>
            {rate}%
          </span>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Total" value={m.total} />
          <StatCard label="Passed" value={m.passed} variant="success" />
          <StatCard label="Failed" value={m.failed} variant={m.failed > 0 ? "destructive" : "success"} />
          <StatCard label="Skipped" value={m.skipped} variant="muted" />
          <StatCard label="Duration" value={formatDuration(m.duration)} />
        </div>

        {/* Test list placeholder - Phase 2 will expand this */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Tests ({run.results.length})
          </h2>
          <div className="space-y-1">
            {run.results.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-2 rounded-md border bg-card hover:bg-accent/30 transition-colors">
                <StatusBadge status={t.status} />
                <span className="font-mono text-sm text-foreground flex-1 truncate">{t.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{t.duration}ms</span>
                {t.retries > 0 && (
                  <Badge variant="outline" className="font-mono text-xs bg-warning/10 text-warning border-warning/30">
                    {t.retries} retries
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default RunDetailPage;

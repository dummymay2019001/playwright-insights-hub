import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRuns } from "@/store/RunsContext";
import { formatDate, formatDuration, passRate } from "@/utils/format";
import { StatCard } from "@/components/StatCard";
import { StatusPieChart } from "@/components/StatusPieChart";
import { TestRow } from "@/components/TestRow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TestStatus } from "@/models/types";

const FILTERS: { label: string; value: TestStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Passed", value: "passed" },
  { label: "Failed", value: "failed" },
  { label: "Skipped", value: "skipped" },
];

const RunDetailPage = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { getRunById, loading } = useRuns();
  const [filter, setFilter] = useState<TestStatus | "all">("all");

  const run = runId ? getRunById(decodeURIComponent(runId)) : undefined;

  const filtered = useMemo(
    () => {
      if (!run) return [];
      return filter === "all" ? run.results : run.results.filter((t) => t.status === filter);
    },
    [run, filter]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-mono text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="font-mono text-muted-foreground">Run not found</p>
        <Button variant="outline" onClick={() => navigate("/")}>← Back to Dashboard</Button>
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
            <div className="flex items-center gap-2 mt-1 flex-wrap">
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
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label="Total" value={m.total} />
            <StatCard label="Passed" value={m.passed} variant="success" />
            <StatCard label="Failed" value={m.failed} variant={m.failed > 0 ? "destructive" : "success"} />
            <StatCard label="Skipped" value={m.skipped} variant="muted" />
            <StatCard label="Duration" value={formatDuration(m.duration)} />
          </div>
          <StatusPieChart passed={m.passed} failed={m.failed} skipped={m.skipped} />
        </div>

        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Tests ({filtered.length})
            </h2>
            <div className="flex gap-1">
              {FILTERS.map((f) => (
                <Button
                  key={f.value}
                  variant={filter === f.value ? "default" : "ghost"}
                  size="sm"
                  className="font-mono text-xs h-7 px-3"
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            {filtered.map((t) => (
              <TestRow key={t.id} test={t} />
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground font-mono py-8 text-center">No tests match this filter</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default RunDetailPage;

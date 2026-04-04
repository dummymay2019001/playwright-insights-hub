import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRuns } from "@/store/RunsContext";
import { formatDate, formatDuration, passRate } from "@/utils/format";
import { StatCard } from "@/components/StatCard";
import { StatusPieChart } from "@/components/StatusPieChart";
import { TestRow } from "@/components/TestRow";
import { TagSummary } from "@/components/TagSummary";
import { SuiteBreakdown } from "@/components/SuiteBreakdown";
import { useSearchPagination, SearchPaginationBar } from "@/components/SearchPagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TestStatus } from "@/models/types";

const STATUS_FILTERS: { label: string; value: TestStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Passed", value: "passed" },
  { label: "Failed", value: "failed" },
  { label: "Skipped", value: "skipped" },
];

const RunDetailPage = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { getRunById, loading } = useRuns();
  const [statusFilter, setStatusFilter] = useState<TestStatus | "all">("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const run = runId ? getRunById(decodeURIComponent(runId)) : undefined;

  const tagSummary = useMemo(() => {
    if (!run) return [];
    const map = new Map<string, { total: number; passed: number; failed: number }>();
    for (const t of run.results) {
      for (const tag of t.tags) {
        const entry = map.get(tag) || { total: 0, passed: 0, failed: 0 };
        entry.total++;
        if (t.status === "passed") entry.passed++;
        if (t.status === "failed") entry.failed++;
        map.set(tag, entry);
      }
    }
    return [...map.entries()].map(([tag, stats]) => ({ tag, ...stats })).sort((a, b) => b.total - a.total);
  }, [run]);

  const filtered = useMemo(() => {
    if (!run) return [];
    let list = run.results;
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    if (selectedTag) list = list.filter((t) => t.tags.includes(selectedTag));
    return list;
  }, [run, statusFilter, selectedTag]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="font-mono text-muted-foreground">Run not found</p>
        <Button variant="outline" onClick={() => navigate("/")}>← Back to Dashboard</Button>
      </div>
    );
  }

  const m = run.manifest;
  const rate = passRate(m);

  return (
    <div className="container py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Run header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h2 className="font-mono text-sm sm:text-base font-semibold text-foreground truncate">{m.runId}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">{formatDate(m.timestamp)}</span>
            <Badge variant="outline" className="font-mono text-[10px] sm:text-xs">{m.branch}</Badge>
            <Badge variant="outline" className="font-mono text-[10px] sm:text-xs">{m.environment}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="font-mono text-xs" onClick={() => navigate(`/export/${encodeURIComponent(m.runId)}`)}>
            📄 Export PDF
          </Button>
          <span className={`font-mono text-xl sm:text-2xl font-bold ${rate >= 95 ? "text-success" : rate >= 80 ? "text-warning" : "text-destructive"}`}>
            {rate}%
          </span>
        </div>
      </div>

      {/* Stats + Pie */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
          <StatCard label="Total" value={m.total} />
          <StatCard label="Passed" value={m.passed} variant="success" />
          <StatCard label="Failed" value={m.failed} variant={m.failed > 0 ? "destructive" : "success"} />
          <StatCard label="Skipped" value={m.skipped} variant="muted" />
          <StatCard label="Duration" value={formatDuration(m.duration)} />
        </div>
        <StatusPieChart passed={m.passed} failed={m.failed} skipped={m.skipped} />
      </div>

      {/* Tags */}
      {tagSummary.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Tags</h2>
          <TagSummary tags={tagSummary} selectedTag={selectedTag} onSelectTag={setSelectedTag} />
        </section>
      )}

      {/* Suite Breakdown */}
      <SuiteBreakdown results={run.results} runId={m.runId} />

      {/* Filters + Test List */}
      <TestListSection filtered={filtered} statusFilter={statusFilter} setStatusFilter={setStatusFilter} runId={m.runId} />
    </div>
  );
};

function TestListSection({ filtered, statusFilter, setStatusFilter, runId }: { filtered: any[]; statusFilter: TestStatus | "all"; setStatusFilter: (v: TestStatus | "all") => void; runId: string }) {
  const searchKey = useCallback((t: any) => t.name, []);
  const { search, setSearch, page, setPage, totalPages, paginated, totalFiltered } = useSearchPagination({ items: filtered, searchKey });

  return (
    <section>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tests</h2>
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={statusFilter === f.value ? "default" : "ghost"}
              size="sm"
              className="font-mono text-xs h-7 px-2 sm:px-3"
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>
      <SearchPaginationBar
        search={search} onSearchChange={setSearch}
        page={page} totalPages={totalPages} onPageChange={setPage}
        totalFiltered={totalFiltered} totalItems={filtered.length}
      />
      <div className="space-y-1 mt-2">
        {paginated.map((t: any) => (
          <TestRow key={t.id} test={t} runId={runId} />
        ))}
        {totalFiltered === 0 && (
          <p className="text-sm text-muted-foreground font-mono py-8 text-center">No tests match this filter</p>
        )}
      </div>
    </section>
  );
}

export default RunDetailPage;

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRuns } from "@/store/RunsContext";
import { TestResult, TestStatus } from "@/models/types";
import { TestRow } from "@/components/TestRow";
import { useSearchPagination, SearchPaginationBar } from "@/components/SearchPagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS: { label: string; value: TestStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Passed", value: "passed" },
  { label: "Failed", value: "failed" },
  { label: "Skipped", value: "skipped" },
];

const TestsPage = () => {
  const { runs, loading } = useRuns();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<TestStatus | "all">("all");
  const [suiteFilter, setSuiteFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  // Aggregate all tests from the latest run per runId (avoid duplication)
  const { allTests, suites, tags } = useMemo(() => {
    const tests: (TestResult & { runId: string })[] = [];
    const suiteSet = new Set<string>();
    const tagSet = new Set<string>();

    for (const run of runs) {
      for (const t of run.results) {
        tests.push({ ...t, runId: run.manifest.runId });
        suiteSet.add(t.suite);
        for (const tag of t.tags) tagSet.add(tag);
      }
    }

    return {
      allTests: tests,
      suites: [...suiteSet].sort(),
      tags: [...tagSet].sort(),
    };
  }, [runs]);

  const filtered = useMemo(() => {
    let list = allTests;
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    if (suiteFilter !== "all") list = list.filter((t) => t.suite === suiteFilter);
    if (tagFilter !== "all") list = list.filter((t) => t.tags.includes(tagFilter));
    return list;
  }, [allTests, statusFilter, suiteFilter, tagFilter]);

  const searchKey = useCallback((t: TestResult & { runId: string }) => `${t.name} ${t.suite}`, []);
  const { search, setSearch, page, setPage, totalPages, paginated, totalFiltered } =
    useSearchPagination({ items: filtered, searchKey });

  // Tag counts for quick pills
  const tagCounts = useMemo(() => {
    const map = new Map<string, { total: number; passed: number; failed: number }>();
    for (const t of allTests) {
      for (const tag of t.tags) {
        const e = map.get(tag) || { total: 0, passed: 0, failed: 0 };
        e.total++;
        if (t.status === "passed") e.passed++;
        if (t.status === "failed") e.failed++;
        map.set(tag, e);
      }
    }
    return map;
  }, [allTests]);

  const activeFilters = [statusFilter !== "all", suiteFilter !== "all", tagFilter !== "all"].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("all");
    setSuiteFilter("all");
    setTagFilter("all");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  const passedCount = allTests.filter((t) => t.status === "passed").length;
  const failedCount = allTests.filter((t) => t.status === "failed").length;
  const skippedCount = allTests.filter((t) => t.status === "skipped").length;

  return (
    <div className="container py-4 sm:py-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-mono text-lg font-bold text-foreground">All Tests</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {allTests.length} tests across {runs.length} runs · {suites.length} suites · {tags.length} tags
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs bg-success/10 text-success border-success/30">
            ✓ {passedCount}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs bg-destructive/10 text-destructive border-destructive/30">
            ✗ {failedCount}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs bg-muted text-muted-foreground">
            ⊘ {skippedCount}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-card">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-1">Filters</span>

        {/* Status */}
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((f) => (
            <Button
              key={f.value}
              variant={statusFilter === f.value ? "default" : "outline"}
              size="sm"
              className="font-mono text-xs h-7 px-2"
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

        {/* Suite filter */}
        <Select value={suiteFilter} onValueChange={setSuiteFilter}>
          <SelectTrigger className="w-[180px] h-8 font-mono text-xs">
            <SelectValue placeholder="Suite" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suites</SelectItem>
            {suites.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tag filter */}
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-[160px] h-8 font-mono text-xs">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {tags.map((tag) => {
              const c = tagCounts.get(tag);
              return (
                <SelectItem key={tag} value={tag}>
                  {tag} ({c?.total ?? 0})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" className="font-mono text-xs h-7 text-muted-foreground" onClick={clearFilters}>
            Clear ({activeFilters})
          </Button>
        )}
      </div>

      {/* Tag pills */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const c = tagCounts.get(tag)!;
            const rate = c.total > 0 ? Math.round((c.passed / c.total) * 100) : 0;
            const isActive = tagFilter === tag;
            return (
              <button
                key={tag}
                onClick={() => setTagFilter(isActive ? "all" : tag)}
                className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-mono transition-colors ${
                  isActive
                    ? "bg-primary/10 border-primary/30 text-foreground"
                    : "bg-card hover:bg-accent/40 text-muted-foreground"
                }`}
              >
                <span>{tag}</span>
                <span className={`font-semibold ${rate >= 95 ? "text-success" : rate >= 80 ? "text-warning" : "text-destructive"}`}>
                  {rate}%
                </span>
                <span className="text-muted-foreground/70">({c.total})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search + Pagination */}
      <SearchPaginationBar
        search={search}
        onSearchChange={setSearch}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalFiltered={totalFiltered}
        totalItems={filtered.length}
        placeholder="Search tests by name or suite…"
      />

      {/* Test list */}
      <div className="space-y-1">
        {paginated.map((t: TestResult & { runId: string }) => (
          <div key={`${t.runId}-${t.id}`} className="relative">
            <TestRow test={t} runId={t.runId} />
          </div>
        ))}
        {totalFiltered === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground font-mono">No tests match your filters</p>
            {activeFilters > 0 && (
              <Button variant="link" className="font-mono text-xs mt-2" onClick={clearFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestsPage;

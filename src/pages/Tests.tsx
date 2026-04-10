import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRuns } from "@/store/RunsContext";
import { TestStatus } from "@/models/types";
import { useSearchPagination, SearchPaginationBar } from "@/components/SearchPagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface UniqueTest {
  name: string;
  suite: string;
  tags: string[];
  latestStatus: TestStatus;
  lastDuration: number;
  totalRuns: number;
  passCount: number;
  failCount: number;
  skipCount: number;
  avgDuration: number;
  flaky: boolean;
}

type SortField = "name" | "passRate" | "duration" | "runs";
type SortDir = "asc" | "desc";

const STATUS_OPTIONS: { label: string; value: TestStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Passed", value: "passed" },
  { label: "Failed", value: "failed" },
  { label: "Skipped", value: "skipped" },
  { label: "Flaky", value: "flaky" as any },
];

const SORT_OPTIONS: { label: string; value: SortField }[] = [
  { label: "Name", value: "name" },
  { label: "Pass Rate", value: "passRate" },
  { label: "Duration", value: "duration" },
  { label: "Run Count", value: "runs" },
];

const TestsPage = () => {
  const { runs, loading } = useRuns();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [suiteFilter, setSuiteFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Build unique tests map: one entry per test name, aggregated across runs
  const { uniqueTests, suites, tags } = useMemo(() => {
    const map = new Map<string, UniqueTest>();
    const suiteSet = new Set<string>();
    const tagSet = new Set<string>();

    // Sort runs oldest → newest so latest overwrites
    const sorted = [...runs].sort(
      (a, b) => new Date(a.manifest.timestamp).getTime() - new Date(b.manifest.timestamp).getTime()
    );

    for (const run of sorted) {
      for (const t of run.results) {
        suiteSet.add(t.suite);
        for (const tag of t.tags) tagSet.add(tag);

        const existing = map.get(t.name);
        if (!existing) {
          map.set(t.name, {
            name: t.name,
            suite: t.suite,
            tags: [...t.tags],
            latestStatus: t.status,
            lastDuration: t.duration,
            totalRuns: 1,
            passCount: t.status === "passed" ? 1 : 0,
            failCount: t.status === "failed" ? 1 : 0,
            skipCount: t.status === "skipped" ? 1 : 0,
            avgDuration: t.duration,
            flaky: false,
          });
        } else {
          existing.latestStatus = t.status;
          existing.lastDuration = t.duration;
          existing.totalRuns++;
          if (t.status === "passed") existing.passCount++;
          if (t.status === "failed") existing.failCount++;
          if (t.status === "skipped") existing.skipCount++;
          existing.avgDuration = Math.round(
            (existing.avgDuration * (existing.totalRuns - 1) + t.duration) / existing.totalRuns
          );
          // Merge tags
          for (const tag of t.tags) {
            if (!existing.tags.includes(tag)) existing.tags.push(tag);
          }
          // Flaky = had both pass and fail
          if (existing.passCount > 0 && existing.failCount > 0) existing.flaky = true;
        }
      }
    }

    return {
      uniqueTests: [...map.values()],
      suites: [...suiteSet].sort(),
      tags: [...tagSet].sort(),
    };
  }, [runs]);

  const filtered = useMemo(() => {
    let list = uniqueTests;
    if (statusFilter === "flaky") {
      list = list.filter((t) => t.flaky);
    } else if (statusFilter !== "all") {
      list = list.filter((t) => t.latestStatus === statusFilter);
    }
    if (suiteFilter !== "all") list = list.filter((t) => t.suite === suiteFilter);
    if (tagFilter !== "all") list = list.filter((t) => t.tags.includes(tagFilter));

    // Sort
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "passRate": {
          const rA = a.totalRuns > 0 ? a.passCount / a.totalRuns : 0;
          const rB = b.totalRuns > 0 ? b.passCount / b.totalRuns : 0;
          cmp = rA - rB;
          break;
        }
        case "duration":
          cmp = a.avgDuration - b.avgDuration;
          break;
        case "runs":
          cmp = a.totalRuns - b.totalRuns;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [uniqueTests, statusFilter, suiteFilter, tagFilter, sortField, sortDir]);

  const searchKey = useCallback((t: UniqueTest) => `${t.name} ${t.suite} ${t.tags.join(" ")}`, []);
  const { search, setSearch, page, setPage, totalPages, paginated, totalFiltered } =
    useSearchPagination({ items: filtered, searchKey });

  // Tag counts
  const tagCounts = useMemo(() => {
    const m = new Map<string, { total: number; passed: number; failed: number }>();
    for (const t of uniqueTests) {
      for (const tag of t.tags) {
        const e = m.get(tag) || { total: 0, passed: 0, failed: 0 };
        e.total++;
        if (t.latestStatus === "passed") e.passed++;
        if (t.latestStatus === "failed") e.failed++;
        m.set(tag, e);
      }
    }
    return m;
  }, [uniqueTests]);

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

  const flakyCount = uniqueTests.filter((t) => t.flaky).length;

  return (
    <div className="container py-4 sm:py-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-mono text-lg font-bold text-foreground">All Tests</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {uniqueTests.length} unique tests · {suites.length} suites · {tags.length} tags
            {flakyCount > 0 && <span className="text-warning ml-1">· {flakyCount} flaky</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-card">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-1">Filters</span>

        <div className="flex gap-1 flex-wrap">
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

        <Select value={suiteFilter} onValueChange={setSuiteFilter}>
          <SelectTrigger className="w-[180px] h-8 font-mono text-xs">
            <SelectValue placeholder="Suite" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suites</SelectItem>
            {suites.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-[160px] h-8 font-mono text-xs">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {tags.map((tag) => {
              const c = tagCounts.get(tag);
              return (
                <SelectItem key={tag} value={tag}>{tag} ({c?.total ?? 0})</SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

        <div className="flex items-center gap-1">
          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger className="w-[130px] h-8 font-mono text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          >
            {sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
          </Button>
        </div>

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
        placeholder="Search tests by name, suite, or tag…"
      />

      {/* Unique test list */}
      <div className="space-y-1">
        {paginated.map((t: UniqueTest) => (
          <UniqueTestRow key={t.name} test={t} onNavigate={() => navigate(`/test/${encodeURIComponent(t.name)}`)} />
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

function UniqueTestRow({ test: t, onNavigate }: { test: UniqueTest; onNavigate: () => void }) {
  const passRate = t.totalRuns > 0 ? Math.round((t.passCount / t.totalRuns) * 100) : 0;

  return (
    <button
      onClick={onNavigate}
      className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-md border bg-card hover:bg-accent/40 transition-colors text-left group"
    >
      <StatusBadge status={t.latestStatus} />
      <div className="flex-1 min-w-0">
        <p className="font-mono text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {t.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground font-mono">{t.suite}</span>
          {t.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="font-mono text-[9px] px-1 py-0">{tag}</Badge>
          ))}
          {t.tags.length > 3 && (
            <span className="text-[9px] text-muted-foreground">+{t.tags.length - 3}</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {t.flaky && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="font-mono text-[9px] border-warning/40 text-warning bg-warning/10">
                ⚡ Flaky
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="font-mono text-xs">
              Passed {t.passCount} / Failed {t.failCount} across {t.totalRuns} runs
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`font-mono text-xs font-semibold ${passRate >= 95 ? "text-success" : passRate >= 80 ? "text-warning" : "text-destructive"}`}>
              {passRate}%
            </span>
          </TooltipTrigger>
          <TooltipContent className="font-mono text-xs">
            {t.passCount}✓ {t.failCount}✗ {t.skipCount}⊘ across {t.totalRuns} runs
          </TooltipContent>
        </Tooltip>
        <span className="font-mono text-[10px] text-muted-foreground hidden sm:inline">
          {t.avgDuration < 1000 ? `${t.avgDuration}ms` : `${(t.avgDuration / 1000).toFixed(1)}s`}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {t.totalRuns} run{t.totalRuns !== 1 ? "s" : ""}
        </span>
      </div>
    </button>
  );
}

export default TestsPage;

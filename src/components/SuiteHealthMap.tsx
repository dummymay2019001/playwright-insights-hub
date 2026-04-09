import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TestRun } from "@/models/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  runs: TestRun[];
}

interface SuiteAgg {
  name: string;
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  rate: number;
  runsCount: number;
  avgRate: number;
  testCount: number;
  tags: Map<string, number>;
}

function getHealthColor(rate: number): string {
  if (rate >= 95) return "bg-success";
  if (rate >= 80) return "bg-warning";
  if (rate >= 50) return "bg-orange-500";
  return "bg-destructive";
}

function getHealthBorder(rate: number): string {
  if (rate >= 95) return "border-success/30";
  if (rate >= 80) return "border-warning/30";
  if (rate >= 50) return "border-orange-500/30";
  return "border-destructive/30";
}

function rateTextClass(rate: number): string {
  if (rate >= 95) return "text-success";
  if (rate >= 80) return "text-warning";
  return "text-destructive";
}

export function SuiteHealthMap({ runs }: Props) {
  const navigate = useNavigate();

  const suites = useMemo(() => {
    const map = new Map<string, { passed: number; failed: number; skipped: number; total: number; runsCount: number; testNames: Set<string>; tags: Map<string, number>; perRunRates: number[] }>();

    for (const run of runs) {
      // Track suites seen in this run to count runsCount
      const suitesSeen = new Map<string, { p: number; t: number }>();

      for (const t of run.results) {
        const suite = t.suite || "Default";
        const entry = map.get(suite) || { passed: 0, failed: 0, skipped: 0, total: 0, runsCount: 0, testNames: new Set<string>(), tags: new Map<string, number>(), perRunRates: [] };

        entry.total++;
        if (t.status === "passed") entry.passed++;
        if (t.status === "failed") entry.failed++;
        if (t.status === "skipped") entry.skipped++;
        entry.testNames.add(t.name);

        for (const tag of t.tags || []) {
          entry.tags.set(tag, (entry.tags.get(tag) || 0) + 1);
        }

        // Per-run tracking
        if (!suitesSeen.has(suite)) suitesSeen.set(suite, { p: 0, t: 0 });
        const sr = suitesSeen.get(suite)!;
        sr.t++;
        if (t.status === "passed") sr.p++;

        map.set(suite, entry);
      }

      // Finalize per-run rates
      for (const [suite, sr] of suitesSeen) {
        const entry = map.get(suite)!;
        entry.runsCount++;
        entry.perRunRates.push(Math.round((sr.p / sr.t) * 100));
      }
    }

    return [...map.entries()]
      .map(([name, s]): SuiteAgg => ({
        name,
        passed: s.passed,
        failed: s.failed,
        skipped: s.skipped,
        total: s.total,
        rate: Math.round((s.passed / s.total) * 100),
        runsCount: s.runsCount,
        avgRate: s.perRunRates.length > 0 ? Math.round(s.perRunRates.reduce((a, b) => a + b, 0) / s.perRunRates.length) : 0,
        testCount: s.testNames.size,
        tags: s.tags,
      }))
      .sort((a, b) => a.avgRate - b.avgRate);
  }, [runs]);

  if (suites.length === 0) return null;

  const topTags = (tags: Map<string, number>) => {
    return [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  };

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Suite Health Map</h3>
        <span className="font-mono text-[10px] text-muted-foreground">{suites.length} suites · {runs.length} runs</span>
      </div>
      <TooltipProvider>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {suites.map((s) => (
            <Tooltip key={s.name}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate(`/suite/${encodeURIComponent(s.name)}`)}
                  className={`relative rounded-lg border p-2.5 text-left transition-all hover:scale-[1.03] hover:shadow-md ${getHealthBorder(s.avgRate)} group`}
                >
                  <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${getHealthColor(s.avgRate)}`} />
                  <p className="font-mono text-[9px] sm:text-[10px] text-foreground truncate pr-3 leading-tight">
                    {s.name.split("/").pop() || s.name}
                  </p>
                  <p className={`font-mono text-sm font-bold mt-0.5 ${rateTextClass(s.avgRate)}`}>
                    {s.avgRate}%
                  </p>
                  {/* Counts row */}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[8px] font-mono text-success">{s.passed}✓</span>
                    {s.failed > 0 && <span className="text-[8px] font-mono text-destructive">{s.failed}✗</span>}
                    {s.skipped > 0 && <span className="text-[8px] font-mono text-muted-foreground">{s.skipped}⊘</span>}
                  </div>
                  {/* Meta row */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[7px] font-mono text-muted-foreground">{s.testCount} tests</span>
                    <span className="text-[7px] font-mono text-muted-foreground">·</span>
                    <span className="text-[7px] font-mono text-muted-foreground">{s.runsCount} runs</span>
                  </div>
                  {/* Tags */}
                  {s.tags.size > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {topTags(s.tags).map(([tag]) => (
                        <span key={tag} className="text-[7px] font-mono px-1 py-0.5 rounded bg-primary/10 text-primary truncate max-w-[60px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Click hint */}
                  <span className="absolute bottom-1 right-1.5 text-[7px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-mono text-xs max-w-[220px]">
                <p className="font-semibold">{s.name}</p>
                <p>{s.passed} passed · {s.failed} failed · {s.skipped} skipped</p>
                <p className="text-muted-foreground">{s.testCount} unique tests across {s.runsCount} runs</p>
                <p className="text-muted-foreground">Avg pass rate: {s.avgRate}%</p>
                {s.tags.size > 0 && (
                  <p className="text-muted-foreground mt-0.5">Tags: {[...s.tags.keys()].slice(0, 5).join(", ")}</p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}

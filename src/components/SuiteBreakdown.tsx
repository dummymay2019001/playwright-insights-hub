import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TestResult } from "@/models/types";
import { TestRow } from "@/components/TestRow";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface SuiteBreakdownProps {
  results: TestResult[];
  runId: string;
}

interface SuiteStats {
  suite: string;
  file: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  tests: TestResult[];
}

export function SuiteBreakdown({ results, runId }: SuiteBreakdownProps) {
  const [expandedSuite, setExpandedSuite] = useState<string | null>(null);
  const navigate = useNavigate();

  const suites = useMemo(() => {
    const map = new Map<string, SuiteStats>();
    for (const t of results) {
      const key = t.suite;
      const entry = map.get(key) || { suite: key, file: t.file, total: 0, passed: 0, failed: 0, skipped: 0, duration: 0, tests: [] };
      entry.total++;
      if (t.status === "passed") entry.passed++;
      if (t.status === "failed") entry.failed++;
      if (t.status === "skipped") entry.skipped++;
      entry.duration += t.duration;
      entry.tests.push(t);
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.failed - a.failed || b.total - a.total);
  }, [results]);

  return (
    <section>
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Suite Breakdown</h2>
      <div className="space-y-2">
        {suites.map((s) => {
          const rate = s.total > 0 ? Math.round((s.passed / s.total) * 100) : 0;
          const isExpanded = expandedSuite === s.suite;
          return (
            <div key={s.suite} className="rounded-lg border bg-card overflow-hidden">
              <button
                onClick={() => setExpandedSuite(isExpanded ? null : s.suite)}
                className="w-full text-left px-3 sm:px-4 py-3 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="font-mono text-xs text-muted-foreground w-5">{isExpanded ? "▼" : "▶"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-foreground">{s.suite}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">{s.file}</Badge>
                    </div>
                    <div className="mt-1.5">
                      <Progress value={rate} className="h-1.5" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="flex gap-1.5 text-[10px] font-mono">
                      <span className="text-success">{s.passed}✓</span>
                      {s.failed > 0 && <span className="text-destructive">{s.failed}✗</span>}
                      {s.skipped > 0 && <span className="text-muted-foreground">{s.skipped}⊘</span>}
                    </div>
                    <span className={`font-mono text-sm font-bold ${rate >= 95 ? "text-success" : rate >= 80 ? "text-warning" : "text-destructive"}`}>
                      {rate}%
                    </span>
                  </div>
                </div>
              </button>
              {isExpanded && (
                <div className="border-t bg-muted/20 px-2 sm:px-3 py-2 space-y-1">
                  {s.tests.map((t) => (
                    <TestRow key={t.id} test={t} runId={runId} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

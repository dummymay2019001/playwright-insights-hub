import { useMemo } from "react";
import { TestRun } from "@/models/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  run: TestRun;
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

export function SuiteHealthMap({ run }: Props) {
  const suites = useMemo(() => {
    const map = new Map<string, { passed: number; failed: number; skipped: number; total: number }>();
    for (const t of run.results) {
      const suite = t.suite || "Default";
      const entry = map.get(suite) || { passed: 0, failed: 0, skipped: 0, total: 0 };
      entry.total++;
      if (t.status === "passed") entry.passed++;
      if (t.status === "failed") entry.failed++;
      if (t.status === "skipped") entry.skipped++;
      map.set(suite, entry);
    }
    return [...map.entries()]
      .map(([name, s]) => ({ name, ...s, rate: Math.round((s.passed / s.total) * 100) }))
      .sort((a, b) => a.rate - b.rate);
  }, [run]);

  if (suites.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Suite Health Map</h3>
        <span className="font-mono text-[10px] text-muted-foreground">{suites.length} suites</span>
      </div>
      <TooltipProvider>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
          {suites.map((s) => (
            <Tooltip key={s.name}>
              <TooltipTrigger asChild>
                <div
                  className={`relative rounded-lg border p-2 cursor-default transition-all hover:scale-105 ${getHealthBorder(s.rate)}`}
                >
                  <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${getHealthColor(s.rate)}`} />
                  <p className="font-mono text-[9px] sm:text-[10px] text-foreground truncate pr-3 leading-tight">
                    {s.name.split("/").pop() || s.name}
                  </p>
                  <p className={`font-mono text-sm font-bold mt-0.5 ${
                    s.rate >= 95 ? "text-success" : s.rate >= 80 ? "text-warning" : "text-destructive"
                  }`}>
                    {s.rate}%
                  </p>
                  <div className="flex gap-1 mt-1">
                    <span className="text-[8px] font-mono text-success">{s.passed}✓</span>
                    {s.failed > 0 && <span className="text-[8px] font-mono text-destructive">{s.failed}✗</span>}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-mono text-xs">
                <p className="font-semibold">{s.name}</p>
                <p>{s.passed} passed · {s.failed} failed · {s.skipped} skipped</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}

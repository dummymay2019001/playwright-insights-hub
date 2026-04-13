import { useState, useMemo } from "react";
import { useRuns } from "@/store/RunsContext";
import { TestRun, TestResult, TestStatus } from "@/models/types";
import { formatDate, formatDuration, passRate } from "@/utils/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { generateComparisonPdf } from "@/services/comparisonPdfGenerator";
import { FileDown } from "lucide-react";

interface ComparisonData {
  runA: TestRun;
  runB: TestRun;
  newFailures: TestResult[];
  resolved: TestResult[];
  persistent: TestResult[];
  newTests: TestResult[];
  removed: string[];
  passRateA: number;
  passRateB: number;
  passRateDelta: number;
  durationDelta: number;
  totalDelta: number;
  suiteHealthMap: Map<string, { passA: number; failA: number; passB: number; failB: number }>;
}

function buildComparison(runA: TestRun, runB: TestRun): ComparisonData {
  const mapA = new Map(runA.results.map((t) => [t.name, t]));
  const mapB = new Map(runB.results.map((t) => [t.name, t]));

  const newFailures: TestResult[] = [];
  const resolved: TestResult[] = [];
  const persistent: TestResult[] = [];
  const newTests: TestResult[] = [];
  const removed: string[] = [];

  // Tests in B but not in A
  for (const [name, testB] of mapB) {
    const testA = mapA.get(name);
    if (!testA) {
      newTests.push(testB);
    } else if (testB.status === "failed" && testA.status !== "failed") {
      newFailures.push(testB);
    } else if (testB.status !== "failed" && testA.status === "failed") {
      resolved.push(testB);
    } else if (testB.status === "failed" && testA.status === "failed") {
      persistent.push(testB);
    }
  }

  // Tests in A but not in B
  for (const [name] of mapA) {
    if (!mapB.has(name)) removed.push(name);
  }

  // Suite health
  const suiteHealthMap = new Map<string, { passA: number; failA: number; passB: number; failB: number }>();
  const allSuites = new Set([
    ...runA.results.map((t) => t.suite),
    ...runB.results.map((t) => t.suite),
  ]);
  for (const suite of allSuites) {
    const aTests = runA.results.filter((t) => t.suite === suite);
    const bTests = runB.results.filter((t) => t.suite === suite);
    suiteHealthMap.set(suite, {
      passA: aTests.filter((t) => t.status === "passed").length,
      failA: aTests.filter((t) => t.status === "failed").length,
      passB: bTests.filter((t) => t.status === "passed").length,
      failB: bTests.filter((t) => t.status === "failed").length,
    });
  }

  const prA = passRate(runA.manifest);
  const prB = passRate(runB.manifest);

  return {
    runA, runB,
    newFailures, resolved, persistent, newTests, removed,
    passRateA: prA,
    passRateB: prB,
    passRateDelta: prB - prA,
    durationDelta: runB.manifest.duration - runA.manifest.duration,
    totalDelta: runB.manifest.total - runA.manifest.total,
    suiteHealthMap,
  };
}

const ComparePage = () => {
  const { runs, loading } = useRuns();
  const [runIdA, setRunIdA] = useState<string>("");
  const [runIdB, setRunIdB] = useState<string>("");

  const sorted = useMemo(
    () => [...runs].sort((a, b) => new Date(b.manifest.timestamp).getTime() - new Date(a.manifest.timestamp).getTime()),
    [runs],
  );

  const comparison = useMemo(() => {
    if (!runIdA || !runIdB || runIdA === runIdB) return null;
    const a = runs.find((r) => r.manifest.runId === runIdA);
    const b = runs.find((r) => r.manifest.runId === runIdB);
    if (!a || !b) return null;
    return buildComparison(a, b);
  }, [runs, runIdA, runIdB]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <div className="container py-4 sm:py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Compare Runs</h2>
          <p className="text-xs text-muted-foreground">Select any two runs to compare side by side</p>
        </div>
        {comparison && (
          <Button
            size="sm"
            variant="outline"
            className="font-mono text-xs gap-1.5"
            onClick={() => generateComparisonPdf(comparison.runA, comparison.runB, comparison)}
          >
            <FileDown className="h-3.5 w-3.5" /> Export PDF
          </Button>
        )}
      </div>

      {/* Run Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RunSelector
          label="Baseline (Run A)"
          value={runIdA}
          onChange={setRunIdA}
          runs={sorted}
          excludeId={runIdB}
        />
        <RunSelector
          label="Compare (Run B)"
          value={runIdB}
          onChange={setRunIdB}
          runs={sorted}
          excludeId={runIdA}
        />
      </div>

      {!comparison && runIdA && runIdB && runIdA === runIdB && (
        <p className="font-mono text-xs text-destructive text-center py-4">Please select two different runs</p>
      )}

      {!comparison && !(runIdA && runIdB) && (
        <div className="rounded-lg border bg-card p-12 text-center space-y-2">
          <p className="text-muted-foreground text-sm">Select two runs above to see a detailed comparison</p>
          <p className="text-muted-foreground text-xs font-mono">Compare any runs regardless of how far apart they are</p>
        </div>
      )}

      {comparison && <ComparisonView data={comparison} />}
    </div>
  );
};

function RunSelector({ label, value, onChange, runs, excludeId }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  runs: TestRun[];
  excludeId: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="font-mono text-xs h-9">
          <SelectValue placeholder="Select a run…" />
        </SelectTrigger>
        <SelectContent>
          {runs.filter((r) => r.manifest.runId !== excludeId).map((r) => (
            <SelectItem key={r.manifest.runId} value={r.manifest.runId} className="font-mono text-xs">
              {r.manifest.runId.slice(0, 12)} · {formatDate(r.manifest.timestamp)} · {passRate(r.manifest)}% pass
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ComparisonView({ data }: { data: ComparisonData }) {
  const d = data;

  return (
    <div className="space-y-5">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <DeltaCard label="Pass Rate" valueA={`${d.passRateA}%`} valueB={`${d.passRateB}%`} delta={d.passRateDelta} suffix="%" good="positive" />
        <DeltaCard label="Failures" valueA={`${d.runA.manifest.failed}`} valueB={`${d.runB.manifest.failed}`} delta={d.runB.manifest.failed - d.runA.manifest.failed} good="negative" />
        <DeltaCard label="Duration" valueA={formatDuration(d.runA.manifest.duration)} valueB={formatDuration(d.runB.manifest.duration)} delta={d.durationDelta} suffix="s" good="negative" />
        <DeltaCard label="Total Tests" valueA={`${d.runA.manifest.total}`} valueB={`${d.runB.manifest.total}`} delta={d.totalDelta} good="positive" />
      </div>

      {/* New Failures */}
      {d.newFailures.length > 0 && (
        <DiffSection title="🔴 New Failures" subtitle="Tests that passed in A but fail in B" variant="destructive">
          {d.newFailures.map((t) => (
            <DiffRow key={t.id} test={t} statusA="passed" statusB="failed" />
          ))}
        </DiffSection>
      )}

      {/* Resolved */}
      {d.resolved.length > 0 && (
        <DiffSection title="🟢 Resolved" subtitle="Tests that failed in A but pass in B" variant="success">
          {d.resolved.map((t) => (
            <DiffRow key={t.id} test={t} statusA="failed" statusB={t.status} />
          ))}
        </DiffSection>
      )}

      {/* Persistent Failures */}
      {d.persistent.length > 0 && (
        <DiffSection title="🟠 Persistent Failures" subtitle="Tests failing in both runs" variant="warning">
          {d.persistent.map((t) => (
            <DiffRow key={t.id} test={t} statusA="failed" statusB="failed" />
          ))}
        </DiffSection>
      )}

      {/* New Tests */}
      {d.newTests.length > 0 && (
        <DiffSection title="🆕 New Tests" subtitle="Tests present in B but not in A" variant="info">
          {d.newTests.map((t) => (
            <DiffRow key={t.id} test={t} statusA={null} statusB={t.status} />
          ))}
        </DiffSection>
      )}

      {/* Removed Tests */}
      {d.removed.length > 0 && (
        <DiffSection title="🗑️ Removed Tests" subtitle="Tests present in A but not in B" variant="muted">
          {d.removed.map((name) => (
            <div key={name} className="flex items-center gap-2 px-3 py-1.5 rounded border bg-muted/30">
              <span className="font-mono text-xs text-muted-foreground truncate">{name}</span>
            </div>
          ))}
        </DiffSection>
      )}

      {/* Suite Health Comparison */}
      <section className="rounded-lg border bg-card p-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Suite Health Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 pr-4">Suite</th>
                <th className="text-center px-3 py-2">Pass (A)</th>
                <th className="text-center px-3 py-2">Fail (A)</th>
                <th className="text-center px-3 py-2">Pass (B)</th>
                <th className="text-center px-3 py-2">Fail (B)</th>
                <th className="text-center px-3 py-2">Δ Failures</th>
              </tr>
            </thead>
            <tbody>
              {[...d.suiteHealthMap.entries()]
                .sort((a, b) => (b[1].failB - b[1].failA) - (a[1].failB - a[1].failA))
                .map(([suite, h]) => {
                  const delta = h.failB - h.failA;
                  return (
                    <tr key={suite} className="border-b border-border/50">
                      <td className="py-2 pr-4 text-foreground truncate max-w-[200px]">{suite}</td>
                      <td className="text-center px-3 py-2 text-success">{h.passA}</td>
                      <td className="text-center px-3 py-2 text-destructive">{h.failA}</td>
                      <td className="text-center px-3 py-2 text-success">{h.passB}</td>
                      <td className="text-center px-3 py-2 text-destructive">{h.failB}</td>
                      <td className={`text-center px-3 py-2 font-semibold ${delta > 0 ? "text-destructive" : delta < 0 ? "text-success" : "text-muted-foreground"}`}>
                        {delta > 0 ? `+${delta}` : delta}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* No Changes */}
      {d.newFailures.length === 0 && d.resolved.length === 0 && d.persistent.length === 0 && d.newTests.length === 0 && d.removed.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="font-mono text-sm text-muted-foreground">✅ No test-level differences found between these runs</p>
        </div>
      )}
    </div>
  );
}

function DeltaCard({ label, valueA, valueB, delta, suffix, good }: {
  label: string; valueA: string; valueB: string; delta: number; suffix?: string; good: "positive" | "negative";
}) {
  const isGood = good === "positive" ? delta > 0 : delta < 0;
  const isBad = good === "positive" ? delta < 0 : delta > 0;
  const deltaStr = delta > 0 ? `+${delta}${suffix || ""}` : `${delta}${suffix || ""}`;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-1">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-xs text-muted-foreground">{valueA}</span>
        <span className="text-muted-foreground">→</span>
        <span className="font-mono text-sm font-semibold text-foreground">{valueB}</span>
      </div>
      {delta !== 0 && (
        <p className={`font-mono text-xs font-semibold ${isGood ? "text-success" : isBad ? "text-destructive" : "text-muted-foreground"}`}>
          {deltaStr}
        </p>
      )}
    </div>
  );
}

function DiffSection({ title, subtitle, variant, children }: {
  title: string; subtitle: string; variant: string; children: React.ReactNode;
}) {
  const borderClass = variant === "destructive" ? "border-destructive/20" :
    variant === "success" ? "border-success/20" :
    variant === "warning" ? "border-amber-500/20" : "border-border";

  return (
    <section className={`rounded-lg border ${borderClass} bg-card p-4 space-y-2`}>
      <div>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function DiffRow({ test, statusA, statusB }: {
  test: TestResult; statusA: TestStatus | null; statusB: TestStatus;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded border bg-muted/20">
      <div className="flex items-center gap-1 shrink-0">
        {statusA ? <StatusBadge status={statusA} /> : <span className="text-muted-foreground text-[10px]">—</span>}
        <span className="text-muted-foreground text-[10px]">→</span>
        <StatusBadge status={statusB} />
      </div>
      <span className="font-mono text-xs text-foreground truncate flex-1">{test.name}</span>
      <span className="font-mono text-[10px] text-muted-foreground shrink-0">{test.suite}</span>
    </div>
  );
}

export default ComparePage;

import { useState, useMemo } from "react";
import { useRuns } from "@/store/RunsContext";
import { useNavigate } from "react-router-dom";
import { TestRun, TestResult, TestStatus, DefectCategory } from "@/models/types";
import { formatDate, formatDuration, passRate } from "@/utils/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { FileDown } from "lucide-react";

export interface DurationRegression {
  name: string;
  suite: string;
  durationA: number;
  durationB: number;
  deltaMs: number;
  deltaPercent: number;
}

export interface FailureCategoryShift {
  category: string;
  countA: number;
  countB: number;
  delta: number;
}

export interface FlakyBetweenRuns {
  name: string;
  suite: string;
  statusA: TestStatus;
  statusB: TestStatus;
}

export interface ComparisonData {
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
  durationRegressions: DurationRegression[];
  failureCategoryShift: FailureCategoryShift[];
  flakyBetweenRuns: FlakyBetweenRuns[];
}

function categorizeError(error?: string): string {
  if (!error) return "Unknown";
  const e = error.toLowerCase();
  if (e.includes("timeout") || e.includes("timed out")) return "Timeout";
  if (e.includes("selector") || e.includes("locator") || e.includes("not found") || e.includes("no element")) return "Element Not Found";
  if (e.includes("assert") || e.includes("expect") || e.includes("toequal") || e.includes("tobe")) return "Assertion Failure";
  if (e.includes("network") || e.includes("fetch") || e.includes("econnrefused") || e.includes("cors")) return "Network/API Error";
  if (e.includes("auth") || e.includes("401") || e.includes("403")) return "Auth/Permission";
  if (e.includes("navigation") || e.includes("page") || e.includes("url")) return "Navigation Error";
  return "Other";
}

export function buildComparison(runA: TestRun, runB: TestRun): ComparisonData {
  const mapA = new Map(runA.results.map((t) => [t.name, t]));
  const mapB = new Map(runB.results.map((t) => [t.name, t]));

  const newFailures: TestResult[] = [];
  const resolved: TestResult[] = [];
  const persistent: TestResult[] = [];
  const newTests: TestResult[] = [];
  const removed: string[] = [];

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

  // Duration regressions (>50% increase, both runs have the test)
  const durationRegressions: DurationRegression[] = [];
  for (const [name, testB] of mapB) {
    const testA = mapA.get(name);
    if (!testA || testA.duration === 0) continue;
    const deltaMs = testB.duration - testA.duration;
    const deltaPercent = Math.round((deltaMs / testA.duration) * 100);
    if (deltaPercent >= 50 && deltaMs > 500) {
      durationRegressions.push({ name, suite: testB.suite, durationA: testA.duration, durationB: testB.duration, deltaMs, deltaPercent });
    }
  }
  durationRegressions.sort((a, b) => b.deltaPercent - a.deltaPercent);

  // Failure category shift
  const catA = new Map<string, number>();
  const catB = new Map<string, number>();
  for (const t of runA.results.filter((t) => t.status === "failed")) {
    const cat = categorizeError(t.error);
    catA.set(cat, (catA.get(cat) || 0) + 1);
  }
  for (const t of runB.results.filter((t) => t.status === "failed")) {
    const cat = categorizeError(t.error);
    catB.set(cat, (catB.get(cat) || 0) + 1);
  }
  const allCats = new Set([...catA.keys(), ...catB.keys()]);
  const failureCategoryShift: FailureCategoryShift[] = [...allCats].map((cat) => ({
    category: cat,
    countA: catA.get(cat) || 0,
    countB: catB.get(cat) || 0,
    delta: (catB.get(cat) || 0) - (catA.get(cat) || 0),
  })).filter((s) => s.countA > 0 || s.countB > 0).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  // Flaky between runs (tests that flipped pass↔fail in either direction, present in both)
  const flakyBetweenRuns: FlakyBetweenRuns[] = [];
  for (const [name, testB] of mapB) {
    const testA = mapA.get(name);
    if (!testA) continue;
    if (
      (testA.status === "passed" && testB.status === "failed") ||
      (testA.status === "failed" && testB.status === "passed")
    ) {
      flakyBetweenRuns.push({ name, suite: testB.suite, statusA: testA.status, statusB: testB.status });
    }
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
    durationRegressions,
    failureCategoryShift,
    flakyBetweenRuns,
  };
}

const ComparePage = () => {
  const { runs, loading } = useRuns();
  const navigate = useNavigate();
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
            onClick={() => navigate(`/export/compare?a=${encodeURIComponent(runIdA)}&b=${encodeURIComponent(runIdB)}`)}
          >
            <FileDown className="h-3.5 w-3.5" /> Export PDF
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RunSelector label="Baseline (Run A)" value={runIdA} onChange={setRunIdA} runs={sorted} excludeId={runIdB} />
        <RunSelector label="Compare (Run B)" value={runIdB} onChange={setRunIdB} runs={sorted} excludeId={runIdA} />
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
  label: string; value: string; onChange: (v: string) => void; runs: TestRun[]; excludeId: string;
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

  const sections: { id: string; title: string; count: number; variant: string; content: React.ReactNode }[] = [];

  if (d.newFailures.length > 0) {
    sections.push({
      id: "new-failures", title: "🔴 New Failures", count: d.newFailures.length, variant: "destructive",
      content: d.newFailures.map((t) => <DiffRow key={t.id} test={t} statusA="passed" statusB="failed" />),
    });
  }
  if (d.resolved.length > 0) {
    sections.push({
      id: "resolved", title: "🟢 Resolved", count: d.resolved.length, variant: "success",
      content: d.resolved.map((t) => <DiffRow key={t.id} test={t} statusA="failed" statusB={t.status} />),
    });
  }
  if (d.persistent.length > 0) {
    sections.push({
      id: "persistent", title: "🟠 Persistent Failures", count: d.persistent.length, variant: "warning",
      content: d.persistent.map((t) => <DiffRow key={t.id} test={t} statusA="failed" statusB="failed" />),
    });
  }
  if (d.newTests.length > 0) {
    sections.push({
      id: "new-tests", title: "🆕 New Tests", count: d.newTests.length, variant: "info",
      content: d.newTests.map((t) => <DiffRow key={t.id} test={t} statusA={null} statusB={t.status} />),
    });
  }
  if (d.removed.length > 0) {
    sections.push({
      id: "removed", title: "🗑️ Removed Tests", count: d.removed.length, variant: "muted",
      content: d.removed.map((name) => (
        <div key={name} className="flex items-center gap-2 px-3 py-1.5 rounded border bg-muted/30">
          <span className="font-mono text-xs text-muted-foreground truncate">{name}</span>
        </div>
      )),
    });
  }

  const defaultOpen = sections.filter((s) => s.variant === "destructive" || s.variant === "success").map((s) => s.id);

  return (
    <div className="space-y-5">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <DeltaCard label="Pass Rate" valueA={`${d.passRateA}%`} valueB={`${d.passRateB}%`} delta={d.passRateDelta} suffix="%" good="positive" />
        <DeltaCard label="Failures" valueA={`${d.runA.manifest.failed}`} valueB={`${d.runB.manifest.failed}`} delta={d.runB.manifest.failed - d.runA.manifest.failed} good="negative" />
        <DeltaCard label="Duration" valueA={formatDuration(d.runA.manifest.duration)} valueB={formatDuration(d.runB.manifest.duration)} delta={d.durationDelta} suffix="s" good="negative" />
        <DeltaCard label="Total Tests" valueA={`${d.runA.manifest.total}`} valueB={`${d.runB.manifest.total}`} delta={d.totalDelta} good="positive" />
      </div>

      {/* Diff Sections as Accordion */}
      {sections.length > 0 && (
        <Accordion type="multiple" defaultValue={defaultOpen} className="space-y-2">
          {sections.map((s) => {
            const borderClass =
              s.variant === "destructive" ? "border-destructive/20" :
              s.variant === "success" ? "border-success/20" :
              s.variant === "warning" ? "border-amber-500/20" : "border-border";

            return (
              <AccordionItem key={s.id} value={s.id} className={`rounded-lg border ${borderClass} bg-card overflow-hidden`}>
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{s.title}</span>
                    <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{s.count}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3">
                  <div className="space-y-1">{s.content}</div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Suite Health Comparison */}
      <Accordion type="multiple" defaultValue={["suite-health"]} className="space-y-2">
        <AccordionItem value="suite-health" className="rounded-lg border bg-card overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">📊 Suite Health Comparison</span>
              <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{d.suiteHealthMap.size} suites</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Duration Regressions */}
      {d.durationRegressions.length > 0 && (
        <Accordion type="multiple" className="space-y-2">
          <AccordionItem value="duration-regressions" className="rounded-lg border border-amber-500/20 bg-card overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">⏱️ Duration Regressions</span>
                <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{d.durationRegressions.length}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <p className="text-[10px] text-muted-foreground mb-2">Tests with ≥50% duration increase between the two runs</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 pr-4">Test</th>
                      <th className="text-left py-2 pr-2">Suite</th>
                      <th className="text-right px-2 py-2">Run A</th>
                      <th className="text-right px-2 py-2">Run B</th>
                      <th className="text-right px-2 py-2">Δ%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.durationRegressions.map((r) => (
                      <tr key={r.name} className="border-b border-border/50">
                        <td className="py-2 pr-4 text-foreground truncate max-w-[200px]">{r.name}</td>
                        <td className="py-2 pr-2 text-muted-foreground truncate max-w-[100px]">{r.suite}</td>
                        <td className="text-right px-2 py-2">{(r.durationA / 1000).toFixed(1)}s</td>
                        <td className="text-right px-2 py-2">{(r.durationB / 1000).toFixed(1)}s</td>
                        <td className="text-right px-2 py-2 text-destructive font-semibold">+{r.deltaPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Failure Category Shift */}
      {d.failureCategoryShift.length > 0 && (
        <Accordion type="multiple" defaultValue={["failure-shift"]} className="space-y-2">
          <AccordionItem value="failure-shift" className="rounded-lg border bg-card overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">🔀 Failure Category Shift</span>
                <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{d.failureCategoryShift.length} categories</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <p className="text-[10px] text-muted-foreground mb-2">How failure types changed between runs</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 pr-4">Category</th>
                      <th className="text-center px-3 py-2">Run A</th>
                      <th className="text-center px-3 py-2">Run B</th>
                      <th className="text-center px-3 py-2">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.failureCategoryShift.map((s) => (
                      <tr key={s.category} className="border-b border-border/50">
                        <td className="py-2 pr-4 text-foreground">{s.category}</td>
                        <td className="text-center px-3 py-2">{s.countA}</td>
                        <td className="text-center px-3 py-2">{s.countB}</td>
                        <td className={`text-center px-3 py-2 font-semibold ${s.delta > 0 ? "text-destructive" : s.delta < 0 ? "text-success" : "text-muted-foreground"}`}>
                          {s.delta > 0 ? `+${s.delta}` : s.delta}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Flaky Between Runs */}
      {d.flakyBetweenRuns.length > 0 && (
        <Accordion type="multiple" className="space-y-2">
          <AccordionItem value="flaky-between" className="rounded-lg border border-amber-500/20 bg-card overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">🔄 Flaky Between Runs</span>
                <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{d.flakyBetweenRuns.length}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <p className="text-[10px] text-muted-foreground mb-2">Tests that flipped between pass ↔ fail across these two runs</p>
              <div className="space-y-1">
                {d.flakyBetweenRuns.map((t) => (
                  <div key={t.name} className="flex items-center gap-2 px-3 py-1.5 rounded border bg-muted/20">
                    <div className="flex items-center gap-1 shrink-0">
                      <StatusBadge status={t.statusA} />
                      <span className="text-muted-foreground text-[10px]">→</span>
                      <StatusBadge status={t.statusB} />
                    </div>
                    <span className="font-mono text-xs text-foreground truncate flex-1">{t.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">{t.suite}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* No Changes */}
      {sections.length === 0 && (
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

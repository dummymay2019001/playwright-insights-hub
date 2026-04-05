import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRuns } from "@/store/RunsContext";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { DEFECT_CATEGORY_META } from "@/services/defectClassifier";
import { DefectCategory } from "@/models/types";

const EnvironmentsPage = () => {
  const { runs, loading } = useRuns();
  const navigate = useNavigate();
  const [selectedEnvs, setSelectedEnvs] = useState<string[]>([]);

  const envData = useMemo(() => {
    const envMap = new Map<string, {
      runCount: number;
      totalTests: number;
      passed: number;
      failed: number;
      skipped: number;
      avgDuration: number;
      failedTests: Map<string, { count: number; lastError?: string; defectCategory?: DefectCategory }>;
      branches: Set<string>;
      latestRun: string;
    }>();

    for (const run of runs) {
      const env = run.manifest.environment;
      const entry = envMap.get(env) || {
        runCount: 0, totalTests: 0, passed: 0, failed: 0, skipped: 0,
        avgDuration: 0, failedTests: new Map(), branches: new Set(), latestRun: "",
      };

      entry.runCount++;
      entry.totalTests += run.manifest.total;
      entry.passed += run.manifest.passed;
      entry.failed += run.manifest.failed;
      entry.skipped += run.manifest.skipped;
      entry.avgDuration += run.manifest.duration;
      entry.branches.add(run.manifest.branch);
      if (!entry.latestRun || run.manifest.timestamp > entry.latestRun) {
        entry.latestRun = run.manifest.timestamp;
      }

      for (const t of run.results) {
        if (t.status === "failed") {
          const existing = entry.failedTests.get(t.name) || { count: 0 };
          existing.count++;
          existing.lastError = t.error;
          existing.defectCategory = t.defectCategory;
          entry.failedTests.set(t.name, existing);
        }
      }

      envMap.set(env, entry);
    }

    return [...envMap.entries()].map(([env, data]) => ({
      env,
      ...data,
      avgDuration: Math.round(data.avgDuration / data.runCount),
      passRate: data.totalTests > 0 ? Math.round((data.passed / data.totalTests) * 100) : 0,
      branches: [...data.branches],
      failedTests: [...data.failedTests.entries()]
        .map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => b.count - a.count),
    }));
  }, [runs]);

  // Cross-env comparison: tests that fail in one env but pass in another
  const crossEnvIssues = useMemo(() => {
    const testEnvStatus = new Map<string, Map<string, { passed: number; failed: number }>>();

    for (const run of runs) {
      const env = run.manifest.environment;
      for (const t of run.results) {
        if (!testEnvStatus.has(t.name)) testEnvStatus.set(t.name, new Map());
        const envMap = testEnvStatus.get(t.name)!;
        if (!envMap.has(env)) envMap.set(env, { passed: 0, failed: 0 });
        const entry = envMap.get(env)!;
        if (t.status === "passed") entry.passed++;
        else if (t.status === "failed") entry.failed++;
      }
    }

    const issues: { testName: string; envResults: { env: string; passed: number; failed: number }[] }[] = [];

    for (const [testName, envMap] of testEnvStatus) {
      const entries = [...envMap.entries()].map(([env, data]) => ({ env, ...data }));
      if (entries.length < 2) continue;
      const hasPass = entries.some(e => e.passed > 0 && e.failed === 0);
      const hasFail = entries.some(e => e.failed > 0);
      if (hasPass && hasFail) {
        issues.push({ testName, envResults: entries });
      }
    }

    return issues.sort((a, b) => {
      const aFails = a.envResults.reduce((s, e) => s + e.failed, 0);
      const bFails = b.envResults.reduce((s, e) => s + e.failed, 0);
      return bFails - aFails;
    }).slice(0, 15);
  }, [runs]);

  const toggleEnv = (env: string) => {
    setSelectedEnvs(prev =>
      prev.includes(env) ? prev.filter(e => e !== env) : [...prev, env].slice(0, 3)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  const displayEnvs = selectedEnvs.length > 0
    ? envData.filter(e => selectedEnvs.includes(e.env))
    : envData;

  return (
    <div className="container py-4 sm:py-6 space-y-5 sm:space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-mono text-lg sm:text-xl font-bold text-foreground">Environment Comparison</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compare test results across {envData.length} environment{envData.length !== 1 ? "s" : ""} to spot env-specific failures
        </p>
      </div>

      {/* Environment selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-mono">Filter:</span>
        {envData.map(e => (
          <Button
            key={e.env}
            variant={selectedEnvs.includes(e.env) ? "default" : "outline"}
            size="sm"
            className="font-mono text-xs h-7"
            onClick={() => toggleEnv(e.env)}
          >
            {e.env} ({e.runCount})
          </Button>
        ))}
        {selectedEnvs.length > 0 && (
          <Button variant="ghost" size="sm" className="font-mono text-[10px] h-7 text-muted-foreground" onClick={() => setSelectedEnvs([])}>
            Clear
          </Button>
        )}
      </div>

      {/* Environment cards */}
      <div className={`grid gap-4 ${displayEnvs.length === 1 ? "grid-cols-1" : displayEnvs.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
        {displayEnvs.map(e => (
          <div key={e.env} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${e.passRate >= 95 ? "bg-success" : e.passRate >= 80 ? "bg-warning" : "bg-destructive"}`} />
                <h3 className="font-mono text-sm font-bold text-foreground">{e.env}</h3>
              </div>
              <span className={`font-mono text-lg font-bold ${e.passRate >= 95 ? "text-success" : e.passRate >= 80 ? "text-warning" : "text-destructive"}`}>
                {e.passRate}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Runs" value={e.runCount} />
              <StatCard label="Avg Duration" value={`${e.avgDuration}s`} />
              <StatCard label="Passed" value={e.passed} variant="success" />
              <StatCard label="Failed" value={e.failed} variant={e.failed > 0 ? "destructive" : "success"} />
            </div>

            <div className="flex flex-wrap gap-1">
              {e.branches.map(b => (
                <Badge key={b} variant="outline" className="font-mono text-[10px]">{b}</Badge>
              ))}
            </div>

            {/* Top failures in this env */}
            {e.failedTests.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Top Failures</p>
                {e.failedTests.slice(0, 5).map(ft => {
                  const catMeta = ft.defectCategory ? DEFECT_CATEGORY_META[ft.defectCategory] : null;
                  return (
                    <button
                      key={ft.name}
                      onClick={() => navigate(`/test/${encodeURIComponent(ft.name)}`)}
                      className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/30 transition-colors"
                    >
                      <span className="font-mono text-[10px] text-destructive font-bold">{ft.count}×</span>
                      <span className="font-mono text-[10px] text-foreground truncate flex-1">{ft.name}</span>
                      {catMeta && <span className="text-[10px]" title={catMeta.label}>{catMeta.icon}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cross-environment issues */}
      {crossEnvIssues.length > 0 && (
        <section className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🔀</span>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Environment-Specific Failures</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Tests that pass in one environment but fail in another — likely caused by environment configuration differences.
          </p>

          <div className="space-y-1">
            {crossEnvIssues.map(issue => (
              <button
                key={issue.testName}
                onClick={() => navigate(`/test/${encodeURIComponent(issue.testName)}`)}
                className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md border hover:bg-accent/30 transition-colors"
              >
                <span className="font-mono text-xs text-foreground truncate flex-1">{issue.testName}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {issue.envResults.map(er => (
                    <div key={er.env} className="flex items-center gap-1">
                      <Badge variant="outline" className="font-mono text-[9px]">{er.env}</Badge>
                      <StatusBadge status={er.failed > 0 ? "failed" : "passed"} />
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {envData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="font-mono text-muted-foreground text-sm">No environment data available</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>← Dashboard</Button>
        </div>
      )}
    </div>
  );
};

export default EnvironmentsPage;

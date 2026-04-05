import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRuns } from "@/store/RunsContext";
import { computeInsights } from "@/services/insightsEngine";
import { HealthGauge } from "@/components/HealthGauge";
import { InsightSection } from "@/components/InsightSection";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { DEFECT_CATEGORY_META, SEVERITY_META } from "@/services/defectClassifier";
import { DefectCategory, Severity } from "@/models/types";

const InsightsPage = () => {
  const { runs, loading } = useRuns();
  const navigate = useNavigate();

  const insights = useMemo(() => computeInsights(runs), [runs]);

  // Aggregate defect categories from latest run
  const defectBreakdown = useMemo(() => {
    const latest = [...runs].sort((a, b) => new Date(b.manifest.timestamp).getTime() - new Date(a.manifest.timestamp).getTime())[0];
    if (!latest) return [];
    const catMap = new Map<DefectCategory, number>();
    for (const t of latest.results) {
      if (t.status === "failed" && t.defectCategory) {
        catMap.set(t.defectCategory, (catMap.get(t.defectCategory) || 0) + 1);
      }
    }
    return [...catMap.entries()].map(([cat, count]) => ({ cat, count, meta: DEFECT_CATEGORY_META[cat] })).sort((a, b) => b.count - a.count);
  }, [runs]);

  // Severity distribution from latest run
  const severityBreakdown = useMemo(() => {
    const latest = [...runs].sort((a, b) => new Date(b.manifest.timestamp).getTime() - new Date(a.manifest.timestamp).getTime())[0];
    if (!latest) return [];
    const sevMap = new Map<Severity, { total: number; failed: number }>();
    for (const t of latest.results) {
      const sev = t.severity || "normal";
      const entry = sevMap.get(sev) || { total: 0, failed: 0 };
      entry.total++;
      if (t.status === "failed") entry.failed++;
      sevMap.set(sev, entry);
    }
    return [...sevMap.entries()]
      .map(([sev, data]) => ({ sev, ...data, meta: SEVERITY_META[sev] }))
      .sort((a, b) => a.meta.priority - b.meta.priority);
  }, [runs]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-mono text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-muted-foreground">No data available</p>
      </div>
    );
  }

  const { healthScore } = insights;
  const criticalCount = insights.newlyFailing.length + insights.failureHotspots.length;
  const warningCount = insights.frequentlyFailing.length + insights.flakyCandidates.length + insights.durationRegressions.length;

  return (
    <div className="container py-4 sm:py-6 space-y-6">
      {/* Health Overview */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Test Health Overview</h2>
            <p className="text-xs text-muted-foreground">
              {insights.totalUniqueTests} unique tests across {insights.totalRuns} runs
              {criticalCount > 0 && <span className="text-destructive ml-2">· {criticalCount} critical</span>}
              {warningCount > 0 && <span className="text-warning ml-2">· {warningCount} warnings</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          <HealthGauge score={healthScore.overall} label="Overall" size="lg" />
          <HealthGauge score={healthScore.coverage} label="Pass Rate" />
          <HealthGauge score={healthScore.stability} label="Stability" />
          <HealthGauge score={healthScore.flakiness} label="Flakiness" />
          <HealthGauge score={healthScore.speed} label="Speed" />
        </div>
      </section>

      {/* Defect Categories & Severity */}
      {(defectBreakdown.length > 0 || severityBreakdown.length > 0) && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {defectBreakdown.length > 0 && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Defect Categories</h3>
              <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                {defectBreakdown.map(d => (
                  <div
                    key={d.cat}
                    className="h-full"
                    style={{ width: `${(d.count / defectBreakdown.reduce((s, x) => s + x.count, 0)) * 100}%`, backgroundColor: d.meta.color }}
                    title={`${d.meta.label}: ${d.count}`}
                  />
                ))}
              </div>
              <div className="space-y-1.5">
                {defectBreakdown.map(d => (
                  <div key={d.cat} className="flex items-center gap-2">
                    <span className="text-sm">{d.meta.icon}</span>
                    <span className="font-mono text-xs text-foreground flex-1">{d.meta.label}</span>
                    <span className="font-mono text-xs font-bold text-muted-foreground">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {severityBreakdown.length > 0 && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Severity Distribution</h3>
              <div className="space-y-1.5">
                {severityBreakdown.map(s => (
                  <div key={s.sev} className="flex items-center gap-2">
                    <span className="text-sm">{s.meta.icon}</span>
                    <span className="font-mono text-xs text-foreground flex-1">{s.meta.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">{s.total} tests</span>
                    {s.failed > 0 && (
                      <span className="font-mono text-[10px] text-destructive font-bold">{s.failed} failed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Insights Sections */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Actionable Insights</h2>

        {/* Newly Failing */}
        <InsightSection
          title="Newly Failing Tests"
          icon="🔴"
          count={insights.newlyFailing.length}
          severity="critical"
          defaultOpen={insights.newlyFailing.length > 0}
        >
          <p className="text-xs text-muted-foreground mb-3">Tests that failed in the latest run but passed in the previous run.</p>
          <div className="space-y-1.5">
            {insights.newlyFailing.map((t) => (
              <button
                key={t.testName}
                onClick={() => navigate(`/test/${encodeURIComponent(t.testName)}`)}
                className="w-full text-left flex items-start gap-2 px-3 py-2 rounded border bg-card hover:bg-accent/30 transition-colors"
              >
                <StatusBadge status="failed" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-foreground truncate">{t.testName}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <Badge variant="outline" className="font-mono text-[10px]">{t.suite}</Badge>
                    {t.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="font-mono text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                  {t.latestError && (
                    <pre className="font-mono text-[10px] text-destructive/70 mt-1 truncate">{t.latestError.split("\n")[0]}</pre>
                  )}
                </div>
              </button>
            ))}
          </div>
        </InsightSection>

        {/* Frequently Failing */}
        <InsightSection
          title="Frequently Failing Tests"
          icon="🔁"
          count={insights.frequentlyFailing.length}
          severity="warning"
          defaultOpen
        >
          <p className="text-xs text-muted-foreground mb-3">Tests that have failed in 2 or more runs, ranked by failure rate.</p>
          <div className="space-y-1.5">
            {insights.frequentlyFailing.map((t) => (
              <button
                key={t.testName}
                onClick={() => navigate(`/test/${encodeURIComponent(t.testName)}`)}
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded border bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-foreground truncate">{t.testName}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {t.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="font-mono text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xs font-semibold text-destructive">{t.failRate}% fail</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{t.failCount}/{t.totalRuns} runs</p>
                </div>
              </button>
            ))}
          </div>
        </InsightSection>

        {/* Flaky Candidates */}
        <InsightSection
          title="Flaky Test Candidates"
          icon="⚡"
          count={insights.flakyCandidates.length}
          severity="warning"
        >
          <p className="text-xs text-muted-foreground mb-3">Tests that required retries to pass — indicators of non-deterministic behavior.</p>
          <div className="space-y-1.5">
            {insights.flakyCandidates.map((t) => (
              <button
                key={t.testName}
                onClick={() => navigate(`/test/${encodeURIComponent(t.testName)}`)}
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded border bg-card hover:bg-accent/30 transition-colors"
              >
                <Badge variant="outline" className="font-mono text-[10px] bg-warning/10 text-warning border-warning/30 shrink-0">
                  ⚡ flaky
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-foreground truncate">{t.testName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xs text-warning">{t.retryCount} retries</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{t.recoveryRate}% recovered</p>
                </div>
              </button>
            ))}
          </div>
        </InsightSection>

        {/* Slowest Tests */}
        <InsightSection
          title="Slowest Tests"
          icon="🐌"
          count={insights.slowestTests.length}
          severity="info"
          defaultOpen
        >
          <p className="text-xs text-muted-foreground mb-3">Top 10 slowest tests from the latest run with duration trends.</p>
          <div className="space-y-1.5">
            {insights.slowestTests.map((t) => (
              <button
                key={t.testName}
                onClick={() => navigate(`/test/${encodeURIComponent(t.testName)}`)}
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded border bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-foreground truncate">{t.testName}</p>
                  <div className="flex gap-1 mt-1">
                    {t.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="font-mono text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xs font-semibold text-foreground">{t.avgDuration}ms avg</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    max {t.maxDuration}ms
                    {t.trend === "increasing" && <span className="text-destructive ml-1">↑</span>}
                    {t.trend === "decreasing" && <span className="text-success ml-1">↓</span>}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </InsightSection>

        {/* Duration Regressions */}
        <InsightSection
          title="Duration Regressions"
          icon="📈"
          count={insights.durationRegressions.length}
          severity="warning"
        >
          <p className="text-xs text-muted-foreground mb-3">Tests that are significantly slower than their historical average (50%+ increase).</p>
          <div className="space-y-1.5">
            {insights.durationRegressions.map((t) => (
              <button
                key={t.testName}
                onClick={() => navigate(`/test/${encodeURIComponent(t.testName)}`)}
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded border bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-foreground truncate">{t.testName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xs text-destructive font-semibold">+{t.increasePercent}%</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{t.previousAvg}ms → {t.currentDuration}ms</p>
                </div>
              </button>
            ))}
          </div>
        </InsightSection>

        {/* Failure Hotspots */}
        <InsightSection
          title="Failure Hotspots"
          icon="🔥"
          count={insights.failureHotspots.length}
          severity="critical"
        >
          <p className="text-xs text-muted-foreground mb-3">Test files with the highest concentration of failures.</p>
          <div className="space-y-1.5">
            {insights.failureHotspots.map((f) => (
              <div
                key={f.file}
                className="flex items-center gap-2 px-3 py-2 rounded border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-foreground truncate">{f.file}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xs text-destructive font-semibold">{f.failCount} failures</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{f.failRate}% of {f.testCount} tests</p>
                </div>
              </div>
            ))}
          </div>
        </InsightSection>

        {/* Suite Health */}
        <InsightSection
          title="Suite Health Breakdown"
          icon="🏥"
          count={insights.suiteHealth.length}
          severity="info"
        >
          <p className="text-xs text-muted-foreground mb-3">Health status of each test suite from the latest run.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {insights.suiteHealth.map((s) => (
              <div key={s.suite} className="flex items-center gap-3 px-3 py-2.5 rounded border bg-card">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs font-medium text-foreground">{s.suite}</p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                    {s.passed}✓ {s.failed}✗ {s.skipped}⊘ · avg {s.avgDuration}ms
                  </p>
                </div>
                <span className={`font-mono text-sm font-bold ${s.passRate >= 95 ? "text-success" : s.passRate >= 80 ? "text-warning" : "text-destructive"}`}>
                  {s.passRate}%
                </span>
              </div>
            ))}
          </div>
        </InsightSection>
      </section>
    </div>
  );
};

export default InsightsPage;

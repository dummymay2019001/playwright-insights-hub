import { TestRun, TestResult } from "@/models/types";

export interface InsightItem {
  testName: string;
  suite: string;
  file: string;
  tags: string[];
}

export interface NewlyFailing extends InsightItem {
  latestError?: string;
}

export interface FrequentlyFailing extends InsightItem {
  failCount: number;
  failRate: number;
  totalRuns: number;
}

export interface SlowestTest extends InsightItem {
  avgDuration: number;
  maxDuration: number;
  trend: "increasing" | "decreasing" | "stable";
}

export interface FlakyCandidate extends InsightItem {
  retryCount: number;
  flakyRuns: number;
  recoveryRate: number;
}

export interface DurationRegression extends InsightItem {
  previousAvg: number;
  currentDuration: number;
  increasePercent: number;
}

export interface SuiteHealth {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  avgDuration: number;
}

export interface FailureHotspot {
  file: string;
  failCount: number;
  testCount: number;
  failRate: number;
}

export interface TestHealthScore {
  overall: number; // 0-100
  stability: number;
  speed: number;
  flakiness: number;
  coverage: number;
}

export function computeInsights(runs: TestRun[]) {
  const sorted = [...runs].sort(
    (a, b) => new Date(a.manifest.timestamp).getTime() - new Date(b.manifest.timestamp).getTime()
  );

  if (sorted.length === 0) return null;

  const latest = sorted[sorted.length - 1];
  const previous = sorted.length >= 2 ? sorted[sorted.length - 2] : null;

  // Collect all unique test names
  const allTestNames = new Set<string>();
  sorted.forEach((r) => r.results.forEach((t) => allTestNames.add(t.name)));

  // Build per-test history
  const testHistory = new Map<string, { run: typeof sorted[0]["manifest"]; test: TestResult }[]>();
  for (const name of allTestNames) {
    const history: { run: typeof sorted[0]["manifest"]; test: TestResult }[] = [];
    for (const run of sorted) {
      const t = run.results.find((r) => r.name === name);
      if (t) history.push({ run: run.manifest, test: t });
    }
    testHistory.set(name, history);
  }

  // 1. Newly Failing
  const newlyFailing: NewlyFailing[] = [];
  if (previous) {
    const prevFailed = new Set(previous.results.filter((t) => t.status === "failed").map((t) => t.name));
    for (const t of latest.results) {
      if (t.status === "failed" && !prevFailed.has(t.name)) {
        newlyFailing.push({ testName: t.name, suite: t.suite, file: t.file, tags: t.tags, latestError: t.error });
      }
    }
  }

  // 2. Frequently Failing (across last N runs)
  const frequentlyFailing: FrequentlyFailing[] = [];
  for (const [name, history] of testHistory) {
    const failCount = history.filter((h) => h.test.status === "failed").length;
    if (failCount >= 2) {
      const sample = history[history.length - 1].test;
      frequentlyFailing.push({
        testName: name,
        suite: sample.suite,
        file: sample.file,
        tags: sample.tags,
        failCount,
        failRate: Math.round((failCount / history.length) * 100),
        totalRuns: history.length,
      });
    }
  }
  frequentlyFailing.sort((a, b) => b.failRate - a.failRate);

  // 3. Slowest Tests (from latest run)
  const slowestTests: SlowestTest[] = [...latest.results]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10)
    .map((t) => {
      const history = testHistory.get(t.name) || [];
      const durations = history.map((h) => h.test.duration);
      const avg = Math.round(durations.reduce((s, d) => s + d, 0) / durations.length);
      const max = Math.max(...durations);
      // Trend: compare first half avg vs second half avg
      let trend: "increasing" | "decreasing" | "stable" = "stable";
      if (durations.length >= 4) {
        const mid = Math.floor(durations.length / 2);
        const firstHalf = durations.slice(0, mid).reduce((s, d) => s + d, 0) / mid;
        const secondHalf = durations.slice(mid).reduce((s, d) => s + d, 0) / (durations.length - mid);
        if (secondHalf > firstHalf * 1.15) trend = "increasing";
        else if (secondHalf < firstHalf * 0.85) trend = "decreasing";
      }
      return { testName: t.name, suite: t.suite, file: t.file, tags: t.tags, avgDuration: avg, maxDuration: max, trend };
    });

  // 4. Flaky Candidates
  const flakyCandidates: FlakyCandidate[] = [];
  for (const [name, history] of testHistory) {
    const flakyRuns = history.filter((h) => h.test.retries > 0).length;
    const totalRetries = history.reduce((s, h) => s + h.test.retries, 0);
    if (flakyRuns >= 1 && totalRetries >= 2) {
      const recovered = history.filter((h) => h.test.retries > 0 && h.test.status === "passed").length;
      const sample = history[history.length - 1].test;
      flakyCandidates.push({
        testName: name,
        suite: sample.suite,
        file: sample.file,
        tags: sample.tags,
        retryCount: totalRetries,
        flakyRuns,
        recoveryRate: flakyRuns > 0 ? Math.round((recovered / flakyRuns) * 100) : 0,
      });
    }
  }
  flakyCandidates.sort((a, b) => b.retryCount - a.retryCount);

  // 5. Duration Regressions (latest vs historical avg)
  const durationRegressions: DurationRegression[] = [];
  for (const t of latest.results) {
    const history = testHistory.get(t.name) || [];
    if (history.length < 3) continue;
    const prevDurations = history.slice(0, -1).map((h) => h.test.duration);
    const prevAvg = prevDurations.reduce((s, d) => s + d, 0) / prevDurations.length;
    const increasePercent = prevAvg > 0 ? Math.round(((t.duration - prevAvg) / prevAvg) * 100) : 0;
    if (increasePercent > 50 && t.duration > 500) {
      durationRegressions.push({
        testName: t.name,
        suite: t.suite,
        file: t.file,
        tags: t.tags,
        previousAvg: Math.round(prevAvg),
        currentDuration: t.duration,
        increasePercent,
      });
    }
  }
  durationRegressions.sort((a, b) => b.increasePercent - a.increasePercent);

  // 6. Suite Health
  const suiteMap = new Map<string, { total: number; passed: number; failed: number; skipped: number; durations: number[] }>();
  for (const t of latest.results) {
    const entry = suiteMap.get(t.suite) || { total: 0, passed: 0, failed: 0, skipped: 0, durations: [] };
    entry.total++;
    if (t.status === "passed") entry.passed++;
    if (t.status === "failed") entry.failed++;
    if (t.status === "skipped") entry.skipped++;
    entry.durations.push(t.duration);
    suiteMap.set(t.suite, entry);
  }
  const suiteHealth: SuiteHealth[] = [...suiteMap.entries()]
    .map(([suite, s]) => ({
      suite,
      total: s.total,
      passed: s.passed,
      failed: s.failed,
      skipped: s.skipped,
      passRate: Math.round((s.passed / s.total) * 100),
      avgDuration: Math.round(s.durations.reduce((a, b) => a + b, 0) / s.durations.length),
    }))
    .sort((a, b) => a.passRate - b.passRate);

  // 7. Failure Hotspots (by file)
  const fileMap = new Map<string, { failCount: number; testCount: number }>();
  for (const t of latest.results) {
    const entry = fileMap.get(t.file) || { failCount: 0, testCount: 0 };
    entry.testCount++;
    if (t.status === "failed") entry.failCount++;
    fileMap.set(t.file, entry);
  }
  const failureHotspots: FailureHotspot[] = [...fileMap.entries()]
    .filter(([, s]) => s.failCount > 0)
    .map(([file, s]) => ({
      file,
      failCount: s.failCount,
      testCount: s.testCount,
      failRate: Math.round((s.failCount / s.testCount) * 100),
    }))
    .sort((a, b) => b.failCount - a.failCount);

  // 8. Overall Health Score
  const latestPassRate = latest.manifest.total > 0 ? (latest.manifest.passed / latest.manifest.total) * 100 : 0;
  const flakyScore = Math.max(0, 100 - flakyCandidates.length * 15);
  const speedScore = (() => {
    const avgDur = latest.results.reduce((s, t) => s + t.duration, 0) / latest.results.length;
    if (avgDur < 1000) return 100;
    if (avgDur < 3000) return 80;
    if (avgDur < 5000) return 60;
    return 40;
  })();
  const stabilityScore = Math.min(100, Math.round(
    frequentlyFailing.length === 0 ? 100 : Math.max(0, 100 - frequentlyFailing.length * 10)
  ));

  const healthScore: TestHealthScore = {
    overall: Math.round((latestPassRate * 0.4 + stabilityScore * 0.25 + flakyScore * 0.2 + speedScore * 0.15)),
    stability: stabilityScore,
    speed: speedScore,
    flakiness: flakyScore,
    coverage: Math.round(latestPassRate),
  };

  return {
    newlyFailing,
    frequentlyFailing,
    slowestTests,
    flakyCandidates,
    durationRegressions,
    suiteHealth,
    failureHotspots,
    healthScore,
    totalUniqueTests: allTestNames.size,
    totalRuns: sorted.length,
  };
}

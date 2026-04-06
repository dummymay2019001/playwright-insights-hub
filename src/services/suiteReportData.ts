import { TestRun, TestResult } from "@/models/types";
import { SuiteExportOptions } from "@/models/suiteExportTypes";
import { formatDate } from "@/utils/format";

/** Data structure for suite report - computed from multiple runs */
export interface SuiteReportData {
  suiteName: string;
  runsAnalyzed: number;
  totalRuns: number;
  firstSeen: string;
  lastSeen: string;
  // Stability
  stabilityScore: number; // % of runs with 100% pass
  perfectRuns: number;
  avgPassRate: number;
  trend: number; // delta vs previous
  // Cross-run per-test status (testName → runId → status)
  crossRunStatus: Map<string, Map<string, string>>;
  // Per-run history
  history: {
    runId: string;
    timestamp: string;
    branch: string;
    environment: string;
    passed: number;
    failed: number;
    skipped: number;
    total: number;
    passRate: number;
    duration: number;
  }[];
  // Flaky tests
  flakyTests: {
    name: string;
    totalRuns: number;
    passed: number;
    failed: number;
    flakeRate: number;
    lastStatus: string;
  }[];
  // Failure patterns
  failurePatterns: {
    category: string;
    count: number;
    percentage: number;
    sampleError: string;
    affectedTests: string[];
  }[];
  // Latest results for test list
  latestResults: TestResult[];
  // Tag summary from latest
  tagMap: Map<string, { total: number; passed: number; failed: number }>;
}

function categorizeError(error?: string): string {
  if (!error) return "Unknown";
  const e = error.toLowerCase();
  if (e.includes("timeout") || e.includes("timed out")) return "Timeout";
  if (e.includes("selector") || e.includes("locator") || e.includes("not found") || e.includes("no element")) return "Element Not Found";
  if (e.includes("assert") || e.includes("expect") || e.includes("toequal") || e.includes("tobe")) return "Assertion Failure";
  if (e.includes("network") || e.includes("fetch") || e.includes("econnrefused") || e.includes("api")) return "Network/API Error";
  if (e.includes("auth") || e.includes("401") || e.includes("403") || e.includes("permission")) return "Auth/Permission";
  if (e.includes("navigation") || e.includes("page") || e.includes("url")) return "Navigation Error";
  return "Other";
}

export function buildSuiteReportData(
  suiteName: string,
  runs: TestRun[],
  sourceMode: "latest" | "all" | string
): SuiteReportData {
  const sorted = [...runs]
    .filter((r) => r.results.some((t) => t.suite === suiteName))
    .sort((a, b) => new Date(a.manifest.timestamp).getTime() - new Date(b.manifest.timestamp).getTime());

  const history = sorted.map((run) => {
    const tests = run.results.filter((t) => t.suite === suiteName);
    const passed = tests.filter((t) => t.status === "passed").length;
    const failed = tests.filter((t) => t.status === "failed").length;
    const skipped = tests.filter((t) => t.status === "skipped").length;
    return {
      runId: run.manifest.runId,
      timestamp: run.manifest.timestamp,
      branch: run.manifest.branch,
      environment: run.manifest.environment,
      passed, failed, skipped,
      total: tests.length,
      passRate: tests.length > 0 ? Math.round((passed / tests.length) * 100) : 0,
      duration: tests.reduce((s, t) => s + t.duration, 0),
    };
  });

  const perfectRuns = history.filter((h) => h.passRate === 100).length;
  const stabilityScore = history.length > 0 ? Math.round((perfectRuns / history.length) * 100) : 0;
  const avgPassRate = history.length > 0 ? Math.round(history.reduce((s, h) => s + h.passRate, 0) / history.length) : 0;
  const trend = history.length >= 2 ? history[history.length - 1].passRate - history[history.length - 2].passRate : 0;

  // Flaky tests: tests that have both passed and failed across runs
  const testMap = new Map<string, { passed: number; failed: number; totalRuns: number; lastStatus: string }>();
  for (const run of sorted) {
    for (const t of run.results.filter((t) => t.suite === suiteName)) {
      const e = testMap.get(t.name) || { passed: 0, failed: 0, totalRuns: 0, lastStatus: "" };
      e.totalRuns++;
      if (t.status === "passed") e.passed++;
      if (t.status === "failed") e.failed++;
      e.lastStatus = t.status;
      testMap.set(t.name, e);
    }
  }
  const flakyTests = [...testMap.entries()]
    .filter(([, s]) => s.passed > 0 && s.failed > 0)
    .map(([name, s]) => ({
      name,
      totalRuns: s.totalRuns,
      passed: s.passed,
      failed: s.failed,
      flakeRate: Math.round((Math.min(s.passed, s.failed) / s.totalRuns) * 100),
      lastStatus: s.lastStatus,
    }))
    .sort((a, b) => b.flakeRate - a.flakeRate);

  // Failure patterns
  const patternMap = new Map<string, { count: number; sampleError: string; affectedTests: Set<string> }>();
  for (const run of sorted) {
    for (const t of run.results.filter((t) => t.suite === suiteName && t.status === "failed")) {
      const cat = categorizeError(t.error);
      const e = patternMap.get(cat) || { count: 0, sampleError: "", affectedTests: new Set<string>() };
      e.count++;
      if (!e.sampleError && t.error) e.sampleError = t.error.split("\n")[0];
      e.affectedTests.add(t.name);
      patternMap.set(cat, e);
    }
  }
  const totalFailures = [...patternMap.values()].reduce((s, e) => s + e.count, 0);
  const failurePatterns = [...patternMap.entries()]
    .map(([category, e]) => ({
      category,
      count: e.count,
      percentage: totalFailures > 0 ? Math.round((e.count / totalFailures) * 100) : 0,
      sampleError: e.sampleError,
      affectedTests: [...e.affectedTests],
    }))
    .sort((a, b) => b.count - a.count);

  // Cross-run per-test status
  const crossRunStatus = new Map<string, Map<string, string>>();
  for (const run of sorted) {
    for (const t of run.results.filter((t) => t.suite === suiteName)) {
      if (!crossRunStatus.has(t.name)) crossRunStatus.set(t.name, new Map());
      crossRunStatus.get(t.name)!.set(run.manifest.runId, t.status);
    }
  }

  // Latest results
  const latestRun = sorted[sorted.length - 1];
  const latestResults = latestRun ? latestRun.results.filter((t) => t.suite === suiteName) : [];

  // Tags from latest
  const tagMap = new Map<string, { total: number; passed: number; failed: number }>();
  for (const t of latestResults) {
    for (const tag of t.tags) {
      const e = tagMap.get(tag) || { total: 0, passed: 0, failed: 0 };
      e.total++;
      if (t.status === "passed") e.passed++;
      if (t.status === "failed") e.failed++;
      tagMap.set(tag, e);
    }
  }

  return {
    suiteName,
    runsAnalyzed: sorted.length,
    totalRuns: runs.length,
    firstSeen: sorted[0]?.manifest.timestamp || "",
    lastSeen: sorted[sorted.length - 1]?.manifest.timestamp || "",
    stabilityScore,
    perfectRuns,
    avgPassRate,
    trend,
    crossRunStatus,
    history,
    flakyTests,
    failurePatterns,
    latestResults,
    tagMap,
  };
}

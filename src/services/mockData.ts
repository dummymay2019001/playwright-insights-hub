import { RunManifest, TestResult, TestRun, TestStatus } from "@/models/types";

const SUITES = ["auth", "checkout", "dashboard", "profile", "settings", "api", "navigation"];
const TAGS_MAP: Record<string, string[]> = {
  auth: ["smoke", "critical"],
  checkout: ["regression", "payment"],
  dashboard: ["smoke", "ui"],
  profile: ["regression"],
  settings: ["regression", "ui"],
  api: ["smoke", "api"],
  navigation: ["smoke", "ui"],
};

const TEST_NAMES: Record<string, string[]> = {
  auth: ["login with valid credentials", "login with invalid password", "signup flow", "password reset", "session expiry", "OAuth Google login"],
  checkout: ["add to cart", "remove from cart", "apply coupon", "payment success", "payment failure", "shipping calculation"],
  dashboard: ["renders summary cards", "chart data loads", "filter by date", "export CSV", "responsive layout"],
  profile: ["update name", "upload avatar", "change email", "delete account"],
  settings: ["toggle notifications", "change language", "update timezone", "two-factor setup"],
  api: ["GET /users", "POST /orders", "PUT /settings", "DELETE /session", "rate limiting"],
  navigation: ["sidebar toggle", "breadcrumb navigation", "deep link routing", "404 page"],
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generateResults(runIndex: number): TestResult[] {
  const rand = seededRandom(runIndex * 1000 + 42);
  const results: TestResult[] = [];
  let id = 0;

  for (const suite of SUITES) {
    for (const name of TEST_NAMES[suite]) {
      id++;
      const r = rand();
      let status: TestStatus = "passed";
      if (r < 0.06 + runIndex * 0.005) status = "failed";
      else if (r < 0.10 + runIndex * 0.003) status = "skipped";

      const retries = status === "failed" && rand() > 0.5 ? Math.floor(rand() * 3) + 1 : 0;
      const baseDuration = 200 + rand() * 4000;

      results.push({
        id: `test-${runIndex}-${id}`,
        name: `${suite} > ${name}`,
        suite,
        file: `tests/${suite}.spec.ts`,
        status: retries > 0 && rand() > 0.6 ? "passed" : status,
        duration: Math.round(baseDuration),
        retries,
        tags: TAGS_MAP[suite] || [],
        error: status === "failed" ? `AssertionError: expected true to be false\n    at tests/${suite}.spec.ts:${Math.floor(rand() * 100 + 10)}:5` : undefined,
        logs: status === "failed" ? [`[INFO] Starting ${name}`, `[ERROR] Assertion failed at step 3`] : undefined,
      });
    }
  }
  return results;
}

function generateManifest(runIndex: number, results: TestResult[]): RunManifest {
  const date = new Date(2026, 3, 1 + runIndex, 10, 0, 0);
  const ts = date.toISOString();
  const runId = `run-${ts.replace(/[:.]/g, "-").slice(0, 19)}`;
  const branches = ["main", "main", "main", "feat/checkout", "fix/auth-bug", "main", "main", "feat/dashboard"];
  const envs = ["staging", "staging", "production", "staging", "staging", "production", "staging", "staging"];

  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const totalDuration = Math.round(results.reduce((s, r) => s + r.duration, 0) / 1000);

  return {
    runId,
    timestamp: ts,
    branch: branches[runIndex % branches.length],
    environment: envs[runIndex % envs.length],
    total: results.length,
    passed,
    failed,
    skipped,
    duration: totalDuration,
  };
}

export function generateMockRuns(count = 8): TestRun[] {
  const runs: TestRun[] = [];
  for (let i = 0; i < count; i++) {
    const results = generateResults(i);
    const manifest = generateManifest(i, results);
    runs.push({ manifest, results });
  }
  return runs;
}

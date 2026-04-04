import { RunManifest, TestResult, TestRun, TestStatus, ApiPayload } from "@/models/types";

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

const API_ENDPOINTS: Record<string, { method: string; url: string; reqBody?: unknown; resBody: (ok: boolean) => unknown }> = {
  "GET /users": { method: "GET", url: "/api/v1/users", resBody: (ok) => ok ? { users: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }], total: 2 } : { error: "Unauthorized", code: 401 } },
  "POST /orders": { method: "POST", url: "/api/v1/orders", reqBody: { productId: "sku-123", quantity: 2, coupon: "SAVE10" }, resBody: (ok) => ok ? { orderId: "ord-9876", status: "confirmed", total: 89.99 } : { error: "Out of stock", code: 422 } },
  "PUT /settings": { method: "PUT", url: "/api/v1/settings", reqBody: { theme: "dark", locale: "en-US", notifications: true }, resBody: (ok) => ok ? { updated: true } : { error: "Validation failed", code: 400 } },
  "DELETE /session": { method: "DELETE", url: "/api/v1/session", resBody: (ok) => ok ? { success: true } : { error: "Session not found", code: 404 } },
  "rate limiting": { method: "GET", url: "/api/v1/health", resBody: (ok) => ok ? { status: "ok", rateLimit: { remaining: 98, limit: 100 } } : { error: "Too Many Requests", code: 429 } },
};

function generateApiPayload(testName: string, status: TestStatus, rand: () => number): ApiPayload {
  const endpoint = API_ENDPOINTS[testName];
  if (!endpoint) return { method: "GET", url: "/api/unknown", statusCode: 200, latency: Math.round(rand() * 500) };
  const ok = status === "passed";
  return {
    method: endpoint.method,
    url: endpoint.url,
    statusCode: ok ? (endpoint.method === "POST" ? 201 : 200) : [400, 401, 404, 422, 429][Math.floor(rand() * 5)],
    requestHeaders: { "Content-Type": "application/json", "Authorization": "Bearer eyJhbG...truncated" },
    requestBody: endpoint.reqBody,
    responseHeaders: { "Content-Type": "application/json", "X-Request-Id": `req-${Math.floor(rand() * 99999)}` },
    responseBody: endpoint.resBody(ok),
    latency: Math.round(50 + rand() * 450),
  };
}

function generateResults(runIndex: number): TestResult[] {
  const rand = seededRandom(runIndex * 1000 + 42);
  const results: TestResult[] = [];
  let id = 0;

  // Gradually introduce suites: early runs have fewer suites
  // Run 0: 3 suites, Run 1: 4, Run 2: 5, Run 3+: 6, Run 5+: all 7
  const availableSuites = SUITES.slice(0, Math.min(SUITES.length, 3 + Math.floor(runIndex * 0.7)));

  for (const suite of availableSuites) {
    const allTests = TEST_NAMES[suite];
    // Gradually introduce tests within a suite
    // Early runs might have fewer tests per suite
    const testCount = Math.min(allTests.length, Math.max(2, Math.floor(allTests.length * (0.5 + runIndex * 0.08))));
    const availableTests = allTests.slice(0, testCount);

    for (const name of availableTests) {
      id++;
      const r = rand();
      let status: TestStatus = "passed";
      if (r < 0.06 + runIndex * 0.005) status = "failed";
      else if (r < 0.10 + runIndex * 0.003) status = "skipped";

      const retries = status === "failed" && rand() > 0.5 ? Math.floor(rand() * 3) + 1 : 0;
      const baseDuration = 200 + rand() * 4000;

      const apiPayload: ApiPayload | undefined = suite === "api" ? generateApiPayload(name, status, rand) : undefined;

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
        apiPayload,
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

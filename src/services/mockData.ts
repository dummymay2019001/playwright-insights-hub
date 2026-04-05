import { RunManifest, TestResult, TestRun, TestStatus, ApiPayload, Severity, TestStep } from "@/models/types";
import { classifyDefect, inferSeverity } from "@/services/defectClassifier";

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

const ERROR_TEMPLATES = [
  { category: "Assertion", msg: (suite: string, line: number) => `AssertionError: expected element to be visible\n    at tests/${suite}.spec.ts:${line}:5` },
  { category: "Assertion", msg: (suite: string, line: number) => `AssertionError: expected "0" to equal "3"\n    at tests/${suite}.spec.ts:${line}:12` },
  { category: "Timeout", msg: (suite: string, line: number) => `TimeoutError: locator.click: Timeout 30000ms exceeded\n    waiting for selector ".submit-btn"\n    at tests/${suite}.spec.ts:${line}:8` },
  { category: "Timeout", msg: (suite: string, line: number) => `TimeoutError: page.waitForNavigation: Timeout 30000ms exceeded\n    at tests/${suite}.spec.ts:${line}:3` },
  { category: "Network", msg: (suite: string, line: number) => `Error: net::ERR_CONNECTION_REFUSED at /api/v1/health\n    at tests/${suite}.spec.ts:${line}:10` },
  { category: "Network", msg: (suite: string, line: number) => `Error: Request failed with status 502 (Bad Gateway)\n    at tests/${suite}.spec.ts:${line}:7` },
  { category: "Element Not Found", msg: (suite: string, line: number) => `Error: locator.fill: Error: Element not found: #email-input\n    at tests/${suite}.spec.ts:${line}:5` },
  { category: "Element Not Found", msg: (suite: string, line: number) => `Error: page.click: No element matches selector: [data-testid="checkout-btn"]\n    at tests/${suite}.spec.ts:${line}:9` },
  { category: "State Mismatch", msg: (suite: string, line: number) => `AssertionError: expected URL "/dashboard" but got "/login"\n    at tests/${suite}.spec.ts:${line}:5` },
  { category: "State Mismatch", msg: (suite: string, line: number) => `AssertionError: expected element text "Success" but received "Error"\n    at tests/${suite}.spec.ts:${line}:11` },
  { category: "Script Error", msg: (suite: string, line: number) => `TypeError: Cannot read properties of null (reading 'textContent')\n    at tests/${suite}.spec.ts:${line}:14` },
  { category: "Script Error", msg: (suite: string, line: number) => `ReferenceError: userData is not defined\n    at tests/${suite}.spec.ts:${line}:3` },
];

function generateErrorMessage(suite: string, _name: string, rand: () => number): string {
  const template = ERROR_TEMPLATES[Math.floor(rand() * ERROR_TEMPLATES.length)];
  const line = Math.floor(rand() * 100 + 10);
  return template.msg(suite, line);
}

function generateFailureLogs(name: string, rand: () => number): string[] {
  const logs = [`[INFO] Starting ${name}`];
  if (rand() > 0.5) logs.push(`[WARN] Slow response detected (${Math.floor(rand() * 3000 + 1000)}ms)`);
  if (rand() > 0.3) logs.push(`[DEBUG] Current state: ${rand() > 0.5 ? "authenticated" : "unauthenticated"}`);
  logs.push(`[ERROR] ${rand() > 0.5 ? "Assertion failed at step 3" : "Element not interactive"}`);
  return logs;
}

// Generate realistic test steps
const STEP_TEMPLATES: Record<string, string[]> = {
  auth: ["Navigate to login page", "Fill email input", "Fill password input", "Click submit button", "Wait for navigation", "Verify dashboard URL"],
  checkout: ["Navigate to products page", "Select product", "Click add to cart", "Open cart sidebar", "Verify cart count", "Proceed to checkout"],
  dashboard: ["Navigate to dashboard", "Wait for data load", "Verify summary cards", "Check chart rendering", "Validate filter controls"],
  profile: ["Navigate to profile page", "Click edit button", "Modify field value", "Click save button", "Verify success toast"],
  settings: ["Navigate to settings", "Locate setting toggle", "Change value", "Verify update saved", "Refresh page", "Verify persistence"],
  api: ["Prepare request payload", "Send API request", "Validate status code", "Parse response body", "Assert response schema"],
  navigation: ["Click navigation element", "Wait for route change", "Verify page content", "Check breadcrumbs", "Verify active state"],
};

function generateSteps(suite: string, status: TestStatus, rand: () => number): TestStep[] {
  const templates = STEP_TEMPLATES[suite] || STEP_TEMPLATES.auth;
  const stepCount = Math.min(templates.length, 3 + Math.floor(rand() * 3));
  const failAtStep = status === "failed" ? Math.floor(rand() * stepCount) : -1;

  return templates.slice(0, stepCount).map((name, i) => {
    const stepStatus: TestStatus = i < failAtStep || (failAtStep === -1 && status !== "skipped")
      ? "passed"
      : i === failAtStep
      ? "failed"
      : status === "skipped" ? "skipped" : "passed";
    
    return {
      name,
      status: stepStatus,
      duration: Math.round(50 + rand() * 800),
      error: stepStatus === "failed" ? `Step "${name}" failed` : undefined,
    };
  });
}

function generateResults(runIndex: number): TestResult[] {
  const rand = seededRandom(runIndex * 1000 + 42);
  const results: TestResult[] = [];
  let id = 0;

  const availableSuites = SUITES.slice(0, Math.min(SUITES.length, 3 + Math.floor(runIndex * 0.7)));

  for (const suite of availableSuites) {
    const allTests = TEST_NAMES[suite];
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
      const error = status === "failed" ? generateErrorMessage(suite, name, rand) : undefined;
      const tags = TAGS_MAP[suite] || [];
      const finalStatus = retries > 0 && rand() > 0.6 ? "passed" : status;

      results.push({
        id: `test-${runIndex}-${id}`,
        name: `${suite} > ${name}`,
        suite,
        file: `tests/${suite}.spec.ts`,
        status: finalStatus,
        duration: Math.round(baseDuration),
        retries,
        tags,
        error: finalStatus === "failed" ? error : undefined,
        logs: status === "failed" ? generateFailureLogs(name, rand) : undefined,
        apiPayload,
        severity: inferSeverity(tags, finalStatus === "failed" ? error : undefined),
        defectCategory: finalStatus === "failed" ? classifyDefect(error) : undefined,
        steps: generateSteps(suite, finalStatus, rand),
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

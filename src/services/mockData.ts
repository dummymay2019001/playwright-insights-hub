import { RunManifest, TestResult, TestRun, TestStatus, ApiPayload, Severity, TestStep, BrowserName, Annotation } from "@/models/types";
import { classifyDefect, inferSeverity } from "@/services/defectClassifier";

const SUITES = [
  "auth", "checkout", "dashboard", "profile", "settings", "api",
  "navigation", "search", "file-upload", "notifications", "accessibility",
];

const TAGS_MAP: Record<string, string[]> = {
  auth: ["smoke", "critical", "e2e"],
  checkout: ["regression", "payment", "e2e"],
  dashboard: ["smoke", "ui"],
  profile: ["regression", "ui"],
  settings: ["regression", "ui"],
  api: ["smoke", "api", "integration"],
  navigation: ["smoke", "ui"],
  search: ["regression", "e2e"],
  "file-upload": ["regression", "slow"],
  notifications: ["smoke", "ui", "accessibility"],
  accessibility: ["accessibility", "a11y", "critical"],
};

const TEST_NAMES: Record<string, string[]> = {
  auth: [
    "login with valid credentials",
    "login with invalid password",
    "signup flow",
    "password reset",
    "session expiry",
    "OAuth Google login",
    "OAuth GitHub login",
    "MFA TOTP verification",
    "account lockout after failed attempts",
  ],
  checkout: [
    "add to cart",
    "remove from cart",
    "apply coupon",
    "payment success",
    "payment failure",
    "shipping calculation",
    "guest checkout flow",
    "Stripe card validation",
    "order confirmation email trigger",
  ],
  dashboard: [
    "renders summary cards",
    "chart data loads",
    "filter by date",
    "export CSV",
    "responsive layout",
    "real-time data refresh",
    "empty state rendering",
  ],
  profile: [
    "update name",
    "upload avatar",
    "change email",
    "delete account",
    "view activity log",
  ],
  settings: [
    "toggle notifications",
    "change language",
    "update timezone",
    "two-factor setup",
    "API key generation",
    "webhook configuration",
  ],
  api: [
    "GET /users",
    "POST /orders",
    "PUT /settings",
    "DELETE /session",
    "rate limiting",
    "PATCH /users/:id",
    "pagination cursor-based",
    "GraphQL query validation",
  ],
  navigation: [
    "sidebar toggle",
    "breadcrumb navigation",
    "deep link routing",
    "404 page",
    "keyboard navigation",
    "mobile hamburger menu",
  ],
  search: [
    "full-text search returns results",
    "search with filters",
    "search empty state",
    "search debounce behavior",
    "search highlights matching terms",
  ],
  "file-upload": [
    "upload single file",
    "upload multiple files",
    "upload exceeds size limit",
    "upload unsupported format",
    "drag-and-drop upload",
    "upload progress indicator",
  ],
  notifications: [
    "toast appears on action",
    "notification badge count",
    "mark all as read",
    "notification preferences persist",
    "push notification permission prompt",
  ],
  accessibility: [
    "focus trap in modal",
    "ARIA labels on interactive elements",
    "color contrast ratio compliance",
    "screen reader navigation order",
    "skip-to-content link",
    "keyboard-only form submission",
  ],
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
  "PATCH /users/:id": { method: "PATCH", url: "/api/v1/users/42", reqBody: { role: "admin" }, resBody: (ok) => ok ? { id: 42, role: "admin" } : { error: "Forbidden", code: 403 } },
  "pagination cursor-based": { method: "GET", url: "/api/v1/items?cursor=abc123&limit=20", resBody: (ok) => ok ? { items: [], nextCursor: "def456", hasMore: true } : { error: "Invalid cursor", code: 400 } },
  "GraphQL query validation": { method: "POST", url: "/graphql", reqBody: { query: "{ user(id: 1) { name email } }" }, resBody: (ok) => ok ? { data: { user: { name: "Alice", email: "alice@example.com" } } } : { errors: [{ message: "Field 'email' not found on type 'User'" }] } },
};

function generateApiPayload(testName: string, status: TestStatus, rand: () => number): ApiPayload {
  const endpoint = API_ENDPOINTS[testName];
  if (!endpoint) return { method: "GET", url: "/api/unknown", statusCode: 200, latency: Math.round(rand() * 500) };
  const ok = status === "passed";
  return {
    method: endpoint.method,
    url: endpoint.url,
    statusCode: ok ? (endpoint.method === "POST" ? 201 : 200) : [400, 401, 403, 404, 422, 429, 500, 502, 503][Math.floor(rand() * 9)],
    requestHeaders: { "Content-Type": "application/json", "Authorization": "Bearer eyJhbG...truncated", "X-Request-Id": `req-${Math.floor(rand() * 99999)}` },
    requestBody: endpoint.reqBody,
    responseHeaders: { "Content-Type": "application/json", "X-Request-Id": `req-${Math.floor(rand() * 99999)}`, "X-RateLimit-Remaining": `${Math.floor(rand() * 100)}` },
    responseBody: endpoint.resBody(ok),
    latency: Math.round(50 + rand() * 450),
  };
}

const ERROR_TEMPLATES = [
  // Assertion errors
  { category: "Assertion", msg: (suite: string, line: number) => `AssertionError: expected element to be visible\n    at tests/${suite}.spec.ts:${line}:5` },
  { category: "Assertion", msg: (suite: string, line: number) => `AssertionError: expected "0" to equal "3"\n    at tests/${suite}.spec.ts:${line}:12` },
  { category: "Assertion", msg: (suite: string, line: number) => `AssertionError: expected array length 5, received 0\n    at tests/${suite}.spec.ts:${line}:8` },
  // Timeout errors
  { category: "Timeout", msg: (suite: string, line: number) => `TimeoutError: locator.click: Timeout 30000ms exceeded\n    waiting for selector ".submit-btn"\n    at tests/${suite}.spec.ts:${line}:8` },
  { category: "Timeout", msg: (suite: string, line: number) => `TimeoutError: page.waitForNavigation: Timeout 30000ms exceeded\n    at tests/${suite}.spec.ts:${line}:3` },
  { category: "Timeout", msg: (suite: string, line: number) => `TimeoutError: page.waitForResponse: Timeout 15000ms exceeded waiting for /api/v1/data\n    at tests/${suite}.spec.ts:${line}:5` },
  // Network errors
  { category: "Network", msg: (suite: string, line: number) => `Error: net::ERR_CONNECTION_REFUSED at /api/v1/health\n    at tests/${suite}.spec.ts:${line}:10` },
  { category: "Network", msg: (suite: string, line: number) => `Error: Request failed with status 502 (Bad Gateway)\n    at tests/${suite}.spec.ts:${line}:7` },
  { category: "Network", msg: (_suite: string, _line: number) => `Error: Access to fetch at 'https://api.external.com/data' from origin 'http://localhost:3000' has been blocked by CORS policy` },
  { category: "Network", msg: (suite: string, line: number) => `Error: net::ERR_NAME_NOT_RESOLVED for https://staging-api.example.com\n    at tests/${suite}.spec.ts:${line}:4` },
  // Element errors
  { category: "Element Not Found", msg: (suite: string, line: number) => `Error: locator.fill: Error: Element not found: #email-input\n    at tests/${suite}.spec.ts:${line}:5` },
  { category: "Element Not Found", msg: (suite: string, line: number) => `Error: page.click: No element matches selector: [data-testid="checkout-btn"]\n    at tests/${suite}.spec.ts:${line}:9` },
  // Strict mode violation (very common in real Playwright)
  { category: "Strict Mode", msg: (suite: string, line: number) => `Error: locator.click: Error: strict mode violation: locator("button.submit") resolved to 3 elements\n    at tests/${suite}.spec.ts:${line}:5` },
  { category: "Strict Mode", msg: (suite: string, line: number) => `Error: locator.fill: Error: strict mode violation: getByRole("textbox") resolved to 4 elements\n    at tests/${suite}.spec.ts:${line}:8` },
  // State mismatch
  { category: "State Mismatch", msg: (suite: string, line: number) => `AssertionError: expected URL "/dashboard" but got "/login"\n    at tests/${suite}.spec.ts:${line}:5` },
  { category: "State Mismatch", msg: (suite: string, line: number) => `AssertionError: expected element text "Success" but received "Error"\n    at tests/${suite}.spec.ts:${line}:11` },
  // Script / runtime errors
  { category: "Script Error", msg: (suite: string, line: number) => `TypeError: Cannot read properties of null (reading 'textContent')\n    at tests/${suite}.spec.ts:${line}:14` },
  { category: "Script Error", msg: (suite: string, line: number) => `ReferenceError: userData is not defined\n    at tests/${suite}.spec.ts:${line}:3` },
  // Frame / context errors
  { category: "Frame Error", msg: (_suite: string, _line: number) => `Error: Frame was detached\n    Target page, context or browser has been closed` },
  { category: "Frame Error", msg: (_suite: string, _line: number) => `Error: Protocol error (Target.activateTarget): Target closed.\n    Browser context was destroyed` },
  // Navigation errors
  { category: "Navigation", msg: (suite: string, line: number) => `Error: page.goto: Navigation failed because page was closed\n    at tests/${suite}.spec.ts:${line}:3` },
  { category: "Navigation", msg: (suite: string, line: number) => `Error: page.goto: net::ERR_ABORTED; maybe frame was detached?\n    at tests/${suite}.spec.ts:${line}:5` },
];

function generateErrorMessage(suite: string, _name: string, rand: () => number): string {
  const template = ERROR_TEMPLATES[Math.floor(rand() * ERROR_TEMPLATES.length)];
  const line = Math.floor(rand() * 100 + 10);
  return template.msg(suite, line);
}

function generateFailureLogs(name: string, rand: () => number): string[] {
  const logs = [`[INFO] Starting ${name}`];
  if (rand() > 0.4) logs.push(`[WARN] Slow response detected (${Math.floor(rand() * 3000 + 1000)}ms)`);
  if (rand() > 0.3) logs.push(`[DEBUG] Current state: ${rand() > 0.5 ? "authenticated" : "unauthenticated"}`);
  if (rand() > 0.6) logs.push(`[DEBUG] Browser: ${["chromium", "firefox", "webkit"][Math.floor(rand() * 3)]}, viewport: 1280x720`);
  if (rand() > 0.7) logs.push(`[WARN] Retrying request to /api/v1/data (attempt ${Math.floor(rand() * 3) + 2})`);
  logs.push(`[ERROR] ${rand() > 0.5 ? "Assertion failed at step 3" : "Element not interactive"}`);
  if (rand() > 0.5) logs.push(`[INFO] Screenshot saved: test-results/${name.replace(/\s/g, "-")}-failure.png`);
  return logs;
}

const STEP_TEMPLATES: Record<string, string[]> = {
  auth: ["Navigate to login page", "Fill email input", "Fill password input", "Click submit button", "Wait for navigation", "Verify dashboard URL", "Check user avatar loaded"],
  checkout: ["Navigate to products page", "Select product", "Click add to cart", "Open cart sidebar", "Verify cart count", "Proceed to checkout", "Fill payment details", "Confirm order"],
  dashboard: ["Navigate to dashboard", "Wait for data load", "Verify summary cards", "Check chart rendering", "Validate filter controls", "Export data"],
  profile: ["Navigate to profile page", "Click edit button", "Modify field value", "Click save button", "Verify success toast", "Reload and verify"],
  settings: ["Navigate to settings", "Locate setting toggle", "Change value", "Verify update saved", "Refresh page", "Verify persistence"],
  api: ["Prepare request payload", "Send API request", "Validate status code", "Parse response body", "Assert response schema"],
  navigation: ["Click navigation element", "Wait for route change", "Verify page content", "Check breadcrumbs", "Verify active state"],
  search: ["Navigate to search page", "Enter search query", "Wait for results", "Verify result count", "Click first result", "Verify detail page"],
  "file-upload": ["Navigate to upload page", "Select file from dialog", "Verify preview rendered", "Click upload button", "Wait for progress bar", "Verify upload complete"],
  notifications: ["Trigger notification action", "Wait for toast animation", "Verify toast message", "Check notification badge", "Dismiss notification"],
  accessibility: ["Tab to target element", "Verify focus indicator visible", "Check ARIA attributes", "Activate with keyboard", "Verify screen reader output"],
};

function generateSteps(suite: string, status: TestStatus, rand: () => number): TestStep[] {
  const templates = STEP_TEMPLATES[suite] || STEP_TEMPLATES.auth;
  const stepCount = Math.min(templates.length, 3 + Math.floor(rand() * 4));
  const failAtStep = status === "failed" ? Math.max(1, Math.floor(rand() * stepCount)) : -1;

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

function generateAnnotations(rand: () => number): Annotation[] | undefined {
  const r = rand();
  if (r > 0.88) return [{ type: "slow", description: "This test involves file uploads and is inherently slow" }];
  if (r > 0.82) return [{ type: "fixme", description: "Flaky on CI due to race condition — needs investigation" }];
  if (r > 0.78) return [{ type: "info", description: "Depends on external payment sandbox being available" }];
  return undefined;
}

const BROWSERS: BrowserName[] = ["chromium", "firefox", "webkit"];

function generateResults(runIndex: number): TestResult[] {
  const rand = seededRandom(runIndex * 1000 + 42);
  const results: TestResult[] = [];
  let id = 0;

  const availableSuites = SUITES.slice(0, Math.min(SUITES.length, 4 + Math.floor(runIndex * 0.8)));
  const runBrowser = BROWSERS[runIndex % BROWSERS.length];

  for (const suite of availableSuites) {
    const allTests = TEST_NAMES[suite];
    const testCount = Math.min(allTests.length, Math.max(2, Math.floor(allTests.length * (0.5 + runIndex * 0.07))));
    const availableTests = allTests.slice(0, testCount);

    for (const name of availableTests) {
      id++;
      const r = rand();
      let status: TestStatus = "passed";
      if (r < 0.08 + runIndex * 0.005) status = "failed";
      else if (r < 0.12 + runIndex * 0.003) status = "skipped";

      const retries = status === "failed" && rand() > 0.45 ? Math.floor(rand() * 3) + 1 : 0;
      const baseDuration = 200 + rand() * 4000;
      const apiPayload: ApiPayload | undefined = suite === "api" ? generateApiPayload(name, status, rand) : undefined;
      const error = status === "failed" ? generateErrorMessage(suite, name, rand) : undefined;
      const tags = [...(TAGS_MAP[suite] || [])];
      // Add contextual tags
      if (rand() > 0.85) tags.push("flaky");
      if (rand() > 0.9) tags.push("mobile");
      if (baseDuration > 3500) tags.push("slow");

      const finalStatus = retries > 0 && rand() > 0.55 ? "passed" : status;
      const annotations = generateAnnotations(rand);

      // Use nested describe format: "suite > subsection > test name"
      const hasNestedDescribe = rand() > 0.6;
      const describeSections: Record<string, string[]> = {
        auth: ["login", "signup", "session"],
        checkout: ["cart", "payment", "shipping"],
        api: ["REST", "GraphQL", "rate-limit"],
        accessibility: ["keyboard", "screen-reader", "visual"],
      };
      const subsection = describeSections[suite]
        ? describeSections[suite][Math.floor(rand() * describeSections[suite].length)]
        : undefined;
      const fullName = hasNestedDescribe && subsection
        ? `${suite} > ${subsection} > ${name}`
        : `${suite} > ${name}`;

      results.push({
        id: `test-${runIndex}-${id}`,
        name: fullName,
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
        annotations,
        browser: runBrowser,
      });
    }
  }
  return results;
}

function generateManifest(runIndex: number, results: TestResult[]): RunManifest {
  const date = new Date(2026, 3, 1 + runIndex, 10, Math.floor(runIndex * 7) % 60, 0);
  const ts = date.toISOString();
  const runId = `run-${ts.replace(/[:.]/g, "-").slice(0, 19)}`;
  const branches = ["main", "main", "main", "feat/checkout-v2", "fix/auth-race-condition", "main", "feat/search", "main", "fix/upload-timeout", "main", "main"];
  const envs = ["staging", "staging", "production", "staging", "dev", "production", "staging", "qa", "staging", "production", "staging"];
  const browsers: BrowserName[] = ["chromium", "chromium", "firefox", "chromium", "chromium", "webkit", "chromium", "chromium", "firefox", "chromium", "chromium"];

  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const totalDuration = Math.round(results.reduce((s, r) => s + r.duration, 0) / 1000);

  // Generate realistic commit SHAs
  const rand = seededRandom(runIndex * 777);
  const sha = Array.from({ length: 7 }, () => "0123456789abcdef"[Math.floor(rand() * 16)]).join("");

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
    browser: browsers[runIndex % browsers.length],
    commitSha: sha,
    ciPipelineId: `CI-${1000 + runIndex}`,
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

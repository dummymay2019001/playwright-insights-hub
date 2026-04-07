import { TestRun, TestResult, TestStatus, RunManifest, ApiPayload, TestStep } from "@/models/types";
import { classifyDefect, inferSeverity } from "@/services/defectClassifier";

interface PWAttachment {
  name: string;
  contentType: string;
  body?: string | Record<string, unknown>; // may be string, base64, or already-parsed object
}

function normalizeBody(body?: string | Record<string, unknown>): unknown {
  if (!body) return undefined;
  // Already an object (parsed JSON)
  if (typeof body === "object") return body;
  // String: try JSON parse directly
  const trimmed = body.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try { return JSON.parse(trimmed); } catch { /* fall through */ }
  }
  // Try base64 decode
  try {
    const decoded = atob(body);
    if (decoded.trim().startsWith("{") || decoded.trim().startsWith("[")) {
      try { return JSON.parse(decoded); } catch { /* fall through */ }
    }
    if (/^[\x20-\x7E\s]+$/.test(decoded.slice(0, 100))) return decoded;
  } catch { /* not base64 */ }
  return body;
}

interface PWError {
  message?: string;
  stack?: string;
}

interface PWResult {
  status: string;
  duration: number;
  error?: PWError;
  attachments?: PWAttachment[];
  stdout?: unknown[];
  stderr?: unknown[];
  steps?: PWStepResult[];
}

interface PWStepResult {
  title: string;
  duration: number;
  error?: PWError;
  steps?: PWStepResult[];
}

interface PWTest {
  timeout?: number;
  annotations?: Array<{ type: string; description?: string }>;
  expectedStatus?: string;
  results: PWResult[];
}

interface PWSpec {
  title: string;
  ok: boolean;
  tests: PWTest[];
}

interface PWSuite {
  title: string;
  file?: string;
  suites?: PWSuite[];
  specs?: PWSpec[];
}

interface PWStats {
  startTime?: string;
  duration?: number;
  expected?: number;
  skipped?: number;
  unexpected?: number;
  flaky?: number;
}

interface PWConfig {
  projects?: Array<{ name?: string; testDir?: string }>;
}

interface PlaywrightNativeReport {
  config?: PWConfig;
  suites: PWSuite[];
  stats?: PWStats;
}

export function isPlaywrightNativeReport(obj: unknown): obj is PlaywrightNativeReport {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return Array.isArray(o.suites) && (o.stats !== undefined || o.config !== undefined);
}

function convertSteps(pwSteps?: PWStepResult[]): TestStep[] | undefined {
  if (!pwSteps || pwSteps.length === 0) return undefined;
  return pwSteps.map(s => ({
    name: s.title,
    status: s.error ? "failed" as TestStatus : "passed" as TestStatus,
    duration: s.duration,
    error: s.error ? [s.error.message, s.error.stack].filter(Boolean).join("\n") : undefined,
    steps: convertSteps(s.steps),
  }));
}

export function parsePlaywrightNativeReport(report: PlaywrightNativeReport, fileName: string): TestRun {
  const results: TestResult[] = [];
  let testCounter = 0;

  function extractTags(annotations?: Array<{ type: string; description?: string }>): string[] {
    if (!annotations) return [];
    const tags: string[] = [];
    for (const a of annotations) {
      if (a.type === "tag" && a.description) {
        tags.push(a.description.replace(/^@/, ""));
      }
      if (a.type === "severity" && a.description) {
        tags.push(a.description.replace(/^@/, ""));
      }
    }
    return tags;
  }

  function extractApiPayload(annotations?: Array<{ type: string; description?: string }>, attachments?: PWAttachment[]): ApiPayload | undefined {
    const method = annotations?.find(a => a.type === "method")?.description;
    const url = annotations?.find(a => a.type === "endpoint")?.description;

    let requestBody: unknown;
    let responseBody: unknown;

    if (attachments) {
      // Handle combined api-payload attachment
      const apiPayloadAttach = attachments.find(a => a.name === "api-payload");
      if (apiPayloadAttach?.body) {
        const parsed = normalizeBody(apiPayloadAttach.body);
        if (parsed && typeof parsed === "object") {
          const p = parsed as Record<string, unknown>;
          return {
            method: method || p.method as string,
            url: url || (p.url || p.endpoint) as string,
            statusCode: (p.statusCode || p.status) as number,
            requestHeaders: (p.requestHeaders || p.headers) as unknown,
            requestBody: (p.requestBody || p.request || p.body) as unknown,
            responseHeaders: p.responseHeaders as unknown,
            responseBody: (p.responseBody || p.response) as unknown,
            latency: (p.latency || p.duration) as number,
          };
        }
      }

      const reqAttach = attachments.find(a => a.name === "request" || a.name === "api-request");
      const resAttach = attachments.find(a => a.name === "response" || a.name === "api-response");
      if (reqAttach?.body) {
        requestBody = normalizeBody(reqAttach.body);
      }
      if (resAttach?.body) {
        responseBody = normalizeBody(resAttach.body);
      }
    }

    if (!method && !url && !requestBody && !responseBody) return undefined;
    return { method, url, requestBody, responseBody };
  }

  function processSuite(suite: PWSuite, parentSuiteName: string) {
    const suiteName = parentSuiteName ? `${parentSuiteName} > ${suite.title}` : suite.title;
    const file = suite.file || "unknown";
    // Extract actual file name from nested path for suite grouping
    const fileBasedSuite = file !== "unknown" ? file.split("/").pop()?.replace(/\.(test|spec)\.(ts|js|tsx|jsx)$/i, "") || file : "";

    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          testCounter++;
          const lastResult = test.results[test.results.length - 1];
          if (!lastResult) continue;

          const retries = Math.max(0, test.results.length - 1);
          const status: TestStatus = lastResult.status === "passed" ? "passed"
            : lastResult.status === "skipped" || lastResult.status === "interrupted" ? "skipped"
            : "failed";

          const tags = extractTags(test.annotations);
          const service = test.annotations?.find(a => a.type === "service")?.description;
          if (service && !tags.includes(service)) tags.push(service);

          const hasApiAnnotations = test.annotations?.some(a => a.type === "method" || a.type === "endpoint");
          if (hasApiAnnotations && !tags.includes("api")) tags.push("api");

          const apiPayload = extractApiPayload(test.annotations, lastResult.attachments);

          const error = lastResult.error
            ? [lastResult.error.message, lastResult.error.stack].filter(Boolean).join("\n")
            : undefined;

          const logs: string[] = [];
          if (lastResult.stdout) {
            for (const entry of lastResult.stdout) {
              if (typeof entry === "object" && entry !== null && "text" in (entry as Record<string, unknown>)) {
                const raw = (entry as Record<string, unknown>).text as string;
                // Strip ANSI codes and trailing newlines
                const clean = raw.replace(/\u001b\[[0-9;]*m/g, "").replace(/\n$/, "");
                if (clean.trim()) logs.push(clean);
              } else if (typeof entry === "string") {
                logs.push(entry);
              } else {
                logs.push(JSON.stringify(entry));
              }
            }
          }
          if (lastResult.stderr) {
            for (const entry of lastResult.stderr) {
              if (typeof entry === "object" && entry !== null && "text" in (entry as Record<string, unknown>)) {
                const raw = (entry as Record<string, unknown>).text as string;
                const clean = raw.replace(/\u001b\[[0-9;]*m/g, "").replace(/\n$/, "");
                if (clean.trim()) logs.push(`[ERROR] ${clean}`);
              } else if (typeof entry === "string") {
                logs.push(`[ERROR] ${entry}`);
              } else {
                logs.push(`[ERROR] ${JSON.stringify(entry)}`);
              }
            }
          }

          const steps = convertSteps(lastResult.steps);

          results.push({
            id: `pw-${testCounter}-${Date.now()}`,
            name: `${suiteName} > ${spec.title}`,
            suite: suiteName.split(" > ").find(s => s && s !== fileBasedSuite) || suiteName.split(" > ")[0] || fileBasedSuite,
            file,
            status,
            duration: lastResult.duration,
            retries,
            tags,
            error,
            logs: logs.length > 0 ? logs : undefined,
            apiPayload,
            severity: inferSeverity(tags, status === "failed" ? error : undefined),
            defectCategory: status === "failed" ? classifyDefect(error) : undefined,
            steps,
          });
        }
      }
    }

    if (suite.suites) {
      for (const child of suite.suites) {
        processSuite(child, suiteName);
      }
    }
  }

  for (const suite of report.suites) {
    processSuite(suite, "");
  }

  const passed = results.filter(r => r.status === "passed").length;
  const failed = results.filter(r => r.status === "failed").length;
  const skipped = results.filter(r => r.status === "skipped").length;

  const manifest: RunManifest = {
    runId: `pw-run-${fileName.replace(/\.json$/i, "")}-${Date.now()}`,
    timestamp: report.stats?.startTime || new Date().toISOString(),
    branch: "unknown",
    environment: report.config?.projects?.[0]?.name || "unknown",
    total: results.length,
    passed,
    failed,
    skipped,
    duration: report.stats?.duration ? Math.round(report.stats.duration / 1000) : Math.round(results.reduce((s, r) => s + r.duration, 0) / 1000),
  };

  return { manifest, results };
}

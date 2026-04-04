export type TestStatus = "passed" | "failed" | "skipped";

export interface RunManifest {
  runId: string;
  timestamp: string;
  branch: string;
  environment: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number; // seconds
}

export interface ApiPayload {
  method?: string;
  url?: string;
  statusCode?: number;
  requestHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseHeaders?: Record<string, string>;
  responseBody?: unknown;
  latency?: number;
}

export interface TestResult {
  id: string;
  name: string;
  suite: string;
  file: string;
  status: TestStatus;
  duration: number; // ms
  retries: number;
  tags: string[];
  error?: string;
  logs?: string[];
  apiPayload?: ApiPayload;
}

export interface TestRun {
  manifest: RunManifest;
  results: TestResult[];
}

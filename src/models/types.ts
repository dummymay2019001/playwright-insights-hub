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
}

export interface TestRun {
  manifest: RunManifest;
  results: TestResult[];
}

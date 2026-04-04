import { TestRun, RunManifest, TestResult, TestStatus } from "@/models/types";
import { isPlaywrightNativeReport, parsePlaywrightNativeReport } from "@/services/playwrightNativeParser";

export interface IngestionError {
  file: string;
  message: string;
}

export interface IngestionResult {
  runs: TestRun[];
  errors: IngestionError[];
}

// Validate a single TestResult shape
function isValidResult(r: unknown): r is TestResult {
  if (!r || typeof r !== "object") return false;
  const obj = r as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.suite === "string" &&
    typeof obj.file === "string" &&
    ["passed", "failed", "skipped"].includes(obj.status as string) &&
    typeof obj.duration === "number" &&
    typeof obj.retries === "number" &&
    Array.isArray(obj.tags)
  );
}

// Validate a manifest shape
function isValidManifest(m: unknown): m is RunManifest {
  if (!m || typeof m !== "object") return false;
  const obj = m as Record<string, unknown>;
  return (
    typeof obj.runId === "string" &&
    typeof obj.timestamp === "string" &&
    typeof obj.total === "number" &&
    typeof obj.passed === "number" &&
    typeof obj.failed === "number" &&
    typeof obj.skipped === "number" &&
    typeof obj.duration === "number"
  );
}

// Validate a full TestRun shape
function isValidRun(r: unknown): r is TestRun {
  if (!r || typeof r !== "object") return false;
  const obj = r as Record<string, unknown>;
  return isValidManifest(obj.manifest) && Array.isArray(obj.results) && obj.results.every(isValidResult);
}

// Auto-generate a manifest from a results array
function generateManifestFromResults(results: TestResult[], fileName: string): RunManifest {
  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const duration = Math.round(results.reduce((s, r) => s + r.duration, 0) / 1000);
  const now = new Date().toISOString();
  return {
    runId: `run-${fileName.replace(/\.json$/i, "")}-${Date.now()}`,
    timestamp: now,
    branch: "unknown",
    environment: "unknown",
    total: results.length,
    passed,
    failed,
    skipped,
    duration,
  };
}

// Parse a single JSON file and extract runs
function parseJsonContent(content: string, fileName: string): { runs: TestRun[]; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { runs: [], error: `Invalid JSON in ${fileName}` };
  }

  // Case 0: Playwright native JSON reporter output { config, suites, stats }
  if (isPlaywrightNativeReport(parsed)) {
    try {
      const run = parsePlaywrightNativeReport(parsed, fileName);
      return { runs: run.results.length > 0 ? [run] : [], error: run.results.length === 0 ? `No test results found in Playwright report ${fileName}` : undefined };
    } catch (e) {
      return { runs: [], error: `Failed to parse Playwright native report: ${(e as Error).message}` };
    }
  }

  // Case 1: Single TestRun { manifest, results }
  if (isValidRun(parsed)) {
    return { runs: [parsed as TestRun] };
  }

  // Case 2: Array of TestRuns [{ manifest, results }, ...]
  if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isValidRun)) {
    return { runs: parsed as TestRun[] };
  }

  // Case 3: Flat array of TestResults (auto-generate manifest)
  if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isValidResult)) {
    const results = parsed as TestResult[];
    const manifest = generateManifestFromResults(results, fileName);
    return { runs: [{ manifest, results }] };
  }

  // Case 4: Manifest-only file (used for folder-based ingestion)
  if (isValidManifest(parsed)) {
    return { runs: [], error: `__manifest__:${JSON.stringify(parsed)}` };
  }

  // Case 5: Suite-level results file (array of results for one suite)
  if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isValidResult)) {
    return { runs: [], error: `__suite_results__:${JSON.stringify(parsed)}` };
  }

  return { runs: [], error: `Unrecognized format in ${fileName}. Expected { manifest, results } or an array of test results.` };
}

// Group files by folder for folder-based ingestion
interface FileEntry {
  name: string;
  path: string;
  content: string;
}

function groupByFolder(files: FileEntry[]): Map<string, FileEntry[]> {
  const groups = new Map<string, FileEntry[]>();
  for (const f of files) {
    const parts = f.path.split("/");
    const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : "__root__";
    const existing = groups.get(folder) || [];
    existing.push(f);
    groups.set(folder, existing);
  }
  return groups;
}

// Try to assemble a run from folder files (manifest.json + suite files)
function assembleFolderRun(files: FileEntry[], folderName: string): { run?: TestRun; errors: IngestionError[] } {
  const errors: IngestionError[] = [];
  let manifest: RunManifest | undefined;
  const allResults: TestResult[] = [];

  for (const f of files) {
    const baseName = f.name.toLowerCase();
    let parsed: unknown;
    try {
      parsed = JSON.parse(f.content);
    } catch {
      errors.push({ file: f.path, message: "Invalid JSON" });
      continue;
    }

    if (baseName === "manifest.json" && isValidManifest(parsed)) {
      manifest = parsed;
    } else if (Array.isArray(parsed) && parsed.every(isValidResult)) {
      allResults.push(...(parsed as TestResult[]));
    } else if (isValidRun(parsed)) {
      // Full run file inside folder - just use it
      return { run: parsed as TestRun, errors };
    } else if (isValidResult(parsed)) {
      allResults.push(parsed as TestResult);
    } else {
      errors.push({ file: f.path, message: "Unrecognized file format" });
    }
  }

  if (allResults.length === 0) {
    return { errors };
  }

  if (!manifest) {
    manifest = generateManifestFromResults(allResults, folderName);
  }

  return { run: { manifest, results: allResults }, errors };
}

// Main ingestion function — processes uploaded files
export async function ingestFiles(fileList: FileList | File[]): Promise<IngestionResult> {
  const files = Array.from(fileList);
  const runs: TestRun[] = [];
  const errors: IngestionError[] = [];

  // Read all files
  const entries: FileEntry[] = [];
  for (const file of files) {
    if (!file.name.endsWith(".json")) {
      errors.push({ file: file.name, message: "Only .json files are supported" });
      continue;
    }
    try {
      const content = await file.text();
      const path = (file as any).webkitRelativePath || file.name;
      entries.push({ name: file.name, path, content });
    } catch {
      errors.push({ file: file.name, message: "Failed to read file" });
    }
  }

  // Group by folder
  const groups = groupByFolder(entries);

  for (const [folder, folderFiles] of groups) {
    if (folder === "__root__") {
      // Root-level files: parse individually
      for (const f of folderFiles) {
        const result = parseJsonContent(f.content, f.name);
        runs.push(...result.runs);
        if (result.error && !result.error.startsWith("__")) {
          errors.push({ file: f.path, message: result.error });
        }
      }
    } else {
      // Folder: try to assemble a run from manifest + suite files
      const result = assembleFolderRun(folderFiles, folder);
      if (result.run) runs.push(result.run);
      errors.push(...result.errors);
    }
  }

  // Deduplicate by runId
  const seen = new Set<string>();
  const deduped: TestRun[] = [];
  for (const run of runs) {
    if (!seen.has(run.manifest.runId)) {
      seen.add(run.manifest.runId);
      deduped.push(run);
    }
  }

  return { runs: deduped, errors };
}

// LocalStorage persistence
const STORAGE_KEY = "playwright-hub-imported-runs";

export function saveRunsToStorage(runs: TestRun[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  } catch {
    console.warn("Failed to save runs to localStorage — data may be too large");
  }
}

export function loadRunsFromStorage(): TestRun[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(isValidRun)) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function clearStoredRuns() {
  localStorage.removeItem(STORAGE_KEY);
}

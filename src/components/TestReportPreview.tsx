import { TestExportOptions } from "@/models/testExportTypes";
import { RunManifest, TestResult } from "@/models/types";
import { formatDate } from "@/utils/format";

type HistoryEntry = { run: RunManifest; test: TestResult };

interface Props {
  testName: string;
  history: HistoryEntry[];
  options: TestExportOptions;
}

function categorizeError(error?: string): string {
  if (!error) return "Unknown";
  const e = error.toLowerCase();
  if (e.includes("timeout")) return "Timeout";
  if (e.includes("net::err") || e.includes("502") || e.includes("503") || e.includes("connection")) return "Network";
  if (e.includes("not found") || e.includes("no element matches")) return "Element Not Found";
  if (e.includes("expected") && (e.includes("url") || e.includes("text") || e.includes("got"))) return "State Mismatch";
  if (e.includes("typeerror") || e.includes("referenceerror") || e.includes("cannot read")) return "Script Error";
  if (e.includes("assert")) return "Assertion";
  return "Other";
}

function statusClass(status: string, cm: string) {
  if (cm === "grayscale") return "text-foreground";
  if (status === "passed") return "text-success";
  if (status === "failed") return "text-destructive";
  return "text-muted-foreground";
}

export function TestReportPreview({ testName, history, options }: Props) {
  const cm = options.colorMode;
  const total = history.length;
  const passed = history.filter(h => h.test.status === "passed").length;
  const failed = history.filter(h => h.test.status === "failed").length;
  const skipped = history.filter(h => h.test.status === "skipped").length;
  const flaky = history.filter(h => h.test.retries > 0).length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const avgDuration = total > 0 ? Math.round(history.reduce((s, h) => s + h.test.duration, 0) / total) : 0;
  const totalRetries = history.reduce((s, h) => s + h.test.retries, 0);
  const latestResult = history[history.length - 1];

  const allTags = new Set<string>();
  const allSuites = new Set<string>();
  const allEnvs = new Set<string>();
  const allBranches = new Set<string>();
  for (const h of history) {
    h.test.tags.forEach(t => allTags.add(t));
    allSuites.add(h.test.suite);
    allEnvs.add(h.run.environment);
    allBranches.add(h.run.branch);
  }

  const rateClass = cm === "grayscale" ? "text-foreground" : passRate >= 95 ? "text-success" : passRate >= 80 ? "text-warning" : "text-destructive";

  const failures = history.filter(h => h.test.status === "failed");
  const causeMap = new Map<string, { count: number; errors: string[] }>();
  for (const f of failures) {
    const cat = categorizeError(f.test.error);
    const e = causeMap.get(cat) || { count: 0, errors: [] };
    e.count++;
    if (f.test.error && e.errors.length < 2) {
      const line = f.test.error.split("\n")[0];
      if (!e.errors.includes(line)) e.errors.push(line);
    }
    causeMap.set(cat, e);
  }
  const causes = [...causeMap.entries()].sort((a, b) => b[1].count - a[1].count);

  return (
    <div className={`bg-white text-gray-900 rounded-lg shadow-lg max-w-[210mm] mx-auto ${cm === "grayscale" ? "grayscale" : ""}`}>
      <div className="p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3 border-b-2 border-primary pb-4">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-white font-mono font-bold text-sm">{options.logoText}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900">{options.reportTitle}</h1>
            {options.subtitle && <p className="text-xs text-gray-500">{options.subtitle}</p>}
            {(options.organizationName || options.projectName) && (
              <p className="text-xs text-gray-400 mt-0.5">{[options.organizationName, options.projectName].filter(Boolean).join(" · ")}</p>
            )}
          </div>
        </div>

        {/* Test Name */}
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Test Case</p>
          <p className="font-mono text-sm font-semibold text-gray-900 break-words">{testName}</p>
        </div>

        {options.headerNote && <p className="text-xs text-gray-500 italic">{options.headerNote}</p>}
        {options.executiveSummary && (
          <div>
            <SectionHeader title="Executive Summary" />
            <p className="text-xs text-gray-700 leading-relaxed">{options.executiveSummary}</p>
          </div>
        )}

        {/* Health Summary */}
        {options.includeHealthSummary && (
          <div>
            <SectionHeader title="Health Summary" />
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Pass Rate" value={`${passRate}%`} className={rateClass} />
              <StatBox label="Passed" value={String(passed)} className="text-success" />
              <StatBox label="Failed" value={String(failed)} className="text-destructive" />
              <StatBox label="Avg Duration" value={`${avgDuration}ms`} className="text-gray-900" />
              <StatBox label="Flaky Runs" value={String(flaky)} className={flaky > 0 ? "text-warning" : "text-gray-900"} />
              <StatBox label="Total Retries" value={String(totalRetries)} className={totalRetries > 0 ? "text-warning" : "text-gray-900"} />
            </div>
          </div>
        )}

        {/* Tags & Metadata */}
        {options.includeTagsAndMetadata && (
          <div>
            <SectionHeader title="Test Identity & Traits" />
            <div className="space-y-1 text-xs">
              <MetaRow label="Suite" value={latestResult?.test.suite || "N/A"} />
              <MetaRow label="File" value={latestResult?.test.file || "N/A"} />
              <MetaRow label="Tags" value={allTags.size > 0 ? [...allTags].join(", ") : "None"} />
              <MetaRow label="Environments" value={[...allEnvs].join(", ")} />
              <MetaRow label="Branches" value={[...allBranches].join(", ")} />
              <MetaRow label="Severity" value={latestResult?.test.severity || "Not set"} />
            </div>
          </div>
        )}

        {/* Status Timeline */}
        {options.includeStatusTimeline && (
          <div>
            <SectionHeader title="Status Timeline" />
            <div className="flex items-center gap-0.5 flex-wrap">
              {history.map((h, i) => {
                const bg = h.test.status === "passed" ? "bg-success" : h.test.status === "failed" ? "bg-destructive" : "bg-muted";
                return <div key={i} className={`w-4 h-4 rounded-sm ${bg}`} title={`${formatDate(h.run.timestamp)} - ${h.test.status}`} />;
              })}
            </div>
            <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
              <span>■ Pass</span><span className="text-destructive">■ Fail</span><span>■ Skip</span>
            </div>
          </div>
        )}

        {/* Failure Cause Analysis */}
        {options.includeFailureCauseAnalysis && failed > 0 && causes.length > 0 && (
          <div>
            <SectionHeader title="Failure Cause Analysis" />
            <table className="w-full text-xs border">
              <thead><tr className="bg-destructive/10"><th className="text-left p-1.5 font-medium">Category</th><th className="p-1.5 font-medium text-center">Count</th><th className="p-1.5 font-medium text-center">Share</th></tr></thead>
              <tbody>
                {causes.map(([cat, data]) => (
                  <tr key={cat} className="border-t">
                    <td className="p-1.5 font-mono">{cat}</td>
                    <td className="p-1.5 text-center">{data.count}</td>
                    <td className="p-1.5 text-center">{Math.round((data.count / failed) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Duration */}
        {options.includeDurationTrend && (
          <div>
            <SectionHeader title="Duration Analysis" />
            <p className="text-xs text-gray-600 mb-2">
              Avg: {avgDuration}ms | Max: {Math.max(...history.map(h => h.test.duration))}ms | Min: {Math.min(...history.map(h => h.test.duration))}ms
            </p>
          </div>
        )}

        {/* Retry Analysis */}
        {options.includeRetryAnalysis && totalRetries > 0 && (
          <div>
            <SectionHeader title="Retry Analysis" />
            <p className="text-xs text-gray-600">
              Total retries: {totalRetries} | Runs with retries: {flaky} of {total} | Flakiness: {Math.round((flaky / total) * 100)}%
            </p>
          </div>
        )}

        {/* Run History */}
        {options.includeRunHistory && (
          <div>
            <SectionHeader title={`Run History (${total} runs)`} />
            <table className="w-full text-[10px] border">
              <thead><tr className="bg-primary/10"><th className="text-left p-1 font-medium">#</th><th className="text-left p-1 font-medium">Run</th><th className="text-left p-1 font-medium">Date</th><th className="p-1 font-medium text-center">Status</th><th className="p-1 font-medium text-right">Duration</th></tr></thead>
              <tbody>
                {[...history].reverse().map((h, i) => (
                  <tr key={h.run.runId} className="border-t">
                    <td className="p-1">{i + 1}</td>
                    <td className="p-1 font-mono truncate max-w-[120px]">{h.run.runId}</td>
                    <td className="p-1">{formatDate(h.run.timestamp)}</td>
                    <td className={`p-1 text-center font-bold ${statusClass(h.test.status, cm)}`}>{h.test.status.toUpperCase()}</td>
                    <td className="p-1 text-right">{h.test.duration}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="border-t pt-3 flex justify-between text-[10px] text-gray-400">
          <span>{options.footerNote || ""}</span>
          <span>Generated {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-2">
      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{title}</h3>
      <div className="h-0.5 bg-primary/30 mt-1" />
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-24 shrink-0">{label}</span>
      <span className="text-gray-700 font-mono break-words">{value}</span>
    </div>
  );
}

function StatBox({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className="bg-gray-50 rounded p-2 text-center">
      <p className="text-[10px] text-gray-400 uppercase">{label}</p>
      <p className={`text-sm font-bold font-mono ${className}`}>{value}</p>
    </div>
  );
}

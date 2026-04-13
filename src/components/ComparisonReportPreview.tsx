import { ComparisonExportOptions } from "@/models/comparisonExportTypes";
import { ComparisonData } from "@/pages/Compare";
import { formatDate, formatDuration, passRate } from "@/utils/format";
import { StatusBadge } from "@/components/StatusBadge";

interface Props {
  data: ComparisonData;
  options: ComparisonExportOptions;
}

export function ComparisonReportPreview({ data, options }: Props) {
  const d = data;
  const cm = options.colorMode;

  function sc(status: string) {
    if (cm === "grayscale") return "text-foreground";
    if (status === "passed") return "text-success";
    if (status === "failed") return "text-destructive";
    return "text-muted-foreground";
  }

  return (
    <div className="bg-white text-foreground rounded-lg border shadow-sm p-6 space-y-5 font-sans text-xs max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 border-b pb-4">
        <div className="w-10 h-10 rounded bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-mono font-bold text-sm">{options.logoText}</span>
        </div>
        <div className="flex-1">
          <h1 className="text-base font-bold text-foreground">{options.reportTitle}</h1>
          {options.subtitle && <p className="text-[11px] text-muted-foreground">{options.subtitle}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-[10px] text-muted-foreground">
            {options.organizationName && <span>{options.organizationName}</span>}
            {options.projectName && <span>{options.projectName}</span>}
            {options.generatedBy && <span>By {options.generatedBy}</span>}
          </div>
        </div>
      </div>

      {options.headerNote && (
        <p className="text-[10px] text-muted-foreground italic border-l-2 border-primary pl-2">{options.headerNote}</p>
      )}

      {options.executiveSummary && (
        <div className="rounded border bg-muted/30 p-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Executive Summary</p>
          <p className="text-[11px] text-foreground whitespace-pre-line">{options.executiveSummary}</p>
        </div>
      )}

      {options.customVariables.filter((cv) => cv.key).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.customVariables.filter((cv) => cv.key).map((cv, i) => (
            <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono">
              {cv.key}: {cv.value}
            </span>
          ))}
        </div>
      )}

      {/* Run Info Side by Side */}
      <div className="grid grid-cols-2 gap-3">
        <RunCard label="Baseline (Run A)" manifest={d.runA.manifest} />
        <RunCard label="Compare (Run B)" manifest={d.runB.manifest} />
      </div>

      {/* Delta Summary */}
      {options.includeDeltaSummary && (
        <div className="grid grid-cols-4 gap-2">
          <MiniStat label="Δ Pass Rate" value={`${d.passRateDelta > 0 ? "+" : ""}${d.passRateDelta}%`} good={d.passRateDelta >= 0} />
          <MiniStat label="Δ Failures" value={`${d.runB.manifest.failed - d.runA.manifest.failed > 0 ? "+" : ""}${d.runB.manifest.failed - d.runA.manifest.failed}`} good={d.runB.manifest.failed - d.runA.manifest.failed <= 0} />
          <MiniStat label="Δ Duration" value={`${d.durationDelta > 0 ? "+" : ""}${d.durationDelta}s`} good={d.durationDelta <= 0} />
          <MiniStat label="Δ Tests" value={`${d.totalDelta > 0 ? "+" : ""}${d.totalDelta}`} good={d.totalDelta >= 0} />
        </div>
      )}

      {/* Sections */}
      {options.includeNewFailures && d.newFailures.length > 0 && (
        <PreviewSection title={`🔴 New Failures (${d.newFailures.length})`}>
          {d.newFailures.map((t) => (
            <div key={t.id} className="flex items-center gap-2 px-2 py-1 rounded border bg-destructive/5">
              <StatusBadge status="failed" />
              <span className="font-mono text-[10px] truncate flex-1">{t.name}</span>
              <span className="text-[9px] text-muted-foreground">{t.suite}</span>
              {options.includeErrorDetails && t.error && (
                <span className="text-[9px] text-destructive truncate max-w-[150px]">{t.error.slice(0, 60)}</span>
              )}
            </div>
          ))}
        </PreviewSection>
      )}

      {options.includeResolved && d.resolved.length > 0 && (
        <PreviewSection title={`🟢 Resolved (${d.resolved.length})`}>
          {d.resolved.map((t) => (
            <div key={t.id} className="flex items-center gap-2 px-2 py-1 rounded border bg-success/5">
              <StatusBadge status="passed" />
              <span className="font-mono text-[10px] truncate flex-1">{t.name}</span>
              <span className="text-[9px] text-muted-foreground">{t.suite}</span>
            </div>
          ))}
        </PreviewSection>
      )}

      {options.includePersistentFailures && d.persistent.length > 0 && (
        <PreviewSection title={`🟠 Persistent Failures (${d.persistent.length})`}>
          {d.persistent.map((t) => (
            <div key={t.id} className="flex items-center gap-2 px-2 py-1 rounded border bg-amber-500/5">
              <StatusBadge status="failed" />
              <span className="font-mono text-[10px] truncate flex-1">{t.name}</span>
              {options.includeErrorDetails && t.error && (
                <span className="text-[9px] text-destructive truncate max-w-[150px]">{t.error.slice(0, 60)}</span>
              )}
            </div>
          ))}
        </PreviewSection>
      )}

      {options.includeNewTests && d.newTests.length > 0 && (
        <PreviewSection title={`🆕 New Tests (${d.newTests.length})`}>
          {d.newTests.map((t) => (
            <div key={t.id} className="flex items-center gap-2 px-2 py-1 rounded border">
              <StatusBadge status={t.status} />
              <span className="font-mono text-[10px] truncate flex-1">{t.name}</span>
              <span className="text-[9px] text-muted-foreground">{t.suite}</span>
            </div>
          ))}
        </PreviewSection>
      )}

      {options.includeRemovedTests && d.removed.length > 0 && (
        <PreviewSection title={`🗑️ Removed Tests (${d.removed.length})`}>
          {d.removed.map((name) => (
            <div key={name} className="px-2 py-1 rounded border bg-muted/30">
              <span className="font-mono text-[10px] text-muted-foreground">{name}</span>
            </div>
          ))}
        </PreviewSection>
      )}

      {options.includeSuiteHealth && d.suiteHealthMap.size > 0 && (
        <PreviewSection title="📊 Suite Health Comparison">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-1">Suite</th>
                <th className="text-center px-2">P(A)</th>
                <th className="text-center px-2">F(A)</th>
                <th className="text-center px-2">P(B)</th>
                <th className="text-center px-2">F(B)</th>
                <th className="text-center px-2">Δ</th>
              </tr>
            </thead>
            <tbody>
              {[...d.suiteHealthMap.entries()].sort((a, b) => (b[1].failB - b[1].failA) - (a[1].failB - a[1].failA)).map(([suite, h]) => {
                const delta = h.failB - h.failA;
                return (
                  <tr key={suite} className="border-b border-border/30">
                    <td className="py-1 truncate max-w-[140px]">{suite}</td>
                    <td className={`text-center ${sc("passed")}`}>{h.passA}</td>
                    <td className={`text-center ${sc("failed")}`}>{h.failA}</td>
                    <td className={`text-center ${sc("passed")}`}>{h.passB}</td>
                    <td className={`text-center ${sc("failed")}`}>{h.failB}</td>
                    <td className={`text-center font-semibold ${delta > 0 ? sc("failed") : delta < 0 ? sc("passed") : "text-muted-foreground"}`}>
                      {delta > 0 ? `+${delta}` : delta}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </PreviewSection>
      )}

      {/* Footer */}
      <div className="border-t pt-2 flex justify-between text-[9px] text-muted-foreground">
        <span>Playwright Intelligence · Comparison Report</span>
        <span>{options.footerNote || new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function RunCard({ label, manifest }: { label: string; manifest: any }) {
  return (
    <div className="rounded border bg-muted/20 p-2.5 space-y-1">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase">{label}</p>
      <p className="font-mono text-[10px]">{manifest.runId.slice(0, 20)}</p>
      <p className="text-[9px] text-muted-foreground">{formatDate(manifest.timestamp)}</p>
      <p className="font-mono text-[10px]">{passRate(manifest)}% pass · {manifest.failed} failed · {formatDuration(manifest.duration)}</p>
    </div>
  );
}

function MiniStat({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="rounded border bg-muted/20 p-2 text-center">
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <p className={`font-mono text-xs font-semibold ${good ? "text-success" : "text-destructive"}`}>{value}</p>
    </div>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TestResult, ApiPayload, TestStep } from "@/models/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { SEVERITY_META, DEFECT_CATEGORY_META } from "@/services/defectClassifier";

interface TestRowProps {
  test: TestResult;
  runId?: string;
}

function JsonViewer({ data, label }: { data: unknown; label: string }) {
  const [open, setOpen] = useState(false);
  if (data === undefined || data === null) return null;
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="text-[10px] font-mono font-medium text-primary hover:underline flex items-center gap-1"
      >
        <span>{open ? "▾" : "▸"}</span> {label}
      </button>
      {open && (
        <pre className="font-mono text-[11px] text-foreground bg-muted/60 border rounded p-2 mt-1 overflow-x-auto whitespace-pre max-h-48 overflow-y-auto">
          {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function ApiPayloadView({ payload }: { payload: ApiPayload }) {
  const statusColor = (payload.statusCode ?? 200) >= 400 ? "text-destructive" : "text-success";
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground mb-1">API Request / Response</p>
      <div className="rounded-md border bg-muted/30 p-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          <Badge variant="outline" className="text-[10px] font-bold">{payload.method}</Badge>
          <span className="text-foreground">{payload.url}</span>
          <span className={`font-bold ${statusColor}`}>{payload.statusCode}</span>
          {payload.latency !== undefined && (
            <span className="text-muted-foreground text-[10px]">{payload.latency}ms</span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <JsonViewer data={payload.requestHeaders} label="Request Headers" />
            <JsonViewer data={payload.requestBody} label="Request Body" />
          </div>
          <div className="space-y-1">
            <JsonViewer data={payload.responseHeaders} label="Response Headers" />
            <JsonViewer data={payload.responseBody} label="Response Body" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepView({ step, depth = 0 }: { step: TestStep; depth?: number }) {
  const statusIcon = step.status === "passed" ? "✓" : step.status === "failed" ? "✗" : "⊘";
  const statusColor = step.status === "passed" ? "text-success" : step.status === "failed" ? "text-destructive" : "text-muted-foreground";

  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <div className="flex items-center gap-2 py-0.5">
        <span className={`font-mono text-[10px] font-bold ${statusColor}`}>{statusIcon}</span>
        <span className="font-mono text-[11px] text-foreground flex-1">{step.name}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{step.duration}ms</span>
      </div>
      {step.error && (
        <pre className="font-mono text-[10px] text-destructive/70 ml-4 truncate">{step.error}</pre>
      )}
      {step.steps?.map((child, i) => (
        <StepView key={i} step={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function TestRow({ test: t, runId }: TestRowProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const hasDetails = t.error || (t.logs && t.logs.length > 0) || t.apiPayload || (t.steps && t.steps.length > 0);
  const severityMeta = t.severity ? SEVERITY_META[t.severity] : null;
  const defectMeta = t.defectCategory ? DEFECT_CATEGORY_META[t.defectCategory] : null;

  return (
    <div className="rounded-md border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center">
        <button
          onClick={() => hasDetails && setExpanded(!expanded)}
          className={`flex-1 text-left flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 hover:bg-accent/30 transition-colors ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
        >
          {hasDetails ? (
            <span className="text-muted-foreground text-xs font-mono w-4 shrink-0">{expanded ? "▾" : "▸"}</span>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <StatusBadge status={t.status} />
          <span className="font-mono text-xs sm:text-sm text-foreground flex-1 truncate">{t.name}</span>
          
          {/* Severity indicator */}
          {severityMeta && (
            <span className="text-[10px] shrink-0" title={`Severity: ${severityMeta.label}`}>{severityMeta.icon}</span>
          )}
          
          <span className="font-mono text-xs text-muted-foreground shrink-0 hidden sm:inline">{t.duration}ms</span>
          {t.retries > 0 && (
            <Badge variant="outline" className="font-mono text-[10px] sm:text-xs bg-warning/10 text-warning border-warning/30 shrink-0">
              {t.retries}r
            </Badge>
          )}
          {t.apiPayload && (
            <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/30 shrink-0">
              API
            </Badge>
          )}
          {/* Defect category badge for failed tests */}
          {defectMeta && t.status === "failed" && (
            <Badge variant="outline" className="font-mono text-[10px] shrink-0" style={{ backgroundColor: `${defectMeta.color}15`, borderColor: `${defectMeta.color}40` }}>
              {defectMeta.icon} {defectMeta.label}
            </Badge>
          )}
        </button>
        {runId && (
          <button
            onClick={() => navigate(`/test/${encodeURIComponent(t.name)}`)}
            className="px-2 sm:px-3 py-2.5 text-xs text-muted-foreground hover:text-primary font-mono transition-colors border-l"
            title="View test history"
          >
            📊
          </button>
        )}
      </div>

      {expanded && (
        <div className="px-3 sm:px-4 pb-3 pt-1 border-t border-border/50 space-y-2 ml-4 sm:ml-7">
          <p className="font-mono text-xs text-muted-foreground sm:hidden">{t.duration}ms</p>
          
          {/* Severity + Defect Category summary */}
          {(severityMeta || defectMeta) && (
            <div className="flex items-center gap-3 flex-wrap">
              {severityMeta && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span>{severityMeta.icon}</span>
                  <span className="font-mono font-medium text-foreground">Severity:</span>
                  <span className="font-mono text-muted-foreground">{severityMeta.label}</span>
                </div>
              )}
              {defectMeta && t.status === "failed" && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span>{defectMeta.icon}</span>
                  <span className="font-mono font-medium text-foreground">Category:</span>
                  <span className="font-mono text-muted-foreground">{defectMeta.label}</span>
                </div>
              )}
            </div>
          )}

          {/* Test Steps */}
          {t.steps && t.steps.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Steps</p>
              <div className="rounded-md border bg-muted/30 p-2 space-y-0">
                {t.steps.map((step, i) => (
                  <StepView key={i} step={step} />
                ))}
              </div>
            </div>
          )}

          {t.apiPayload && <ApiPayloadView payload={t.apiPayload} />}
          {t.error && (
            <div>
              <p className="text-xs font-medium text-destructive mb-1">Error</p>
              <pre className="font-mono text-xs text-destructive/80 bg-destructive/5 border border-destructive/20 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                {t.error}
              </pre>
            </div>
          )}
          {t.logs && t.logs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Logs</p>
              <div className="font-mono text-xs text-muted-foreground bg-muted/50 border rounded p-2 space-y-0.5">
                {t.logs.map((line, i) => (
                  <div key={i} className={(() => { const s = typeof line === "object" ? JSON.stringify(line, null, 2) : String(line); return s.includes("[ERROR]") ? "text-destructive" : s.includes("[WARN]") ? "text-warning" : ""; })()}>{typeof line === "object" ? JSON.stringify(line, null, 2) : String(line)}</div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-1.5 flex-wrap">
            {t.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="font-mono text-[10px]">{tag}</Badge>
            ))}
            <Badge variant="outline" className="font-mono text-[10px]">{t.file}</Badge>
          </div>
        </div>
      )}
    </div>
  );
}

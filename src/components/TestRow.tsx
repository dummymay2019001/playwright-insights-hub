import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TestResult, ApiPayload } from "@/models/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";

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
        {/* Method + URL + Status */}
        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          <Badge variant="outline" className="text-[10px] font-bold">{payload.method}</Badge>
          <span className="text-foreground">{payload.url}</span>
          <span className={`font-bold ${statusColor}`}>{payload.statusCode}</span>
          {payload.latency !== undefined && (
            <span className="text-muted-foreground text-[10px]">{payload.latency}ms</span>
          )}
        </div>
        {/* Collapsible sections */}
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

export function TestRow({ test: t, runId }: TestRowProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const hasDetails = t.error || (t.logs && t.logs.length > 0) || t.apiPayload;

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
                  <div key={i} className={line.includes("[ERROR]") ? "text-destructive" : line.includes("[WARN]") ? "text-warning" : ""}>{line}</div>
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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TestResult } from "@/models/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";

interface TestRowProps {
  test: TestResult;
  runId?: string;
}

export function TestRow({ test: t, runId }: TestRowProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const hasDetails = t.error || (t.logs && t.logs.length > 0);

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
                  <div key={i} className={line.includes("[ERROR]") ? "text-destructive" : ""}>{line}</div>
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

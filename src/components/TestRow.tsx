import { useState } from "react";
import { TestResult } from "@/models/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";

interface TestRowProps {
  test: TestResult;
}

export function TestRow({ test: t }: TestRowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = t.error || (t.logs && t.logs.length > 0);

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30 transition-colors ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
      >
        {hasDetails && (
          <span className="text-muted-foreground text-xs font-mono w-4 shrink-0">
            {expanded ? "▾" : "▸"}
          </span>
        )}
        {!hasDetails && <span className="w-4 shrink-0" />}
        <StatusBadge status={t.status} />
        <span className="font-mono text-sm text-foreground flex-1 truncate">{t.name}</span>
        <span className="font-mono text-xs text-muted-foreground shrink-0">{t.duration}ms</span>
        {t.retries > 0 && (
          <Badge variant="outline" className="font-mono text-xs bg-warning/10 text-warning border-warning/30 shrink-0">
            {t.retries} retries
          </Badge>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-3 pt-1 border-t border-border/50 space-y-2 ml-7">
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
              <div className="font-mono text-xs text-muted-foreground bg-muted/30 border rounded p-2 space-y-0.5">
                {t.logs.map((line, i) => (
                  <div key={i} className={line.includes("[ERROR]") ? "text-destructive" : ""}>{line}</div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-1.5 flex-wrap">
            {t.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="font-mono text-[10px] bg-secondary/50 border-border">
                {tag}
              </Badge>
            ))}
            <Badge variant="outline" className="font-mono text-[10px] bg-secondary/50 border-border">
              {t.file}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}

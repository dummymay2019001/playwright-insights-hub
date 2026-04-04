import type { StatusCodeSummary, StatusMismatch } from "@/services/insightsEngine";
import { useNavigate } from "react-router-dom";

interface StatusCodeInsightsProps {
  summary: StatusCodeSummary[];
  mismatches: StatusMismatch[];
}

const codeColors: Record<string, string> = {
  "2": "hsl(var(--success))",
  "3": "hsl(var(--primary))",
  "4": "hsl(var(--warning))",
  "5": "hsl(var(--destructive))",
};

function getCodeColor(code: number): string {
  return codeColors[String(code)[0]] || "hsl(var(--muted-foreground))";
}

export function StatusCodeInsights({ summary, mismatches }: StatusCodeInsightsProps) {
  const navigate = useNavigate();
  const maxCount = Math.max(...summary.map((s) => s.count), 1);

  if (summary.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">API Status Code Insights</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribution */}
        <div className="bg-card rounded-lg border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Response Code Distribution</p>
          <div className="space-y-2.5">
            {summary.map((m) => (
              <div key={m.statusCode} className="flex items-center gap-3 text-xs">
                <span
                  className="inline-flex items-center justify-center w-12 h-6 rounded font-mono font-semibold text-[11px]"
                  style={{
                    backgroundColor: `${getCodeColor(m.statusCode)}20`,
                    color: getCodeColor(m.statusCode),
                  }}
                >
                  {m.statusCode}
                </span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(m.count / maxCount) * 100}%`,
                      backgroundColor: getCodeColor(m.statusCode),
                    }}
                  />
                </div>
                <span className="font-mono tabular-nums w-6 text-right text-muted-foreground">{m.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mismatches / Error Responses */}
        <div className="bg-card rounded-lg border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Failed API Responses</p>
          {mismatches.length > 0 ? (
            <div className="space-y-2">
              {mismatches.map((t) => (
                <button
                  key={t.testName}
                  onClick={() => navigate(`/test/${encodeURIComponent(t.testName)}`)}
                  className="w-full text-left flex items-center gap-2 text-xs py-1.5 border-b border-border/50 last:border-0 hover:bg-accent/30 rounded px-1 transition-colors"
                >
                  <span className="truncate flex-1 font-medium text-foreground">{t.testName.slice(0, 45)}{t.testName.length > 45 ? "…" : ""}</span>
                  {t.expectedUrl && (
                    <span className="font-mono text-muted-foreground text-[10px] truncate max-w-[120px]">{t.expectedUrl}</span>
                  )}
                  <span
                    className="font-mono font-semibold text-[11px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${getCodeColor(t.actualStatus || 500)}15`,
                      color: getCodeColor(t.actualStatus || 500),
                    }}
                  >
                    {t.actualStatus}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic py-4 text-center">No failed API responses 🎉</p>
          )}
        </div>
      </div>
    </div>
  );
}

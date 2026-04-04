import { useNavigate } from "react-router-dom";
import { RunManifest } from "@/models/types";
import { formatDate, formatDuration, passRate } from "@/utils/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";

interface RunRowProps {
  manifest: RunManifest;
}

export function RunRow({ manifest: m }: RunRowProps) {
  const navigate = useNavigate();
  const rate = passRate(m);

  return (
    <button
      onClick={() => navigate(`/run/${encodeURIComponent(m.runId)}`)}
      className="w-full text-left flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors group shadow-sm"
    >
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors">
          {m.runId}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(m.timestamp)}</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="font-mono text-xs">
          {m.branch}
        </Badge>
        <Badge variant="outline" className="font-mono text-xs">
          {m.environment}
        </Badge>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status="passed" count={m.passed} />
        <StatusBadge status="failed" count={m.failed} />
        <StatusBadge status="skipped" count={m.skipped} />
      </div>

      <div className="flex items-center gap-3">
        <span className={`font-mono text-sm font-semibold ${rate >= 95 ? "text-success" : rate >= 80 ? "text-warning" : "text-destructive"}`}>
          {rate}%
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {formatDuration(m.duration)}
        </span>
      </div>
    </button>
  );
}

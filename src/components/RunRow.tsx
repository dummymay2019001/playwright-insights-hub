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
      className="w-full text-left grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-4 py-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
    >
      <div className="min-w-0">
        <p className="font-mono text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors">
          {m.runId}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(m.timestamp)}</p>
      </div>

      <Badge variant="outline" className="font-mono text-xs bg-secondary/50 border-border">
        {m.branch}
      </Badge>

      <Badge variant="outline" className="font-mono text-xs bg-secondary/50 border-border">
        {m.environment}
      </Badge>

      <div className="flex gap-1.5">
        <StatusBadge status="passed" count={m.passed} />
        <StatusBadge status="failed" count={m.failed} />
        <StatusBadge status="skipped" count={m.skipped} />
      </div>

      <span className={`font-mono text-sm font-semibold ${rate >= 95 ? "text-success" : rate >= 80 ? "text-warning" : "text-destructive"}`}>
        {rate}%
      </span>

      <span className="font-mono text-xs text-muted-foreground w-16 text-right">
        {formatDuration(m.duration)}
      </span>
    </button>
  );
}

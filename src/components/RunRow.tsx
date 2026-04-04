import { useNavigate } from "react-router-dom";
import { RunManifest } from "@/models/types";
import { formatDate, formatDuration, passRate } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface RunRowProps {
  manifest: RunManifest;
}

export function RunRow({ manifest: m }: RunRowProps) {
  const navigate = useNavigate();
  const rate = passRate(m);

  return (
    <button
      onClick={() => navigate(`/run/${encodeURIComponent(m.runId)}`)}
      className="w-full text-left rounded-xl border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group overflow-hidden"
    >
      <div className="px-4 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* Left: Identity */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${rate >= 95 ? "bg-success" : rate >= 80 ? "bg-warning" : "bg-destructive"}`} />
            <p className="font-mono text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
              {m.runId}
            </p>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 ml-[18px]">{formatDate(m.timestamp)}</p>
        </div>

        {/* Middle: Metadata */}
        <div className="flex items-center gap-1.5 ml-[18px] sm:ml-0">
          <Badge variant="outline" className="font-mono text-[10px] sm:text-xs">{m.branch}</Badge>
          <Badge variant="outline" className="font-mono text-[10px] sm:text-xs">{m.environment}</Badge>
        </div>

        {/* Right: Results */}
        <div className="flex items-center gap-3 sm:gap-4 ml-[18px] sm:ml-0">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-success">{m.passed}✓</span>
            {m.failed > 0 && <span className="text-destructive">{m.failed}✗</span>}
            {m.skipped > 0 && <span className="text-muted-foreground">{m.skipped}⊘</span>}
          </div>
          <span className="font-mono text-xs text-muted-foreground">{formatDuration(m.duration)}</span>
          <span className={`font-mono text-sm font-bold min-w-[3ch] text-right ${rate >= 95 ? "text-success" : rate >= 80 ? "text-warning" : "text-destructive"}`}>
            {rate}%
          </span>
        </div>
      </div>
      {/* Progress bar at bottom */}
      <div className="px-4 pb-0">
        <Progress value={rate} className="h-1 rounded-none rounded-b-xl" />
      </div>
    </button>
  );
}

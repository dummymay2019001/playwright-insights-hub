import { useNavigate } from "react-router-dom";
import { RunManifest } from "@/models/types";
import { formatDate, formatDuration, passRate } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RunRowProps {
  manifest: RunManifest;
  onRemove?: (runId: string) => void;
}

export function RunRow({ manifest: m, onRemove }: RunRowProps) {
  const navigate = useNavigate();
  const rate = passRate(m);

  return (
    <div className="relative group">
      <button
        onClick={() => navigate(`/run/${encodeURIComponent(m.runId)}`)}
        className="w-full text-left rounded-xl border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group/btn overflow-hidden"
      >
        <div className="px-4 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* Left: Identity */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${rate >= 95 ? "bg-success" : rate >= 80 ? "bg-warning" : "bg-destructive"}`} />
              <p className="font-mono text-sm font-semibold truncate text-foreground group-hover/btn:text-primary transition-colors">
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

      {/* Delete button - appears on hover */}
      {onRemove && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-card/80 backdrop-blur border border-transparent hover:border-destructive/30 hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive transition-colors" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-mono text-sm">Remove Run</AlertDialogTitle>
              <AlertDialogDescription className="font-mono text-xs">
                Remove <strong>{m.runId}</strong> from your imported data? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-mono text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="font-mono text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => onRemove(m.runId)}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

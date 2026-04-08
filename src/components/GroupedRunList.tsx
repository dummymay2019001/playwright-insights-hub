import { useMemo, useState } from "react";
import { TestRun } from "@/models/types";
import { RunRow } from "@/components/RunRow";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface Props {
  runs: TestRun[];
  onRemove?: (runId: string) => void;
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return "";
}

function getGroupKey(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  if (d >= weekAgo) return "This Week";
  if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) return "This Month";
  
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const GROUP_ORDER = ["Today", "Yesterday", "This Week", "This Month"];

function groupSortKey(key: string): number {
  const idx = GROUP_ORDER.indexOf(key);
  if (idx >= 0) return idx;
  // Parse "Month Year" — sort descending by date
  const parsed = new Date(key + " 1");
  if (!isNaN(parsed.getTime())) return 100 - (parsed.getTime() / 1e12);
  return 999;
}

export function GroupedRunList({ runs, onRemove }: Props) {
  const groups = useMemo(() => {
    const sorted = [...runs].sort(
      (a, b) => new Date(b.manifest.timestamp).getTime() - new Date(a.manifest.timestamp).getTime()
    );
    const map = new Map<string, typeof sorted>();
    for (const run of sorted) {
      const date = new Date(run.manifest.timestamp);
      const key = getGroupKey(date);
      const arr = map.get(key) || [];
      arr.push(run);
      map.set(key, arr);
    }
    return [...map.entries()].sort((a, b) => groupSortKey(a[0]) - groupSortKey(b[0]));
  }, [runs]);

  // Default: open first 2 groups
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    groups.slice(0, 2).forEach(([key]) => initial.add(key));
    return initial;
  });

  const toggle = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {groups.map(([groupKey, groupRuns]) => {
        const isOpen = openGroups.has(groupKey);
        const passCount = groupRuns.reduce((s, r) => s + r.manifest.passed, 0);
        const failCount = groupRuns.reduce((s, r) => s + r.manifest.failed, 0);

        return (
          <Collapsible key={groupKey} open={isOpen} onOpenChange={() => toggle(groupKey)}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border hover:bg-muted/80 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`} />
                  <span className="font-mono text-xs font-semibold text-foreground">{groupKey}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">({groupRuns.length} run{groupRuns.length !== 1 ? "s" : ""})</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span className="text-success">{passCount}✓</span>
                  {failCount > 0 && <span className="text-destructive">{failCount}✗</span>}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1.5 mt-1.5 ml-2 border-l-2 border-border pl-2">
                {groupRuns.map((run) => {
                  const date = new Date(run.manifest.timestamp);
                  const ago = timeAgo(date);
                  return (
                    <div key={run.manifest.runId} className="relative">
                      {ago && (
                        <span className="absolute -top-1 right-2 font-mono text-[9px] text-muted-foreground bg-card px-1 rounded z-10">
                          {ago}
                        </span>
                      )}
                      <RunRow manifest={run.manifest} onRemove={onRemove} />
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

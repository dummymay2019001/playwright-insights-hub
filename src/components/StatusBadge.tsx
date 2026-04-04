import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "passed" | "failed" | "skipped";
  count?: number;
}

export function StatusBadge({ status, count }: StatusBadgeProps) {
  const variants: Record<string, string> = {
    passed: "bg-success/15 text-success border-success/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    skipped: "bg-skipped/15 text-skipped border-skipped/30",
  };

  return (
    <Badge variant="outline" className={`font-mono text-xs ${variants[status]}`}>
      {count !== undefined ? `${count} ${status}` : status}
    </Badge>
  );
}

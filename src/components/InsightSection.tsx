import { ReactNode, useState } from "react";

interface InsightSectionProps {
  title: string;
  icon: string;
  count: number;
  severity: "critical" | "warning" | "info" | "success";
  children: ReactNode;
  defaultOpen?: boolean;
}

const severityStyles = {
  critical: "border-destructive/30 bg-destructive/5",
  warning: "border-warning/30 bg-warning/5",
  info: "border-primary/20 bg-primary/5",
  success: "border-success/20 bg-success/5",
};

const severityBadge = {
  critical: "bg-destructive/15 text-destructive",
  warning: "bg-warning/15 text-warning",
  info: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
};

export function InsightSection({ title, icon, count, severity, children, defaultOpen = false }: InsightSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (count === 0) return null;

  return (
    <div className={`rounded-lg border overflow-hidden ${severityStyles[severity]}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors"
      >
        <span className="text-base">{icon}</span>
        <span className="font-medium text-sm text-foreground flex-1">{title}</span>
        <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-full ${severityBadge[severity]}`}>
          {count}
        </span>
        <span className="text-muted-foreground text-xs font-mono">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border/30">
          {children}
        </div>
      )}
    </div>
  );
}

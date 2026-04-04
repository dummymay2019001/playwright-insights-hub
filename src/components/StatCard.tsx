interface StatCardProps {
  label: string;
  value: string | number;
  variant?: "default" | "success" | "destructive" | "warning" | "muted";
  subtitle?: string;
  icon?: string;
}

const variantClasses: Record<string, string> = {
  default: "text-foreground",
  success: "text-success",
  destructive: "text-destructive",
  warning: "text-warning",
  muted: "text-muted-foreground",
};

const variantBg: Record<string, string> = {
  default: "",
  success: "bg-success/5 border-success/20",
  destructive: "bg-destructive/5 border-destructive/20",
  warning: "bg-warning/5 border-warning/20",
  muted: "",
};

export function StatCard({ label, value, variant = "default", subtitle, icon }: StatCardProps) {
  return (
    <div className={`rounded-xl border bg-card p-3 sm:p-4 transition-all hover:shadow-md ${variantBg[variant]}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        {icon && <span className="text-sm">{icon}</span>}
      </div>
      <p className={`text-xl sm:text-2xl font-mono font-bold ${variantClasses[variant]}`}>{value}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{subtitle}</p>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  variant?: "default" | "success" | "destructive" | "warning" | "muted";
}

const variantClasses: Record<string, string> = {
  default: "text-foreground",
  success: "text-success",
  destructive: "text-destructive",
  warning: "text-warning",
  muted: "text-muted-foreground",
};

export function StatCard({ label, value, variant = "default" }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-mono font-bold ${variantClasses[variant]}`}>{value}</p>
    </div>
  );
}

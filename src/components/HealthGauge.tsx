interface HealthGaugeProps {
  score: number;
  label: string;
  size?: "sm" | "lg";
}

function getColor(score: number) {
  if (score >= 90) return "text-success";
  if (score >= 70) return "text-warning";
  return "text-destructive";
}

function getBg(score: number) {
  if (score >= 90) return "bg-success/10 border-success/20";
  if (score >= 70) return "bg-warning/10 border-warning/20";
  return "bg-destructive/10 border-destructive/20";
}

export function HealthGauge({ score, label, size = "sm" }: HealthGaugeProps) {
  const isLg = size === "lg";

  return (
    <div className={`rounded-lg border p-3 sm:p-4 text-center ${getBg(score)}`}>
      <p className={`font-mono font-bold ${getColor(score)} ${isLg ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"}`}>
        {score}
      </p>
      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

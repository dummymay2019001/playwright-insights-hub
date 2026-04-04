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

function getStroke(score: number) {
  if (score >= 90) return "hsl(var(--success))";
  if (score >= 70) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

export function HealthGauge({ score, label, size = "sm" }: HealthGaugeProps) {
  const isLg = size === "lg";
  const dim = isLg ? 96 : 64;
  const r = isLg ? 38 : 25;
  const stroke = isLg ? 6 : 4;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2} cy={dim / 2} r={r}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={stroke}
          />
          <circle
            cx={dim / 2} cy={dim / 2} r={r}
            fill="none"
            stroke={getStroke(score)}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-mono font-bold ${getColor(score)} ${isLg ? "text-xl" : "text-sm"}`}>
            {score}%
          </span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}

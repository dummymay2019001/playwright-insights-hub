import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { DurationBucket } from "@/services/insightsEngine";
import type { SlowestTest } from "@/services/insightsEngine";

interface DurationDistributionProps {
  buckets: DurationBucket[];
  slowestTests: SlowestTest[];
}

const barColors = [
  "hsl(var(--success))",
  "hsl(var(--primary))",
  "hsl(var(--primary))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
];

export function DurationDistribution({ buckets, slowestTests }: DurationDistributionProps) {
  const top10 = slowestTests.slice(0, 10).map((t) => ({
    name: t.testName.length > 30 ? t.testName.slice(0, 30) + "…" : t.testName,
    duration: Math.round(t.avgDuration / 100) / 10,
    trend: t.trend,
  }));

  const avgDuration = slowestTests.length > 0
    ? Math.round(slowestTests.reduce((s, t) => s + t.avgDuration, 0) / slowestTests.length)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Duration Insights</h3>
        <span className="text-xs text-muted-foreground">
          avg: <span className="font-mono font-medium text-foreground">{(avgDuration / 1000).toFixed(1)}s</span>
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 10 Slowest */}
        <div className="bg-card rounded-lg border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Top 10 Slowest Tests</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top10} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--chart-tick))" }} tickFormatter={(v) => `${v}s`} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 9, fill: "hsl(var(--chart-tick))" }} />
              <Tooltip
                formatter={(value: number) => [`${value}s`, "Duration"]}
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  backgroundColor: "hsl(var(--chart-tooltip-bg))",
                  border: "1px solid hsl(var(--chart-tooltip-border))",
                  color: "hsl(var(--chart-tooltip-text))",
                }}
              />
              <Bar dataKey="duration" radius={[0, 4, 4, 0]}>
                {top10.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.trend === "increasing"
                        ? "hsl(var(--destructive))"
                        : entry.trend === "decreasing"
                        ? "hsl(var(--success))"
                        : "hsl(var(--primary))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution */}
        <div className="bg-card rounded-lg border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Duration Distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={buckets} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(var(--chart-tick))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--chart-tick))" }} />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  backgroundColor: "hsl(var(--chart-tooltip-bg))",
                  border: "1px solid hsl(var(--chart-tooltip-border))",
                  color: "hsl(var(--chart-tooltip-text))",
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {buckets.map((_, i) => (
                  <Cell key={i} fill={barColors[i] || "hsl(var(--primary))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

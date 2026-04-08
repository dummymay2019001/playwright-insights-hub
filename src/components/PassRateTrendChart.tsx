import { useMemo } from "react";
import { TestRun } from "@/models/types";
import { passRate } from "@/utils/format";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface Props {
  runs: TestRun[];
}

export function PassRateTrendChart({ runs }: Props) {
  const data = useMemo(() => {
    const sorted = [...runs].sort(
      (a, b) => new Date(a.manifest.timestamp).getTime() - new Date(b.manifest.timestamp).getTime()
    );
    return sorted.map((r, i) => ({
      idx: i + 1,
      label: `Run ${i + 1}`,
      rate: passRate(r.manifest),
      passed: r.manifest.passed,
      failed: r.manifest.failed,
      total: r.manifest.total,
    }));
  }, [runs]);

  if (data.length < 2) return null;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Pass Rate Trend</h3>
        <span className="font-mono text-[10px] text-muted-foreground">{data.length} runs</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="passRateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "monospace",
            }}
            formatter={(value: number) => [`${value}%`, "Pass Rate"]}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="hsl(var(--success))"
            strokeWidth={2}
            fill="url(#passRateGrad)"
            dot={{ r: 3, fill: "hsl(var(--success))" }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

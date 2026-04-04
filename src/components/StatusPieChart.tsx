import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface StatusPieChartProps {
  passed: number;
  failed: number;
  skipped: number;
}

const COLORS = {
  passed: "hsl(142, 70%, 45%)",
  failed: "hsl(0, 72%, 51%)",
  skipped: "hsl(220, 15%, 50%)",
};

export function StatusPieChart({ passed, failed, skipped }: StatusPieChartProps) {
  const data = [
    { name: "Passed", value: passed, color: COLORS.passed },
    { name: "Failed", value: failed, color: COLORS.failed },
    { name: "Skipped", value: skipped, color: COLORS.skipped },
  ].filter((d) => d.value > 0);

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Status Distribution</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 44%, 9%)",
                border: "1px solid hsl(220, 30%, 16%)",
                borderRadius: "6px",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "hsl(210, 40%, 93%)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 mt-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="font-mono text-xs text-muted-foreground">{d.name} ({d.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

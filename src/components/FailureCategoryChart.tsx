import { useMemo } from "react";
import { TestRun } from "@/models/types";
import { classifyDefect, DEFECT_CATEGORY_META } from "@/services/defectClassifier";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  runs: TestRun[];
}

const COLORS: Record<string, string> = {
  product: "hsl(0, 72%, 50%)",
  test: "hsl(45, 90%, 50%)",
  infrastructure: "hsl(38, 80%, 55%)",
  unknown: "hsl(var(--muted-foreground))",
};

export function FailureCategoryChart({ runs }: Props) {
  const data = useMemo(() => {
    const counts: Record<string, number> = { product: 0, test: 0, infrastructure: 0, unknown: 0 };
    for (const run of runs) {
      for (const t of run.results) {
        if (t.status === "failed") {
          const cat = t.defectCategory || classifyDefect(t.error);
          counts[cat] = (counts[cat] || 0) + 1;
        }
      }
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        name: DEFECT_CATEGORY_META[key as keyof typeof DEFECT_CATEGORY_META]?.label || key,
        value,
        key,
        icon: DEFECT_CATEGORY_META[key as keyof typeof DEFECT_CATEGORY_META]?.icon || "❓",
      }));
  }, [runs]);

  const totalFailures = data.reduce((s, d) => s + d.value, 0);

  if (totalFailures === 0) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Failure Categories</h3>
        <div className="flex items-center justify-center py-6">
          <p className="font-mono text-xs text-success">✓ No failures detected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Failure Categories</h3>
        <span className="font-mono text-[10px] text-destructive">{totalFailures} failures</span>
      </div>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={50}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={COLORS[entry.key] || COLORS.unknown} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 11,
                fontFamily: "monospace",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1.5">
          {data.map((d) => (
            <div key={d.key} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{d.icon}</span>
                <span className="font-mono text-[10px] sm:text-xs text-foreground">{d.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(d.value / totalFailures) * 100}%`,
                      backgroundColor: COLORS[d.key] || COLORS.unknown,
                    }}
                  />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground w-6 text-right">{d.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

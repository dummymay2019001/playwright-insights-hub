import { useMemo } from "react";
import { useRuns } from "@/store/RunsContext";
import { passRate } from "@/utils/format";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area,
} from "recharts";
import { StatusBadge } from "@/components/StatusBadge";

const chartTooltipStyle = {
  backgroundColor: "hsl(0, 0%, 100%)",
  border: "1px solid hsl(220, 16%, 90%)",
  borderRadius: "6px",
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
  color: "hsl(222, 47%, 11%)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};
const gridStroke = "hsl(220, 16%, 92%)";
const tickStyle = { fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(220, 10%, 46%)" };

const TrendsPage = () => {
  const { runs, loading } = useRuns();

  const sorted = useMemo(
    () => [...runs].sort((a, b) => new Date(a.manifest.timestamp).getTime() - new Date(b.manifest.timestamp).getTime()),
    [runs]
  );

  const chartData = useMemo(
    () => sorted.map((r) => ({
      date: new Date(r.manifest.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      passRate: passRate(r.manifest),
      failures: r.manifest.failed,
      duration: r.manifest.duration,
      tests: r.manifest.total,
      suites: new Set(r.results.map((t) => t.suite)).size,
    })),
    [sorted]
  );


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <div className="container py-4 sm:py-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Historical Trends</h2>
        <p className="text-xs text-muted-foreground">{runs.length} runs analyzed</p>
      </div>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Pass Rate Over Time</h2>
        <div className="h-52 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="passGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" tick={tickStyle} />
              <YAxis domain={[0, 100]} tick={tickStyle} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}%`, "Pass Rate"]} />
              <Area type="monotone" dataKey="passRate" stroke="hsl(152, 60%, 40%)" strokeWidth={2} fill="url(#passGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Failure Count</h2>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" tick={tickStyle} />
                <YAxis tick={tickStyle} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="failures" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Duration Trend</h2>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" tick={tickStyle} />
                <YAxis tick={tickStyle} tickFormatter={(v) => `${v}s`} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}s`, "Duration"]} />
                <Line type="monotone" dataKey="duration" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(38, 92%, 50%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Suite & Test Growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Test Count Growth</h2>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="testGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" tick={tickStyle} />
                <YAxis tick={tickStyle} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="tests" stroke="hsl(217, 91%, 50%)" strokeWidth={2} fill="url(#testGrowthGrad)" name="Tests" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Suite Count Growth</h2>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" tick={tickStyle} />
                <YAxis tick={tickStyle} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="suites" fill="hsl(262, 80%, 55%)" radius={[4, 4, 0, 0]} name="Suites" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TrendsPage;

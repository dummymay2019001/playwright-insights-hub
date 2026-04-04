import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: "📊",
    title: "Multi-Run Analytics",
    desc: "Track test health across every run. Spot regressions before they reach production.",
    color: "from-primary/20 to-primary/5",
  },
  {
    icon: "🔍",
    title: "Deep Run Inspection",
    desc: "Drill into any run — suite breakdowns, tag filters, error traces, and API payloads at a glance.",
    color: "from-success/20 to-success/5",
  },
  {
    icon: "📈",
    title: "Trend Intelligence",
    desc: "Pass rates, failure frequency, duration drift — all charted over time so patterns reveal themselves.",
    color: "from-warning/20 to-warning/5",
  },
  {
    icon: "⚡",
    title: "Flaky Test Detection",
    desc: "Automatically surfaces tests that pass on retry. Know exactly which tests erode your team's trust.",
    color: "from-destructive/20 to-destructive/5",
  },
  {
    icon: "🏷️",
    title: "Tag-Based Filtering",
    desc: "Slice your suite by @smoke, @critical, @regression — see pass rates per tag instantly.",
    color: "from-accent to-accent/30",
  },
  {
    icon: "📄",
    title: "Enterprise PDF Export",
    desc: "Customizable stakeholder reports with branding, notes, custom variables, and live preview.",
    color: "from-primary/15 to-accent",
  },
];

const principles = [
  { num: "01", title: "Zero Backend", text: "No database. No server. Runs entirely from local JSON files." },
  { num: "02", title: "Privacy First", text: "Your test data never leaves your machine. Period." },
  { num: "03", title: "Instant Setup", text: "npm install, npm run dev — you're analyzing tests in under 60 seconds." },
  { num: "04", title: "Team Ready", text: "Export polished PDF reports that stakeholders actually want to read." },
];

const stats = [
  { value: "0", unit: "backends", label: "required" },
  { value: "<60s", unit: "", label: "to first insight" },
  { value: "∞", unit: "runs", label: "supported" },
  { value: "100%", unit: "", label: "local & private" },
];

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/20" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }} />
        <div className="container relative py-16 sm:py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="font-mono text-xs text-primary font-medium">Open Source · Local-First · Zero Config</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.1]">
              Turn test results into
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                actionable intelligence
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Playwright Intelligence is not another report viewer. It's an analytics dashboard that helps teams understand 
              <em> why</em> tests fail, <em>when</em> they started failing, and <em>what</em> to fix first.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button size="lg" className="font-mono text-sm px-6" onClick={() => navigate("/")}>
                → Open Dashboard
              </Button>
              <Button size="lg" variant="outline" className="font-mono text-sm px-6" onClick={() => navigate("/help")}>
                📖 Read the Guide
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y bg-card">
        <div className="container py-8 sm:py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-mono text-2xl sm:text-3xl font-bold text-foreground">
                  {s.value}<span className="text-muted-foreground text-lg ml-0.5">{s.unit}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story section */}
      <section className="container py-16 sm:py-20">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest">The Problem</h2>
          <p className="text-xl sm:text-2xl text-foreground font-medium leading-relaxed">
            "Our tests are flaky." "Which tests broke?" "How long has this been failing?"
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Every engineering team asks these questions — usually after a broken release. CI produces raw logs and exit codes. 
            You get a wall of green and red. But no one tells you the <em>story</em> behind your test suite.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Which tests just started failing? Which ones have been flaky for weeks? Is your test duration creeping up? 
            Are your @critical tests passing but your @regression suite slowly degrading?
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Playwright Intelligence reads your test results, connects the dots across runs, and surfaces 
            the insights your team actually needs. No setup. No servers. No data leaving your machine.
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-muted/30 border-y">
        <div className="container py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">Capabilities</h2>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">Everything you need, nothing you don't</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f) => (
              <div key={f.title} className="group rounded-xl border bg-card p-5 sm:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="font-mono text-sm font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">How It Works</h2>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">Three steps. That's it.</p>
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="space-y-0">
            {[
              { step: "1", title: "Run your Playwright tests", desc: "Use the built-in JSON reporter or our custom reporter to output structured results.", code: "npx playwright test --reporter=json" },
              { step: "2", title: "Drop results into the folder", desc: "Place your results.json files in the runs directory — one folder per run.", code: "runs/\n  ├── 2026-04-01/results.json\n  ├── 2026-04-02/results.json\n  └── 2026-04-03/results.json" },
              { step: "3", title: "Launch the dashboard", desc: "One command. Instant insights. No database, no backend, no configuration.", code: "npm run dev" },
            ].map((item, i) => (
              <div key={item.step} className="flex gap-4 sm:gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-mono text-sm font-bold shrink-0">
                    {item.step}
                  </div>
                  {i < 2 && <div className="w-px flex-1 bg-border my-2" />}
                </div>
                <div className="pb-10 flex-1 min-w-0">
                  <h3 className="font-mono text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-3">{item.desc}</p>
                  <pre className="font-mono text-xs bg-foreground/5 border rounded-lg p-3 overflow-x-auto text-muted-foreground">
                    {item.code}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="border-y bg-card">
        <div className="container py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">Principles</h2>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">Built different, on purpose</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 max-w-3xl mx-auto">
            {principles.map((p) => (
              <div key={p.num} className="flex gap-4 p-5 rounded-xl border bg-background">
                <span className="font-mono text-3xl font-bold text-primary/20 shrink-0">{p.num}</span>
                <div>
                  <h3 className="font-mono text-sm font-semibold text-foreground">{p.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API test showcase */}
      <section className="container py-16 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">Deep Visibility</h2>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">See everything. Miss nothing.</p>
            <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
              From high-level health gauges to API request/response payloads — every layer of your test suite is visible and filterable.
            </p>
          </div>
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/40" />
                <div className="w-3 h-3 rounded-full bg-warning/40" />
                <div className="w-3 h-3 rounded-full bg-success/40" />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground ml-2">Run Detail — api suite</span>
            </div>
            <div className="p-4 sm:p-5 space-y-3">
              {/* Mock test row */}
              <div className="rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="font-mono text-xs text-foreground flex-1">api &gt; POST /orders</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border bg-primary/10 text-primary">API</span>
                  <span className="font-mono text-[10px] text-muted-foreground">342ms</span>
                </div>
                <div className="mt-3 rounded border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-1.5 py-0.5 rounded border text-[10px] font-bold">POST</span>
                    <span className="text-foreground">/api/v1/orders</span>
                    <span className="text-success font-bold">201</span>
                    <span className="text-muted-foreground text-[10px]">230ms</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-[10px] font-mono">
                    <div>
                      <span className="text-primary">▸ Request Body</span>
                      <pre className="mt-1 bg-muted/60 rounded p-2 text-foreground">{`{
  "productId": "sku-123",
  "quantity": 2,
  "coupon": "SAVE10"
}`}</pre>
                    </div>
                    <div>
                      <span className="text-primary">▸ Response Body</span>
                      <pre className="mt-1 bg-muted/60 rounded p-2 text-foreground">{`{
  "orderId": "ord-9876",
  "status": "confirmed",
  "total": 89.99
}`}</pre>
                    </div>
                  </div>
                </div>
              </div>
              {/* Mock mini rows */}
              {[
                { status: "bg-success", name: "api > GET /users", ms: "128ms" },
                { status: "bg-destructive", name: "api > rate limiting", ms: "502ms" },
                { status: "bg-success", name: "api > PUT /settings", ms: "89ms" },
              ].map((r) => (
                <div key={r.name} className="flex items-center gap-2 rounded-md border p-2.5">
                  <span className={`w-2 h-2 rounded-full ${r.status}`} />
                  <span className="font-mono text-xs text-foreground flex-1">{r.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{r.ms}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="container py-16 sm:py-20 text-center">
          <div className="max-w-lg mx-auto space-y-5">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-mono font-bold text-lg">PW</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Ready to understand your tests?</h2>
            <p className="text-sm text-muted-foreground">
              Start analyzing your Playwright results in under 60 seconds. No signup required.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button size="lg" className="font-mono text-sm px-6" onClick={() => navigate("/")}>
                → Launch Dashboard
              </Button>
              <Button size="lg" variant="outline" className="font-mono text-sm px-6" onClick={() => navigate("/help")}>
                📖 Setup Guide
              </Button>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground pt-4">
              npm install · npm run dev · done
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

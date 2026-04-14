import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BarChart3, Search, TrendingUp, Zap, Bug, Target,
  ListChecks, Globe, FileText, Tag, Link2, Code2,
  ArrowRight, Shield, Clock, Layers, Download
} from "lucide-react";

const features = [
  { icon: BarChart3, title: "Multi-Run Analytics", desc: "Track test health across every run. Spot regressions before they reach production.", color: "bg-primary/10 text-primary" },
  { icon: Search, title: "Deep Run Inspection", desc: "Drill into any run — suite breakdowns, tag filters, error traces, test steps, and API payloads.", color: "bg-success/10 text-success" },
  { icon: TrendingUp, title: "Trend Intelligence", desc: "Pass rates, failure frequency, duration drift — all charted over time.", color: "bg-warning/10 text-warning" },
  { icon: Zap, title: "Flaky Test Detection", desc: "Automatically surfaces tests that pass on retry. Know which tests erode trust.", color: "bg-destructive/10 text-destructive" },
  { icon: Bug, title: "Defect Classification", desc: "Every failure auto-categorized as Product Defect, Test Defect, or Infrastructure.", color: "bg-accent text-accent-foreground" },
  { icon: Target, title: "Severity & Priority", desc: "5-level severity (Blocker → Trivial) auto-inferred from tags and error types.", color: "bg-primary/10 text-primary" },
  { icon: ListChecks, title: "Test Steps Breakdown", desc: "See exactly where a test failed with step-by-step execution traces.", color: "bg-success/10 text-success" },
  { icon: Globe, title: "Environment Comparison", desc: "Compare results across staging, production, and more. Spot env-specific failures.", color: "bg-warning/10 text-warning" },
  { icon: FileText, title: "Run, Suite, Test & Comparison Reports", desc: "Four distinct PDF exports — Run snapshots, Suite stability, Test health, and Run-vs-Run comparison.", color: "bg-primary/10 text-primary" },
  { icon: Tag, title: "Tag-Based Filtering", desc: "Slice your suite by @smoke, @critical, @regression — see pass rates per tag instantly.", color: "bg-destructive/10 text-destructive" },
  { icon: Link2, title: "ADO & Jira Integration", desc: "Push results to Azure DevOps Test Plans or auto-create Jira bugs for failures.", color: "bg-accent text-accent-foreground" },
  { icon: Code2, title: "Code Playground", desc: "Interactive config generator — pick test type, browsers, tags, and get ready-to-use code.", color: "bg-success/10 text-success" },
];

const whatsNew = [
  { tag: "NEW", title: "Run Comparison", desc: "Select any two past runs and compare them side by side — new failures, resolved tests, suite health deltas, and exportable PDF reports with custom run labels." },
  { tag: "NEW", title: "Test Explorer", desc: "Browse all unique tests across runs with aggregated pass rates, duration, flaky detection, sorting, and filtering by suite or tags." },
  { tag: "NEW", title: "Test-Level PDF Export", desc: "Export comprehensive reports for individual tests — health summary, failure analysis, duration trends, and status timeline." },
  { tag: "NEW", title: "Categorized Help Center", desc: "7-category guide system with search, difficulty badges, and an interactive Playground." },
  { tag: "IMPROVED", title: "Persistent Navigation", desc: "Top navigation stays visible on all pages — no more clicking back repeatedly from detail views." },
  { tag: "IMPROVED", title: "Enriched Test Data", desc: "Browser info, Playwright annotations, CI metadata (commit SHA, pipeline ID), and real-world error patterns." },
];

const steps = [
  { num: "01", title: "Run your Playwright tests", desc: "Use the built-in JSON reporter.", code: "npx playwright test --reporter=json > results.json" },
  { num: "02", title: "Drop into the dashboard", desc: "Drag & drop your results.json — single files, arrays, or folders.", code: null },
  { num: "03", title: "Get instant intelligence", desc: "Pass rates, failure classification, flaky tests, trends, and exportable reports.", code: null },
];

const principles = [
  { icon: Shield, title: "Privacy First", text: "Your test data never leaves your machine. Period." },
  { icon: Clock, title: "Instant Setup", text: "Drag-and-drop your results — analyzing tests in under 60 seconds." },
  { icon: Layers, title: "Zero Backend", text: "No database. No server. Runs entirely from local JSON files." },
  { icon: Download, title: "Export Ready", text: "Three levels of PDF reports — Run, Suite, and Test — tailored for any audience." },
];

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-success/5" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }} />
        <div className="container relative py-14 sm:py-24 lg:py-28">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="font-mono text-[11px] text-primary font-medium tracking-wide">Local-First · Zero Config · 15+ Capabilities</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.08]">
              Turn test results into
              <span className="block bg-gradient-to-r from-primary via-primary/80 to-success bg-clip-text text-transparent">
                actionable intelligence
              </span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Not another report viewer. An analytics dashboard that tells you <em>why</em> tests fail,
              <em> when</em> they started failing, and <em>what</em> to fix first.
            </p>
            <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
              <Button size="lg" className="font-mono text-sm gap-2" onClick={() => navigate("/")}>
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="font-mono text-sm" onClick={() => navigate("/help")}>
                Setup Guide
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-card/60">
        <div className="container py-6 sm:py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { val: "0", unit: "backends", label: "required" },
              { val: "<60s", unit: "", label: "to first insight" },
              { val: "15+", unit: "", label: "capabilities" },
              { val: "4", unit: "report types", label: "Run · Suite · Test · Compare" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-mono text-xl sm:text-2xl font-bold text-foreground">
                  {s.val}<span className="text-muted-foreground text-sm ml-0.5">{s.unit}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's New */}
      <section className="container py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-6">What's New</h2>
          <div className="space-y-3">
            {whatsNew.map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:bg-card/80 transition-colors">
                <span className={`shrink-0 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                  item.tag === "NEW" ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
                }`}>
                  {item.tag}
                </span>
                <div className="min-w-0">
                  <h3 className="font-mono text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="border-y bg-muted/20">
        <div className="container py-12 sm:py-16">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest">The Problem</h2>
            <p className="text-lg sm:text-xl text-foreground font-medium leading-relaxed">
              "Our tests are flaky." "Which tests broke?" "Is this a product bug or a test bug?"
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              CI gives you exit codes and a wall of red and green. But no one tells you the <em>story</em> behind
              your test suite — which tests just started failing, which have been flaky for weeks, whether it's
              infrastructure, a test defect, or an actual product bug.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Playwright Intelligence reads your results, classifies failures, tracks stability across runs,
              and surfaces the insights your team actually needs.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="container py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">Why Us</h2>
            <p className="text-xl sm:text-2xl font-bold text-foreground">Beyond traditional test reports</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
              Tools like Allure generate beautiful single-run HTML reports. But teams need more than pretty output — they need answers.
            </p>
          </div>

          {/* Comparison table */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="font-mono text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider p-3 sm:p-4">Capability</th>
                    <th className="font-mono text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider p-3 sm:p-4 text-center">Traditional Reports</th>
                    <th className="font-mono text-[10px] sm:text-xs uppercase tracking-wider p-3 sm:p-4 text-center text-primary">Playwright Intelligence</th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm">
                  {[
                    { cap: "Cross-run trend analysis", trad: false, us: true },
                    { cap: "Flaky test detection", trad: false, us: true },
                    { cap: "Defect classification (Product / Test / Infra)", trad: false, us: true },
                    { cap: "Auto severity inference", trad: false, us: true },
                    { cap: "Suite stability tracking", trad: false, us: true },
                    { cap: "Test-level health history & export", trad: false, us: true },
                    { cap: "Tag-based pass rate breakdown", trad: false, us: true },
                    { cap: "Environment comparison", trad: false, us: true },
                    { cap: "Zero setup — no server, no DB", trad: false, us: true },
                    { cap: "Privacy — data never leaves your machine", trad: "partial", us: true },
                    { cap: "Single-run HTML report", trad: true, us: true },
                    { cap: "Step-by-step execution traces", trad: true, us: true },
                  ].map((row) => (
                    <tr key={row.cap} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 sm:p-4 text-foreground">{row.cap}</td>
                      <td className="p-3 sm:p-4 text-center">
                        {row.trad === true ? (
                          <span className="text-success font-bold">✓</span>
                        ) : row.trad === "partial" ? (
                          <span className="text-warning font-bold">~</span>
                        ) : (
                          <span className="text-muted-foreground/40 font-bold">✗</span>
                        )}
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        <span className="text-success font-bold">✓</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pain points */}
          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            {[
              { icon: "🔄", title: "No history retention", desc: "Allure regenerates from scratch each run. Previous results are gone unless you maintain a separate Allure server." },
              { icon: "🔧", title: "Complex setup & maintenance", desc: "Requires custom reporters, plugins, and often a dedicated server to aggregate results across runs." },
              { icon: "🤷", title: "No root cause analysis", desc: "You see red tests but no classification — is it a product bug, flaky test, or CI timeout? You figure it out yourself." },
            ].map((p) => (
              <div key={p.title} className="p-4 rounded-xl border bg-card">
                <span className="text-lg">{p.icon}</span>
                <h3 className="font-mono text-xs font-semibold text-foreground mt-2 mb-1">{p.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground italic">
              Allure is a great tool for what it does. Playwright Intelligence picks up where single-run reports end.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-12 sm:py-16">
        <div className="text-center mb-10">
          <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">Capabilities</h2>
          <p className="text-xl sm:text-2xl font-bold text-foreground">Everything you need, nothing you don't</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {features.map((f) => (
            <div key={f.title} className="group rounded-xl border bg-card p-4 sm:p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <div className={`w-10 h-10 rounded-lg ${f.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-mono text-xs font-semibold text-foreground mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y bg-card/60">
        <div className="container py-12 sm:py-16">
          <div className="text-center mb-10">
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">How It Works</h2>
            <p className="text-xl sm:text-2xl font-bold text-foreground">Three steps. That's it.</p>
          </div>
          <div className="max-w-2xl mx-auto">
            {steps.map((item, i) => (
              <div key={item.num} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-mono text-xs font-bold shrink-0">
                    {item.num}
                  </div>
                  {i < steps.length - 1 && <div className="w-px flex-1 bg-border my-1.5" />}
                </div>
                <div className="pb-8 flex-1 min-w-0">
                  <h3 className="font-mono text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  {item.code && (
                    <pre className="font-mono text-[11px] bg-foreground/5 border rounded-lg p-2.5 mt-2 overflow-x-auto text-muted-foreground">
                      {item.code}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section className="container py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">Deep Visibility</h2>
            <p className="text-xl sm:text-2xl font-bold text-foreground">See everything. Miss nothing.</p>
          </div>
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/40" />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground ml-2">Test Detail — checkout › payment flow</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-md border bg-destructive/10 text-destructive border-destructive/20">🔴 Blocker</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-md border bg-warning/10 text-warning border-warning/20">🐛 Product Defect</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-md border bg-primary/10 text-primary border-primary/20">@critical</span>
              </div>
              <div className="rounded-md border p-3 space-y-1 font-mono text-[11px]">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Test Steps</div>
                {[
                  { ok: true, name: "Navigate to checkout", time: "245ms" },
                  { ok: true, name: "Fill shipping details", time: "180ms" },
                  { ok: true, name: "Select payment method", time: "95ms" },
                  { ok: false, name: "Complete payment", time: "5002ms" },
                ].map(s => (
                  <div key={s.name} className="flex items-center gap-2 py-0.5">
                    <span className={`font-bold ${s.ok ? "text-success" : "text-destructive"}`}>{s.ok ? "✓" : "✗"}</span>
                    <span className="text-foreground flex-1 text-[10px]">{s.name}</span>
                    <span className="text-muted-foreground text-[10px]">{s.time}</span>
                  </div>
                ))}
                <div className="text-destructive/70 text-[10px] ml-5 mt-1">TimeoutError: Payment gateway timeout 5000ms exceeded</div>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-1.5 py-0.5 rounded border text-[10px] font-bold">POST</span>
                  <span className="text-foreground text-[10px]">/api/v1/payments</span>
                  <span className="text-destructive font-bold text-[10px]">504</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="border-y bg-muted/20">
        <div className="container py-12 sm:py-16">
          <div className="text-center mb-8">
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">Principles</h2>
            <p className="text-xl sm:text-2xl font-bold text-foreground">Built different, on purpose</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
            {principles.map((p) => (
              <div key={p.title} className="flex gap-3 p-4 rounded-xl border bg-card">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <p.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-mono text-xs font-semibold text-foreground">{p.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="container py-14 sm:py-20 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-mono font-bold text-sm">PW</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Ready to understand your tests?</h2>
            <p className="text-xs text-muted-foreground">
              Start analyzing your Playwright results in under 60 seconds. No signup required.
            </p>
            <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
              <Button size="lg" className="font-mono text-sm gap-2" onClick={() => navigate("/")}>
                Launch Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="font-mono text-sm" onClick={() => navigate("/help")}>
                Setup Guide
              </Button>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground pt-2">
              Drop your results.json · instant insights · done
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

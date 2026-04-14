import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, Check, ArrowLeft, ChevronRight, Search } from "lucide-react";

/* ─── Reusable blocks ─── */

const CodeBlock = ({ children, title }: { children: string; title?: string }) => (
  <div className="rounded-lg border bg-muted/50 overflow-hidden">
    {title && <div className="px-4 py-2 border-b bg-muted text-xs font-mono text-muted-foreground">{title}</div>}
    <pre className="p-4 text-xs font-mono text-foreground overflow-x-auto whitespace-pre">{children}</pre>
  </div>
);

const Tip = ({ icon = "💡", variant = "primary", children }: { icon?: string; variant?: "primary" | "warning" | "success"; children: React.ReactNode }) => {
  const bg = variant === "warning" ? "bg-warning/10 border-warning/30" : variant === "success" ? "bg-success/10 border-success/30" : "bg-primary/5 border-primary/20";
  return (
    <div className={`flex items-start gap-2 p-3 rounded-md border ${bg}`}>
      <span className="text-sm">{icon}</span>
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  );
};

const SnippetBlock = ({ title, code }: { title: string; code: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-lg border bg-muted/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted">
        <span className="text-xs font-mono text-muted-foreground">{title}</span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1" onClick={handleCopy}>
          {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
        </Button>
      </div>
      <pre className="p-4 text-xs font-mono text-foreground overflow-x-auto whitespace-pre">{code}</pre>
    </div>
  );
};

/* ─── Guide data structure ─── */

interface GuideItem {
  id: string;
  icon: string;
  title: string;
  summary: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  content: React.ReactNode;
}

interface GuideCategory {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  guides: GuideItem[];
}

const difficultyColors: Record<string, string> = {
  Beginner: "text-success bg-success/10",
  Intermediate: "text-warning bg-warning/10",
  Advanced: "text-destructive bg-destructive/10",
};

/* Lazy wrapper to avoid block-scoped reference issue */
const PlaygroundGeneratorWrapper = () => <PlaygroundGenerator />;

/* ─── All guide content ─── */

const categories: GuideCategory[] = [
  {
    id: "getting-started",
    icon: "🚀",
    title: "Getting Started",
    description: "Setup, file formats, and importing your first results",
    color: "text-primary",
    guides: [
      {
        id: "quick-start",
        icon: "🚀",
        title: "Quick Start",
        summary: "Get your first results imported in under 2 minutes",
        difficulty: "Beginner",
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The fastest way to get started is using Playwright's built-in JSON reporter. No custom reporter needed!
            </p>
            <CodeBlock title="Run tests with JSON output">{`npx playwright test --reporter=json > results.json

# Or configure in playwright.config.ts:
export default defineConfig({
  reporter: [['json', { outputFile: 'results.json' }]],
});`}</CodeBlock>
            <Tip variant="success" icon="✅">
              <strong className="text-foreground">Just import the file!</strong> Drop <code className="font-mono bg-muted px-1 rounded">results.json</code> onto the dashboard. Native Playwright format is auto-detected.
            </Tip>
          </div>
        ),
      },
      {
        id: "formats",
        icon: "📁",
        title: "Supported File Formats",
        summary: "All import formats — single file, multi-run, folder, and flat arrays",
        difficulty: "Beginner",
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Multiple import formats are supported. Drop files or folders directly on the dashboard.
            </p>
            <Tip variant="success" icon="✅">
              <strong className="text-foreground">Playwright Native:</strong> Directly import JSON from <code className="font-mono bg-muted px-1 rounded">npx playwright test --reporter=json</code>. No custom reporter needed!
            </Tip>
            <CodeBlock title="Format 1: Single run file">{`{
  "manifest": { "runId": "run-001", "timestamp": "...", "branch": "main", ... },
  "results": [{ "id": "t-1", "name": "auth > login", "status": "passed", ... }]
}`}</CodeBlock>
            <CodeBlock title="Format 2: Multi-run array">{`[
  { "manifest": { ... }, "results": [ ... ] },
  { "manifest": { ... }, "results": [ ... ] }
]`}</CodeBlock>
            <CodeBlock title="Format 3: Folder structure">{`test-results/
├── manifest.json
├── auth.json
├── checkout.json
└── api.json`}</CodeBlock>
            <CodeBlock title="Format 4: Flat results array (manifest auto-generated)">{`[
  { "id": "t-1", "name": "auth > login", "suite": "auth", "status": "passed", ... },
  { "id": "t-2", "name": "checkout > add to cart", ... }
]`}</CodeBlock>
            <Tip icon="🔄" variant="success">
              <strong className="text-foreground">Persistence:</strong> Imported runs are saved to localStorage. They persist across reloads. Use "Reset Demo" to return to sample data.
            </Tip>
          </div>
        ),
      },
      {
        id: "schema",
        icon: "📋",
        title: "Schema Reference",
        summary: "Complete field-by-field reference for TestResult and TestStep",
        difficulty: "Intermediate",
        content: (
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">TestResult Fields</h3>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs font-mono">
                  <thead><tr className="bg-muted"><th className="text-left px-3 py-2 text-muted-foreground font-medium">Field</th><th className="text-left px-3 py-2 text-muted-foreground font-medium">Type</th><th className="text-left px-3 py-2 text-muted-foreground font-medium">Description</th></tr></thead>
                  <tbody className="divide-y">
                    {[
                      ["id", "string", "Unique test identifier"], ["name", "string", "Format: 'suite > test name'"], ["suite", "string", "Top-level describe() group"],
                      ["file", "string", "Source file path"], ["status", "enum", "'passed' | 'failed' | 'skipped'"], ["duration", "number", "Milliseconds"],
                      ["retries", "number", "Retry attempts"], ["tags", "string[]", "Tag labels"], ["error", "string?", "Error + stack trace"],
                      ["logs", "string[]?", "Console output"], ["apiPayload", "ApiPayload?", "API request/response"], ["severity", "Severity?", "'blocker'|'critical'|'normal'|'minor'|'trivial'"],
                      ["defectCategory", "DefectCategory?", "'product'|'test'|'infrastructure'|'unknown'"], ["steps", "TestStep[]?", "Step-by-step breakdown"],
                    ].map(([field, type, desc]) => (
                      <tr key={field} className="hover:bg-muted/30"><td className="px-3 py-2 text-foreground">{field}</td><td className="px-3 py-2 text-muted-foreground">{type}</td><td className="px-3 py-2 text-muted-foreground font-sans">{desc}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">TestStep Fields</h3>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs font-mono">
                  <thead><tr className="bg-muted"><th className="text-left px-3 py-2 text-muted-foreground font-medium">Field</th><th className="text-left px-3 py-2 text-muted-foreground font-medium">Type</th><th className="text-left px-3 py-2 text-muted-foreground font-medium">Description</th></tr></thead>
                  <tbody className="divide-y">
                    {[["name", "string", "Step description"], ["status", "TestStatus", "'passed' | 'failed' | 'skipped'"], ["duration", "number", "Step duration in ms"], ["error", "string?", "Error if step failed"], ["steps", "TestStep[]?", "Nested sub-steps"]].map(([field, type, desc]) => (
                      <tr key={field} className="hover:bg-muted/30"><td className="px-3 py-2 text-foreground">{field}</td><td className="px-3 py-2 text-muted-foreground">{type}</td><td className="px-3 py-2 text-muted-foreground font-sans">{desc}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "test-authoring",
    icon: "✍️",
    title: "Test Authoring",
    description: "Suites, tags, severity, steps, naming — write tests the dashboard loves",
    color: "text-warning",
    guides: [
      {
        id: "suites",
        icon: "📂",
        title: "Structuring Test Suites",
        summary: "Map describe() blocks to suites for clean organization",
        difficulty: "Beginner",
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Each <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">describe()</code> block maps to a suite.
            </p>
            <CodeBlock title="tests/auth.spec.ts">{`import { test, expect } from '@playwright/test';

test.describe('auth', () => {
  test('login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'user@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('login with invalid password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'user@example.com');
    await page.fill('#password', 'wrong');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error')).toBeVisible();
  });
});`}</CodeBlock>
            <Tip><strong className="text-foreground">Best practice:</strong> Keep suite names lowercase and descriptive. Use one file per suite for clean file-based grouping.</Tip>
          </div>
        ),
      },
      {
        id: "tags",
        icon: "🏷️",
        title: "Using Tags for Filtering",
        summary: "Tag tests and suites for flexible filtering and reporting",
        difficulty: "Beginner",
        content: (
          <div className="space-y-4">
            <CodeBlock title="tests/checkout.spec.ts">{`// Tag individual tests
test('add to cart', { tag: ['@smoke', '@critical'] }, async ({ page }) => {
  await page.goto('/products');
  await page.click('.add-to-cart');
  await expect(page.locator('.cart-count')).toHaveText('1');
});

// Tag an entire suite
test.describe('payment', { tag: '@regression' }, () => {
  test('payment success', async ({ page }) => { /* Inherits @regression */ });
  test('payment failure', { tag: '@critical' }, async ({ page }) => { /* Both @regression + @critical */ });
});`}</CodeBlock>
            <div className="flex flex-wrap gap-2">
              {[{ tag: "@smoke", desc: "Quick sanity" }, { tag: "@critical", desc: "Must-pass" }, { tag: "@regression", desc: "Full suite" }, { tag: "@ui", desc: "Visual tests" }, { tag: "@api", desc: "API tests" }, { tag: "@flaky", desc: "Known flaky" }].map(({ tag, desc }) => (
                <div key={tag} className="flex items-center gap-1.5 px-2 py-1 rounded-md border bg-muted/50">
                  <Badge variant="outline" className="font-mono text-[10px]">{tag}</Badge>
                  <span className="text-[10px] text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "severity",
        icon: "🎯",
        title: "Severity Levels",
        summary: "Prioritize failures with blocker/critical/normal/minor/trivial",
        difficulty: "Intermediate",
        content: (
          <div className="space-y-4">
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs font-mono">
                <thead><tr className="bg-muted"><th className="text-left px-3 py-2 text-muted-foreground font-medium">Level</th><th className="text-left px-3 py-2 text-muted-foreground font-medium">Icon</th><th className="text-left px-3 py-2 text-muted-foreground font-medium">When to Use</th></tr></thead>
                <tbody className="divide-y">
                  {[["Blocker", "🔴", "Blocks release — critical path broken"], ["Critical", "🟠", "Major feature broken — must fix before release"], ["Normal", "🟡", "Standard priority — typical assertions"], ["Minor", "🔵", "Low impact — cosmetic, edge cases"], ["Trivial", "⚪", "Minimal impact — nice-to-fix"]].map(([level, icon, desc]) => (
                    <tr key={level} className="hover:bg-muted/30"><td className="px-3 py-2 text-foreground font-semibold">{level}</td><td className="px-3 py-2">{icon}</td><td className="px-3 py-2 text-muted-foreground font-sans">{desc}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CodeBlock title="Setting severity via tags">{`// Explicit severity tags (highest priority)
test('login flow', { tag: ['@critical'] }, async ({ page }) => { ... });

// Playwright annotations (also supported)
test('checkout', async ({ page }) => {
  test.info().annotations.push({ type: 'severity', description: 'blocker' });
});

// Auto-inference: @smoke/@p0 → critical, @regression/@p1 → normal`}</CodeBlock>
          </div>
        ),
      },
      {
        id: "test-steps",
        icon: "📝",
        title: "Test Steps",
        summary: "Break tests into steps for detailed failure pinpointing",
        difficulty: "Beginner",
        content: (
          <div className="space-y-4">
            <CodeBlock title="Using test.step() for detailed breakdown">{`test('complete checkout flow', async ({ page }) => {
  await test.step('Navigate to products', async () => {
    await page.goto('/products');
    await expect(page.locator('.product-grid')).toBeVisible();
  });
  await test.step('Add item to cart', async () => {
    await page.click('.product-card:first-child .add-btn');
    await expect(page.locator('.cart-badge')).toHaveText('1');
  });
  await test.step('Complete purchase', async () => {
    await page.click('#pay-btn');
    await expect(page.locator('.success-message')).toBeVisible();
  });
});`}</CodeBlock>
            <div className="rounded-lg border overflow-hidden">
              <div className="px-4 py-2 bg-muted border-b text-xs font-mono text-muted-foreground">Step Rendering Preview</div>
              <div className="p-3 space-y-0.5 bg-muted/20 font-mono text-[11px]">
                {[["✓", "text-success", "Navigate to products", "245ms"], ["✓", "text-success", "Add item to cart", "180ms"], ["✗", "text-destructive", "Complete purchase", "50ms"]].map(([icon, cls, name, time]) => (
                  <div key={name} className="flex items-center gap-2 py-0.5">
                    <span className={`${cls} font-bold`}>{icon}</span>
                    <span className="text-foreground flex-1">{name}</span>
                    <span className="text-muted-foreground">{time}</span>
                  </div>
                ))}
                <div className="text-destructive/70 text-[10px] ml-4">Element not found: #pay-btn</div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "naming",
        icon: "✏️",
        title: "Naming Conventions",
        summary: "Best practices for test and suite naming",
        difficulty: "Beginner",
        content: (
          <div className="space-y-4">
            <CodeBlock title="Recommended naming">{`// ✅ Good — clear suite > test pattern
test.describe('auth', () => {
  test('login with valid credentials', ...);
});
// Produces: "auth > login with valid credentials"

// ✅ Good — nested describes
test.describe('checkout', () => {
  test.describe('cart', () => {
    test('add item', ...);
  });
});
// Produces: "checkout > cart > add item"

// ❌ Avoid — redundant suite name in test
test.describe('auth', () => {
  test('auth login works', ...); // "auth" is duplicated
});`}</CodeBlock>
          </div>
        ),
      },
    ],
  },
  {
    id: "analysis",
    icon: "🔬",
    title: "Analysis & Debugging",
    description: "Defect categories, failure analysis, environments, logs, and retries",
    color: "text-destructive",
    guides: [
      {
        id: "defect-categories",
        icon: "🐛",
        title: "Defect Categories",
        summary: "Understand product, test, and infrastructure defect classification",
        difficulty: "Intermediate",
        content: (
          <div className="space-y-4">
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs font-mono">
                <thead><tr className="bg-muted"><th className="text-left px-3 py-2 text-muted-foreground font-medium">Category</th><th className="text-left px-3 py-2 text-muted-foreground font-medium">Meaning</th><th className="text-left px-3 py-2 text-muted-foreground font-medium">Example</th></tr></thead>
                <tbody className="divide-y">
                  {[["🐛 Product Defect", "Actual app bugs", "AssertionError, expected X got Y"], ["🔧 Test Defect", "Test code issues", "TypeError, ReferenceError"], ["🏗️ Infrastructure", "Environment problems", "TimeoutError, net::ERR, 502"], ["❓ Unclassified", "Needs review", "Generic errors"]].map(([cat, meaning, example]) => (
                    <tr key={cat} className="hover:bg-muted/30"><td className="px-3 py-2 text-foreground font-sans">{cat}</td><td className="px-3 py-2 text-muted-foreground font-sans">{meaning}</td><td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">{example}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CodeBlock title="Writing classifiable errors">{`// ✅ Product defect — assertion failure
await expect(page.locator('.price')).toHaveText('$49.99');

// ✅ Test defect — caught as script error  
const title = await page.locator('.missing').textContent();

// ✅ Infrastructure — caught as timeout
await page.locator('.slow-btn').click({ timeout: 5000 });`}</CodeBlock>
          </div>
        ),
      },
      {
        id: "failure-analysis",
        icon: "🔬",
        title: "Failure Cause Analysis & Trends",
        summary: "How failure causes are detected and surfaced on test detail pages",
        difficulty: "Intermediate",
        content: (
          <div className="space-y-4">
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs font-mono">
                <thead><tr className="bg-muted"><th className="text-left px-3 py-2 text-muted-foreground font-medium">Category</th><th className="text-left px-3 py-2 text-muted-foreground font-medium">Detected By</th><th className="text-left px-3 py-2 text-muted-foreground font-medium">Example</th></tr></thead>
                <tbody className="divide-y">
                  {[["⏱️ Timeout", "\"Timeout\" in error", "TimeoutError: Timeout 30000ms"], ["🌐 Network", "\"net::ERR\", \"502\"", "net::ERR_CONNECTION_REFUSED"], ["🔍 Element Not Found", "\"not found\"", "Element not found: #email"], ["🔀 State Mismatch", "\"expected\" + URL/text", "expected URL \"/dash\" got \"/login\""], ["💥 Script Error", "\"TypeError\"", "Cannot read properties of null"], ["❌ Assertion", "\"assert\" in error", "expected element to be visible"]].map(([cat, detection, example]) => (
                    <tr key={cat} className="hover:bg-muted/30"><td className="px-3 py-2 text-foreground font-sans">{cat}</td><td className="px-3 py-2 text-muted-foreground">{detection}</td><td className="px-3 py-2 text-destructive/70 truncate max-w-[200px]">{example}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Tip variant="success" icon="📊">
              <strong className="text-foreground">What you get:</strong> Status Timeline, Failure Cause Analysis with frequency, sample errors, and actionable fix suggestions — all on each test's detail page.
            </Tip>
          </div>
        ),
      },
      {
        id: "environments",
        icon: "🌐",
        title: "Environment Comparison",
        summary: "Configure and compare test results across staging/production",
        difficulty: "Intermediate",
        content: (
          <div className="space-y-4">
            <CodeBlock title="Setting environment in your config">{`// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'staging', use: { baseURL: 'https://staging.example.com' } },
    { name: 'production', use: { baseURL: 'https://www.example.com' } },
  ],
});`}</CodeBlock>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[{ env: "staging", pass: 45, fail: 5, skip: 2 }, { env: "production", pass: 48, fail: 2, skip: 2 }].map(({ env, pass, fail, skip }) => (
                <div key={env} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-foreground">{env}</span>
                    <span className={`font-mono text-xs font-bold ${Math.round((pass / (pass + fail + skip)) * 100) >= 95 ? "text-success" : "text-warning"}`}>
                      {Math.round((pass / (pass + fail + skip)) * 100)}%
                    </span>
                  </div>
                  <div className="flex gap-2 text-[10px] font-mono text-muted-foreground">
                    <span className="text-success">{pass} ✓</span>
                    <span className="text-destructive">{fail} ✗</span>
                    <span>{skip} ⊘</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "logs",
        icon: "📝",
        title: "Console Logs & Error Rendering",
        summary: "Structured log prefixes for beautiful console output",
        difficulty: "Beginner",
        content: (
          <div className="space-y-4">
            <CodeBlock title="Structured log prefixes">{`test('checkout flow', async ({ page }) => {
  console.log('[INFO] Starting checkout flow');
  console.log('[WARN] Slow response detected (2500ms)');
  console.log('[ERROR] Payment gateway timeout');
  console.log('[DEBUG] Cart state: {items: 3, total: 49.99}');
});`}</CodeBlock>
            <div className="rounded-lg border overflow-hidden">
              <div className="px-4 py-2 bg-muted border-b text-xs font-mono text-muted-foreground">Rendering Preview</div>
              <div className="p-3 space-y-1 bg-muted/20 font-mono text-xs">
                <p className="text-muted-foreground">[INFO] Starting checkout flow</p>
                <p className="text-warning">[WARN] Slow response detected (2500ms)</p>
                <p className="text-destructive font-medium">[ERROR] Payment gateway timeout</p>
                <p className="text-muted-foreground/60">[DEBUG] Cart state: {"{ items: 3, total: 49.99 }"}</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "retries",
        icon: "⚡",
        title: "Retries & Flaky Detection",
        summary: "Configure retries and understand flaky test detection",
        difficulty: "Beginner",
        content: (
          <div className="space-y-4">
            <CodeBlock title="playwright.config.ts">{`export default defineConfig({
  retries: 2,  // Retry failed tests up to 2 times
  projects: [
    { name: 'chromium', retries: process.env.CI ? 2 : 0 },
  ],
});`}</CodeBlock>
            <Tip variant="warning" icon="⚡">
              <strong className="text-foreground">Flaky detection:</strong> A test is marked flaky if it has retries &gt; 0 across 2+ runs. The Insights panel surfaces the most flaky tests with fix recommendations.
            </Tip>
          </div>
        ),
      },
    ],
  },
  {
    id: "reporting",
    icon: "📄",
    title: "Reporting & Exports",
    description: "Run reports, suite reports, test exports, comparison reports, and API payloads",
    color: "text-success",
    guides: [
      {
        id: "reports",
        icon: "📄",
        title: "Run Reports vs Suite Reports",
        summary: "When to use single-run snapshots vs multi-run suite analysis",
        difficulty: "Beginner",
        content: (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2"><span className="text-lg">📋</span><h3 className="text-sm font-semibold text-foreground">Run Report</h3></div>
                <p className="text-[11px] text-muted-foreground"><strong className="text-foreground">Snapshot of a single CI execution</strong></p>
                <div className="space-y-1 text-[10px] text-muted-foreground">
                  <p>✓ Summary stats (pass/fail/skip)</p><p>✓ Suite breakdown</p><p>✓ Tag summary & duration</p><p>✓ Full test results with errors</p>
                </div>
                <div className="rounded bg-muted/50 p-2 text-[10px] text-muted-foreground"><strong className="text-foreground">Best for:</strong> CI/CD reports, release sign-offs</div>
              </div>
              <div className="rounded-lg border p-4 space-y-2 border-primary/30">
                <div className="flex items-center gap-2"><span className="text-lg">📂</span><h3 className="text-sm font-semibold text-foreground">Suite Report</h3></div>
                <p className="text-[11px] text-muted-foreground"><strong className="text-foreground">Stability story across multiple runs</strong></p>
                <div className="space-y-1 text-[10px] text-muted-foreground">
                  <p>🛡️ Stability score & heatmap</p><p>📈 Pass rate trend</p><p>🔀 Cross-run comparison</p><p>⚡ Flaky tests with rates</p>
                </div>
                <div className="rounded bg-primary/5 p-2 text-[10px] text-muted-foreground"><strong className="text-foreground">Best for:</strong> Sprint reviews, quality health checks</div>
              </div>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <div className="px-4 py-2 bg-muted border-b text-xs font-mono text-muted-foreground">Quick Comparison</div>
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/50"><th className="text-left px-3 py-2 text-muted-foreground font-medium">Feature</th><th className="text-center px-3 py-2 text-muted-foreground font-medium">Run</th><th className="text-center px-3 py-2 text-muted-foreground font-medium">Suite</th></tr></thead>
                <tbody className="divide-y font-mono">
                  {[["Data scope", "Single run", "Multiple runs"], ["Stability score", "—", "✓"], ["Cross-run comparison", "—", "✓"], ["Flaky detection", "—", "✓"], ["Failure patterns", "—", "✓"], ["Suite breakdown", "✓", "—"], ["Scope control", "Fixed (1 run)", "All / Last 5 / 10"]].map(([f, r, s]) => (
                    <tr key={f} className="hover:bg-muted/30">
                      <td className="px-3 py-1.5 text-foreground font-sans">{f}</td>
                      <td className="px-3 py-1.5 text-center">{r === "✓" ? <span className="text-success">✓</span> : r === "—" ? <span className="text-muted-foreground">—</span> : <span className="text-muted-foreground">{r}</span>}</td>
                      <td className="px-3 py-1.5 text-center">{s === "✓" ? <span className="text-success">✓</span> : s === "—" ? <span className="text-muted-foreground">—</span> : <span className="text-muted-foreground">{s}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ),
      },
      {
        id: "api-payloads",
        icon: "🔗",
        title: "API Request & Response Payloads",
        summary: "Attach API call details to tests for dashboard visibility",
        difficulty: "Intermediate",
        content: (
          <div className="space-y-4">
            <CodeBlock title="Capturing API calls">{`test('POST /orders', { tag: ['@api'] }, async ({ request }) => {
  const payload = { productId: 'sku-123', quantity: 2 };
  const response = await request.post('/api/v1/orders', { data: payload });
  const body = await response.json();

  test.info().attach('api-payload', {
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify({
      method: 'POST', url: '/api/v1/orders',
      statusCode: response.status(),
      requestBody: payload, responseBody: body, latency: 230,
    })),
  });
  expect(response.ok()).toBeTruthy();
});`}</CodeBlock>
          </div>
        ),
      },
      {
        id: "reporter",
        icon: "🔌",
        title: "Custom Playwright Reporter",
        summary: "Build a reporter that outputs dashboard-compatible JSON",
        difficulty: "Advanced",
        content: (
          <div className="space-y-4">
            <CodeBlock title="reporters/dashboard-reporter.ts">{`import { Reporter, TestCase, TestResult as PWResult, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

class DashboardReporter implements Reporter {
  private results: any[] = [];
  private startTime = Date.now();
  
  onTestEnd(test: TestCase, result: PWResult) {
    const suite = test.parent.title || 'default';
    this.results.push({
      id: test.id,
      name: \`\${suite} > \${test.title}\`,
      suite,
      file: path.relative(process.cwd(), test.location.file),
      status: result.status === 'timedOut' ? 'failed' : result.status,
      duration: result.duration,
      retries: result.retry,
      tags: test.tags.map(t => t.replace('@', '')),
      error: result.error?.message ? \`\${result.error.message}\\n\${result.error.stack || ''}\` : undefined,
      logs: result.stdout.map(s => s.toString().trim()).filter(Boolean),
      steps: result.steps.map(s => ({
        name: s.title, status: s.error ? 'failed' : 'passed',
        duration: s.duration, error: s.error?.message,
      })),
    });
  }
  
  onEnd(result: FullResult) {
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    
    const output = {
      manifest: {
        runId: \`run-\${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}\`,
        timestamp: new Date().toISOString(),
        branch: process.env.GIT_BRANCH || 'unknown',
        environment: process.env.TEST_ENV || 'local',
        total: this.results.length, passed, failed, skipped,
        duration: Math.round((Date.now() - this.startTime) / 1000),
      },
      results: this.results,
    };
    
    const outDir = process.env.REPORT_OUTPUT || 'test-results';
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, \`run-\${Date.now()}.json\`), JSON.stringify(output, null, 2));
  }
}
export default DashboardReporter;`}</CodeBlock>
            <Tip><strong className="text-foreground">CI Integration:</strong> Set <code className="font-mono bg-muted px-1 rounded">GIT_BRANCH</code> and <code className="font-mono bg-muted px-1 rounded">TEST_ENV</code> env vars in CI to auto-tag runs.</Tip>
          </div>
        ),
      },
      {
        id: "test-export",
        icon: "🧪",
        title: "Test-Level PDF Export",
        summary: "Export individual test health reports with history, failure analysis, and duration trends",
        difficulty: "Beginner",
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Navigate to any test detail page and click <strong className="text-foreground">Export</strong> to generate a comprehensive PDF covering that test's full lifecycle.
            </p>
            <div className="rounded-lg border overflow-hidden">
              <div className="px-4 py-2 bg-muted border-b text-xs font-mono text-muted-foreground">What's Included</div>
              <div className="p-3 space-y-1.5 text-xs text-muted-foreground">
                <p>✓ <strong className="text-foreground">Health Summary</strong> — latest status, pass rate, average duration, run count</p>
                <p>✓ <strong className="text-foreground">Status Timeline</strong> — visual pass/fail history across runs</p>
                <p>✓ <strong className="text-foreground">Failure Analysis</strong> — error categories, frequency, sample messages</p>
                <p>✓ <strong className="text-foreground">Duration Trends</strong> — track performance regressions over time</p>
                <p>✓ <strong className="text-foreground">Flaky Indicator</strong> — flagged if the test has both passed and failed</p>
              </div>
            </div>
            <Tip variant="success" icon="📄">
              <strong className="text-foreground">Customizable:</strong> Toggle sections on/off, set organization name, add custom notes, choose color/grayscale, and pick page size — just like run and suite exports.
            </Tip>
          </div>
        ),
      },
      {
        id: "comparison-export",
        icon: "⚖️",
        title: "Run Comparison & Export",
        summary: "Compare any two runs side by side and export a detailed diff report",
        difficulty: "Intermediate",
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use the <strong className="text-foreground">Compare</strong> page to select any two past runs — even weeks apart — and see exactly what changed.
            </p>
            <div className="rounded-lg border overflow-hidden">
              <div className="px-4 py-2 bg-muted border-b text-xs font-mono text-muted-foreground">Comparison Highlights</div>
              <div className="p-3 space-y-1.5 text-xs text-muted-foreground">
                <p>🔴 <strong className="text-foreground">New Failures</strong> — tests that passed in Run A but failed in Run B</p>
                <p>🟢 <strong className="text-foreground">Resolved</strong> — tests that were failing in Run A but now pass</p>
                <p>🟠 <strong className="text-foreground">Persistent Failures</strong> — tests failing in both runs</p>
                <p>🆕 <strong className="text-foreground">New & Removed Tests</strong> — added or deleted between runs</p>
                <p>📊 <strong className="text-foreground">Suite Health Table</strong> — per-suite pass/fail delta</p>
              </div>
            </div>
            <Tip icon="🏷️">
              <strong className="text-foreground">Custom run labels:</strong> In the export settings, give each run a custom name (e.g. "Sprint 12 Release" vs "Sprint 13 Hotfix") — they appear in the PDF header instead of raw run IDs.
            </Tip>
          </div>
        ),
      },
    ],
  },
  {
    id: "snippets",
    icon: "💻",
    title: "Code Snippets & Examples",
    description: "Copy-paste-ready recipes for UI, API, and integration testing",
    color: "text-primary",
    guides: [
      {
        id: "snippets-ui",
        icon: "🖥️",
        title: "UI Automation Examples",
        summary: "Login POM, data-driven forms, visual regression, file ops, OAuth popup",
        difficulty: "Intermediate",
        content: (
          <div className="space-y-4">
            <SnippetBlock title="Login with Page Object Model" code={`// pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitBtn = page.locator('button[type="submit"]');
  }

  async goto() { await this.page.goto('/login'); }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitBtn.click();
  }
}

// tests/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('auth', () => {
  test('successful login', { tag: ['@smoke', '@critical'] }, async ({ page }) => {
    test.info().annotations.push({ type: 'severity', description: 'critical' });

    await test.step('Navigate to login page', async () => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
    });

    await test.step('Enter credentials and submit', async () => {
      const loginPage = new LoginPage(page);
      await loginPage.login('admin@test.com', 'password123');
    });

    await test.step('Verify redirect to dashboard', async () => {
      await expect(page).toHaveURL('/dashboard');
    });
  });
});`} />
            <SnippetBlock title="Data-Driven Form Validation" code={`const invalidInputs = [
  { field: 'email', value: 'not-an-email', error: 'Invalid email format' },
  { field: 'phone', value: '123', error: 'Phone must be 10 digits' },
  { field: 'zip', value: 'abcde', error: 'Invalid zip code' },
];

for (const { field, value, error } of invalidInputs) {
  test(\`validation: \${field} rejects "\${value}"\`, {
    tag: ['@regression', '@ui'],
  }, async ({ page }) => {
    await page.goto('/register');
    await page.fill(\`[name="\${field}"]\`, value);
    await page.click('button[type="submit"]');
    await expect(page.locator(\`[data-error="\${field}"]\`)).toHaveText(error);
  });
}`} />
            <SnippetBlock title="Visual Regression + Responsive" code={`test.describe('visual', { tag: '@visual' }, () => {
  test('dashboard screenshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixelRatio: 0.01, fullPage: true,
    });
  });

  test('mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await expect(page.locator('.sidebar')).not.toBeVisible();
    await expect(page.locator('.mobile-menu')).toBeVisible();
  });
});`} />
            <SnippetBlock title="File Upload & Download" code={`import path from 'path';

test.describe('file-ops', { tag: '@regression' }, () => {
  test('upload CSV', async ({ page }) => {
    await page.goto('/import');
    await page.locator('input[type="file"]').setInputFiles(
      path.join(__dirname, 'fixtures/data.csv')
    );
    await expect(page.locator('.row-count')).toHaveText('150 rows');
  });

  test('download PDF', async ({ page }) => {
    await page.goto('/reports/123');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-pdf'),
    ]);
    expect(download.suggestedFilename()).toMatch(/\\.pdf$/);
  });
});`} />
            <SnippetBlock title="Multi-Tab & Popup (OAuth)" code={`test('OAuth popup login', { tag: ['@smoke'] }, async ({ page, context }) => {
  await page.goto('/login');
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    page.click('#google-login'),
  ]);
  await popup.waitForLoadState();
  await popup.fill('#identifierId', 'test@gmail.com');
  await popup.click('#identifierNext');
  await page.waitForURL('/dashboard');
  await expect(page.locator('.user-avatar')).toBeVisible();
});`} />
          </div>
        ),
      },
      {
        id: "snippets-api",
        icon: "🔗",
        title: "API Automation Examples",
        summary: "CRUD, auth tokens, schema validation, GraphQL, performance",
        difficulty: "Intermediate",
        content: (
          <div className="space-y-4">
            <SnippetBlock title="CRUD API Testing" code={`test.describe('users-api', { tag: ['@api', '@critical'] }, () => {
  let userId: string;

  test('POST /api/users — create', async ({ request }) => {
    test.info().annotations.push({ type: 'severity', description: 'critical' });

    const res = await request.post('/api/users', {
      data: { name: 'Jane Doe', email: 'jane@test.com', role: 'admin' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    userId = body.id;

    // Attach API payload for dashboard visibility
    test.info().attach('api-payload', {
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify({
        method: 'POST', url: '/api/users',
        statusCode: 201, requestBody: { name: 'Jane Doe', email: 'jane@test.com' },
        responseBody: body,
      })),
    });
  });

  test('GET /api/users/:id — fetch', async ({ request }) => {
    const res = await request.get(\`/api/users/\${userId}\`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.email).toBe('jane@test.com');

    test.info().attach('api-payload', {
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify({
        method: 'GET', url: \`/api/users/\${userId}\`,
        statusCode: 200, responseBody: body,
      })),
    });
  });

  test('DELETE /api/users/:id — remove', async ({ request }) => {
    expect((await request.delete(\`/api/users/\${userId}\`)).status()).toBe(204);
    expect((await request.get(\`/api/users/\${userId}\`)).status()).toBe(404);
  });
});`} />
            <SnippetBlock title="Auth Token & Protected Endpoints" code={`let authToken: string;

test.beforeAll(async ({ request }) => {
  const res = await request.post('/api/auth/login', {
    data: { email: 'admin@test.com', password: 'secret' },
  });
  authToken = (await res.json()).token;
});

test.describe('protected-api', { tag: ['@api'] }, () => {
  test('with auth → 200', async ({ request }) => {
    const res = await request.get('/api/orders', {
      headers: { Authorization: \`Bearer \${authToken}\` },
    });
    expect(res.status()).toBe(200);
  });

  test('without auth → 401', async ({ request }) => {
    expect((await request.get('/api/orders')).status()).toBe(401);
  });
});`} />
            <SnippetBlock title="Schema Validation" code={`function validateSchema(obj: any, schema: Record<string, string>) {
  for (const [key, type] of Object.entries(schema)) {
    expect(typeof obj[key], \`\${key} should be \${type}\`).toBe(type);
  }
}

test('GET /api/products — matches schema', { tag: ['@api'] }, async ({ request }) => {
  const products = await (await request.get('/api/products')).json();
  for (const p of products.slice(0, 5)) {
    validateSchema(p, { id: 'string', name: 'string', price: 'number', inStock: 'boolean' });
    expect(p.price).toBeGreaterThan(0);
  }
});`} />
            <SnippetBlock title="GraphQL API Testing" code={`test.describe('graphql', { tag: ['@api'] }, () => {
  test('query users', async ({ request }) => {
    const res = await request.post('/graphql', {
      data: { query: '{ users(limit: 10) { id name email } }' },
    });
    const { data, errors } = await res.json();
    expect(errors).toBeUndefined();
    expect(data.users.length).toBeLessThanOrEqual(10);
  });

  test('mutation create post', async ({ request }) => {
    const res = await request.post('/graphql', {
      data: {
        query: 'mutation($i: PostInput!) { createPost(input: $i) { id title } }',
        variables: { i: { title: 'Test', body: 'Hello' } },
      },
    });
    expect((await res.json()).data.createPost.title).toBe('Test');
  });
});`} />
            <SnippetBlock title="Performance Assertions" code={`test('GET /api/health — under 500ms', { tag: ['@api', '@smoke'] }, async ({ request }) => {
  test.info().annotations.push({ type: 'severity', description: 'blocker' });

  const start = Date.now();
  const res = await request.get('/api/health');
  const latency = Date.now() - start;
  const body = await res.json();

  await test.step('Verify status and latency', async () => {
    expect(res.status()).toBe(200);
    expect(latency).toBeLessThan(500);
  });

  test.info().attach('api-payload', {
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify({
      method: 'GET', url: '/api/health', statusCode: 200, latency,
      responseBody: body,
    })),
  });
});`} />
          </div>
        ),
      },
      {
        id: "snippets-integration",
        icon: "🔄",
        title: "Integration & E2E Patterns",
        summary: "API setup → UI verification, database seeding with fixtures",
        difficulty: "Advanced",
        content: (
          <div className="space-y-4">
            <SnippetBlock title="API Setup → UI Verification (Hybrid)" code={`test('create via API, verify in UI', {
  tag: ['@e2e', '@critical'],
}, async ({ page, request }) => {
  test.info().annotations.push({ type: 'severity', description: 'critical' });

  const res = await request.post('/api/products', {
    data: { name: 'Widget Pro', price: 29.99, category: 'gadgets' },
  });
  const { id } = await res.json();

  test.info().attach('api-payload', {
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify({
      method: 'POST', url: '/api/products', statusCode: res.status(),
      requestBody: { name: 'Widget Pro', price: 29.99 },
      responseBody: { id },
    })),
  });

  await test.step('Verify product appears in UI', async () => {
    await page.goto('/products');
    await page.fill('.search-input', 'Widget Pro');
    await expect(page.locator(\`[data-product-id="\${id}"]\`)).toBeVisible();
    await expect(page.locator(\`[data-product-id="\${id}"] .price\`)).toHaveText('$29.99');
  });

  await request.delete(\`/api/products/\${id}\`);
});`} />
            <SnippetBlock title="Database Seeding with Fixtures" code={`import { test as base, expect } from '@playwright/test';

const test = base.extend<{ testUser: { email: string; password: string } }>({
  testUser: async ({ request }, use) => {
    const user = { email: \`test-\${Date.now()}@e2e.com\`, password: 'Test123!' };
    await request.post('/api/test/seed-user', { data: user });
    await use(user);
    await request.delete('/api/test/cleanup', { data: { email: user.email } });
  },
});

test('new user onboarding', async ({ page, testUser }) => {
  await page.goto('/login');
  await page.fill('#email', testUser.email);
  await page.fill('#password', testUser.password);
  await page.click('button[type="submit"]');
  await expect(page.locator('.onboarding-wizard')).toBeVisible();
});`} />
          </div>
        ),
      },
    ],
  },
  {
    id: "ci-cd",
    icon: "🔄",
    title: "CI/CD & Tool Integrations",
    description: "Push results to Azure DevOps, Jira, and CI pipelines",
    color: "text-muted-foreground",
    guides: [
      {
        id: "ado-integration",
        icon: "🔷",
        title: "Azure DevOps — Update Test Runs",
        summary: "Publish individual results and suite runs to ADO Test Plans",
        difficulty: "Advanced",
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Push individual test results or full suite runs to Azure DevOps Test Plans after Playwright execution.
            </p>
            <SnippetBlock title="scripts/publish-to-ado.ts — Individual Test Results" code={`import * as fs from 'fs';

const ORG = process.env.ADO_ORG!;         // e.g. 'my-org'
const PROJECT = process.env.ADO_PROJECT!;  // e.g. 'MyProject'
const PAT = process.env.ADO_PAT!;          // Personal Access Token
const PLAN_ID = process.env.ADO_PLAN_ID!;  // Test Plan ID
const SUITE_ID = process.env.ADO_SUITE_ID!;

const BASE = \`https://dev.azure.com/\${ORG}/\${PROJECT}/_apis/test\`;
const AUTH = \`Basic \${Buffer.from(':' + PAT).toString('base64')}\`;
const HEADERS = { Authorization: AUTH, 'Content-Type': 'application/json' };

interface PlaywrightResult {
  manifest: { runId: string; timestamp: string; total: number; passed: number; failed: number };
  results: Array<{ id: string; name: string; status: string; duration: number; error?: string }>;
}

async function publishToADO() {
  const report: PlaywrightResult = JSON.parse(fs.readFileSync('results.json', 'utf-8'));

  // Step 1: Create a Test Run in ADO
  const runRes = await fetch(\`\${BASE}/runs?api-version=7.1\`, {
    method: 'POST', headers: HEADERS,
    body: JSON.stringify({
      name: \`Playwright Run — \${report.manifest.runId}\`,
      plan: { id: PLAN_ID },
      automated: true,
      state: 'InProgress',
    }),
  });
  const { id: runId } = await runRes.json();
  console.log(\`✅ Created ADO Test Run: \${runId}\`);

  // Step 2: Add individual test results
  const testResults = report.results.map(t => ({
    testCaseTitle: t.name,
    automatedTestName: t.name,
    outcome: t.status === 'passed' ? 'Passed' : t.status === 'failed' ? 'Failed' : 'NotExecuted',
    durationInMs: t.duration,
    state: 'Completed',
    errorMessage: t.error || undefined,
    automatedTestType: 'Playwright',
  }));

  await fetch(\`\${BASE}/runs/\${runId}/results?api-version=7.1\`, {
    method: 'POST', headers: HEADERS,
    body: JSON.stringify(testResults),
  });

  // Step 3: Complete the run
  await fetch(\`\${BASE}/runs/\${runId}?api-version=7.1\`, {
    method: 'PATCH', headers: HEADERS,
    body: JSON.stringify({ state: 'Completed' }),
  });

  console.log(\`✅ Published \${testResults.length} results to ADO run #\${runId}\`);
}

publishToADO();`} />

            <SnippetBlock title="scripts/publish-suite-to-ado.ts — Full Suite Run" code={`import * as fs from 'fs';

// Reuse the same env vars from above
const ORG = process.env.ADO_ORG!;
const PROJECT = process.env.ADO_PROJECT!;
const PAT = process.env.ADO_PAT!;
const BASE = \`https://dev.azure.com/\${ORG}/\${PROJECT}/_apis/test\`;
const AUTH = \`Basic \${Buffer.from(':' + PAT).toString('base64')}\`;
const HEADERS = { Authorization: AUTH, 'Content-Type': 'application/json' };

async function publishSuiteToADO(suiteName: string) {
  // Load all results, filter by suite
  const data = JSON.parse(fs.readFileSync('results.json', 'utf-8'));
  const results = Array.isArray(data) ? data : [data];

  for (const report of results) {
    const suiteTests = report.results.filter(
      (t: any) => t.suite === suiteName || t.name.startsWith(suiteName + ' >')
    );
    if (suiteTests.length === 0) continue;

    const passed = suiteTests.filter((t: any) => t.status === 'passed').length;
    const failed = suiteTests.filter((t: any) => t.status === 'failed').length;

    // Create run per suite
    const runRes = await fetch(\`\${BASE}/runs?api-version=7.1\`, {
      method: 'POST', headers: HEADERS,
      body: JSON.stringify({
        name: \`Suite: \${suiteName} — \${report.manifest.runId}\`,
        automated: true,
        state: 'InProgress',
        comment: \`\${passed} passed, \${failed} failed out of \${suiteTests.length}\`,
      }),
    });
    const { id: runId } = await runRes.json();

    await fetch(\`\${BASE}/runs/\${runId}/results?api-version=7.1\`, {
      method: 'POST', headers: HEADERS,
      body: JSON.stringify(suiteTests.map((t: any) => ({
        testCaseTitle: t.name,
        automatedTestName: t.name,
        outcome: t.status === 'passed' ? 'Passed' : t.status === 'failed' ? 'Failed' : 'NotExecuted',
        durationInMs: t.duration,
        state: 'Completed',
        errorMessage: t.error || undefined,
      }))),
    });

    await fetch(\`\${BASE}/runs/\${runId}?api-version=7.1\`, {
      method: 'PATCH', headers: HEADERS,
      body: JSON.stringify({ state: 'Completed' }),
    });

    console.log(\`✅ Suite "\${suiteName}": \${suiteTests.length} tests → ADO run #\${runId}\`);
  }
}

// Usage: npx ts-node scripts/publish-suite-to-ado.ts auth
publishSuiteToADO(process.argv[2] || 'auth');`} />

            <Tip variant="success" icon="🔷">
              <strong className="text-foreground">CI Usage:</strong> Add to your pipeline after Playwright runs: <code className="font-mono bg-muted px-1 rounded">npx ts-node scripts/publish-to-ado.ts</code>. Set <code className="font-mono bg-muted px-1 rounded">ADO_PAT</code>, <code className="font-mono bg-muted px-1 rounded">ADO_ORG</code>, <code className="font-mono bg-muted px-1 rounded">ADO_PROJECT</code> as pipeline secrets.
            </Tip>
          </div>
        ),
      },
      {
        id: "jira-integration",
        icon: "🟦",
        title: "Jira — Create Issues from Failures",
        summary: "Auto-create bug tickets and attach suite summaries to Jira",
        difficulty: "Advanced",
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Automatically create Jira issues for failed tests or attach run summaries to existing tickets.
            </p>
            <SnippetBlock title="scripts/publish-failures-to-jira.ts — Individual Failures" code={`import * as fs from 'fs';

const JIRA_URL = process.env.JIRA_URL!;       // e.g. 'https://myteam.atlassian.net'
const JIRA_EMAIL = process.env.JIRA_EMAIL!;
const JIRA_TOKEN = process.env.JIRA_TOKEN!;    // API Token
const JIRA_PROJECT = process.env.JIRA_PROJECT!; // e.g. 'QA'

const AUTH = \`Basic \${Buffer.from(JIRA_EMAIL + ':' + JIRA_TOKEN).toString('base64')}\`;
const HEADERS = { Authorization: AUTH, 'Content-Type': 'application/json' };

async function createJiraIssues() {
  const report = JSON.parse(fs.readFileSync('results.json', 'utf-8'));
  const failed = report.results.filter((t: any) => t.status === 'failed');

  if (failed.length === 0) {
    console.log('✅ No failures — nothing to report');
    return;
  }

  for (const test of failed) {
    // Check for duplicate by summary
    const jql = \`project = \${JIRA_PROJECT} AND summary ~ "\${test.name}" AND status != Done\`;
    const searchRes = await fetch(
      \`\${JIRA_URL}/rest/api/3/search?jql=\${encodeURIComponent(jql)}&maxResults=1\`,
      { headers: HEADERS }
    );
    const { total } = await searchRes.json();

    if (total > 0) {
      console.log(\`⏭️  Skipped (exists): \${test.name}\`);
      continue;
    }

    const res = await fetch(\`\${JIRA_URL}/rest/api/3/issue\`, {
      method: 'POST', headers: HEADERS,
      body: JSON.stringify({
        fields: {
          project: { key: JIRA_PROJECT },
          summary: \`[Auto] Test Failed: \${test.name}\`,
          issuetype: { name: 'Bug' },
          priority: { name: test.tags?.includes('critical') ? 'High' : 'Medium' },
          description: {
            type: 'doc', version: 1,
            content: [{
              type: 'codeBlock',
              attrs: { language: 'text' },
              content: [{ type: 'text', text: [
                \`Test: \${test.name}\`,
                \`Suite: \${test.suite}\`,
                \`Run: \${report.manifest.runId}\`,
                \`Duration: \${test.duration}ms\`,
                \`Error:\\n\${test.error || 'No error message'}\`,
              ].join('\\n') }],
            }],
          },
          labels: ['playwright', 'automated-test', ...(test.tags || [])],
        },
      }),
    });

    const issue = await res.json();
    console.log(\`🎫 Created: \${issue.key} — \${test.name}\`);
  }
}

createJiraIssues();`} />

            <SnippetBlock title="scripts/publish-suite-to-jira.ts — Suite Summary Comment" code={`import * as fs from 'fs';

const JIRA_URL = process.env.JIRA_URL!;
const JIRA_EMAIL = process.env.JIRA_EMAIL!;
const JIRA_TOKEN = process.env.JIRA_TOKEN!;

const AUTH = \`Basic \${Buffer.from(JIRA_EMAIL + ':' + JIRA_TOKEN).toString('base64')}\`;
const HEADERS = { Authorization: AUTH, 'Content-Type': 'application/json' };

async function addSuiteSummaryToJira(issueKey: string, suiteName: string) {
  const data = JSON.parse(fs.readFileSync('results.json', 'utf-8'));
  const results = Array.isArray(data) ? data : [data];

  for (const report of results) {
    const suiteTests = report.results.filter(
      (t: any) => t.suite === suiteName || t.name.startsWith(suiteName + ' >')
    );
    if (suiteTests.length === 0) continue;

    const passed = suiteTests.filter((t: any) => t.status === 'passed').length;
    const failed = suiteTests.filter((t: any) => t.status === 'failed').length;
    const skipped = suiteTests.filter((t: any) => t.status === 'skipped').length;
    const rate = Math.round((passed / suiteTests.length) * 100);

    const failDetails = suiteTests
      .filter((t: any) => t.status === 'failed')
      .map((t: any) => \`  ✗ \${t.name}: \${(t.error || '').split('\\n')[0]}\`)
      .join('\\n');

    const summary = [
      \`📊 Suite: \${suiteName} — Run \${report.manifest.runId}\`,
      \`📅 \${report.manifest.timestamp}\`,
      \`✅ Passed: \${passed} | ❌ Failed: \${failed} | ⊘ Skipped: \${skipped}\`,
      \`📈 Pass Rate: \${rate}%\`,
      failed > 0 ? \`\\nFailed Tests:\\n\${failDetails}\` : '',
    ].filter(Boolean).join('\\n');

    await fetch(\`\${JIRA_URL}/rest/api/3/issue/\${issueKey}/comment\`, {
      method: 'POST', headers: HEADERS,
      body: JSON.stringify({
        body: {
          type: 'doc', version: 1,
          content: [{ type: 'codeBlock', attrs: { language: 'text' },
            content: [{ type: 'text', text: summary }],
          }],
        },
      }),
    });

    console.log(\`💬 Added suite summary to \${issueKey}\`);
  }
}

// Usage: npx ts-node scripts/publish-suite-to-jira.ts QA-123 auth
addSuiteSummaryToJira(process.argv[2], process.argv[3] || 'auth');`} />

            <Tip variant="success" icon="🟦">
              <strong className="text-foreground">Two modes:</strong> Use the first script to auto-create bug tickets for each failure (with duplicate check). Use the second to attach suite summaries as comments on existing sprint/release tickets.
            </Tip>
          </div>
        ),
      },
      {
        id: "ci-pipeline",
        icon: "⚙️",
        title: "CI Pipeline Examples",
        summary: "GitHub Actions and Azure DevOps pipeline YAML configs",
        difficulty: "Intermediate",
        content: (
          <div className="space-y-4">
            <SnippetBlock title="GitHub Actions — Run + Publish to ADO" code={`# .github/workflows/test.yml
name: Playwright Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test --reporter=json
        env:
          PLAYWRIGHT_JSON_OUTPUT_FILE: results.json

      - name: Publish to Azure DevOps
        if: always()
        run: npx ts-node scripts/publish-to-ado.ts
        env:
          ADO_ORG: \${{ secrets.ADO_ORG }}
          ADO_PROJECT: \${{ secrets.ADO_PROJECT }}
          ADO_PAT: \${{ secrets.ADO_PAT }}
          ADO_PLAN_ID: \${{ secrets.ADO_PLAN_ID }}

      - name: Create Jira bugs for failures
        if: failure()
        run: npx ts-node scripts/publish-failures-to-jira.ts
        env:
          JIRA_URL: \${{ secrets.JIRA_URL }}
          JIRA_EMAIL: \${{ secrets.JIRA_EMAIL }}
          JIRA_TOKEN: \${{ secrets.JIRA_TOKEN }}
          JIRA_PROJECT: QA

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: results.json`} />

            <SnippetBlock title="Azure DevOps Pipeline" code={`# azure-pipelines.yml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs: { versionSpec: '20.x' }

  - script: |
      npm ci
      npx playwright install --with-deps
    displayName: 'Install dependencies'

  - script: npx playwright test --reporter=json
    displayName: 'Run Playwright tests'
    env:
      PLAYWRIGHT_JSON_OUTPUT_FILE: results.json
    continueOnError: true

  - script: npx ts-node scripts/publish-to-ado.ts
    displayName: 'Publish results to Test Plans'
    env:
      ADO_ORG: $(ADO_ORG)
      ADO_PROJECT: $(ADO_PROJECT)
      ADO_PAT: $(ADO_PAT)
      ADO_PLAN_ID: $(ADO_PLAN_ID)

  - publish: results.json
    artifact: TestResults`} />
          </div>
        ),
      },
    ],
  },
  {
    id: "playground",
    icon: "🎮",
    title: "Code Playground",
    description: "Generate Playwright config and test files based on your preferences",
    color: "text-primary",
    guides: [
      {
        id: "playground-generator",
        icon: "🎮",
        title: "Interactive Config Generator",
        summary: "Select options and get ready-to-use Playwright config and test files",
        difficulty: "Beginner",
        content: <PlaygroundGeneratorWrapper />,
      },
    ],
  },
];

/* ─── Main Page Component ─── */

const HelpPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<GuideItem | null>(null);
  const [search, setSearch] = useState("");

  const currentCategory = categories.find(c => c.id === selectedCategory);

  const filteredGuides = currentCategory?.guides.filter(g =>
    !search || g.title.toLowerCase().includes(search.toLowerCase()) || g.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-4 sm:py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-mono text-lg sm:text-xl font-bold text-foreground">Playwright Intelligence — Guide</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Everything you need to structure tests, import results, export reports, and integrate with your workflow.
        </p>
      </div>

      {/* Back navigation */}
      {selectedCategory && !selectedGuide && (
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5 font-mono text-xs" onClick={() => { setSelectedCategory(null); setSearch(""); }}>
          <ArrowLeft className="h-4 w-4" /> All Categories
        </Button>
      )}
      {selectedGuide && (
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5 font-mono text-xs" onClick={() => setSelectedGuide(null)}>
          <ArrowLeft className="h-4 w-4" /> Back to Guides
        </Button>
      )}

      {/* ── Level 1: Category cards ── */}
      {!selectedCategory && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map(cat => (
            <Card
              key={cat.id}
              className="cursor-pointer hover:shadow-md transition-all group border-border/60 hover:border-primary/30"
              onClick={() => setSelectedCategory(cat.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-lg">{cat.icon}</span>
                  </div>
                  <div>
                    <CardTitle className="text-sm font-mono">{cat.title}</CardTitle>
                    <CardDescription className="text-[10px] mt-0.5">{cat.guides.length} guide{cat.guides.length !== 1 ? "s" : ""}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{cat.description}</p>
                <div className="flex items-center gap-1 mt-3 text-[11px] text-primary font-medium font-mono group-hover:underline">
                  View guides <ChevronRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Level 2: Guide list for a category ── */}
      {selectedCategory && !selectedGuide && currentCategory && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-bold text-foreground font-mono flex items-center gap-2">
                <span>{currentCategory.icon}</span> {currentCategory.title}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{currentCategory.description}</p>
            </div>
            {currentCategory.guides.length > 2 && (
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search guides…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-8 text-xs font-mono"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            {filteredGuides?.map(guide => (
              <Card
                key={guide.id}
                className="cursor-pointer hover:shadow-sm transition-all hover:border-primary/20"
                onClick={() => setSelectedGuide(guide)}
              >
                <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <span className="text-base">{guide.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-xs sm:text-sm font-mono">{guide.title}</h3>
                    <p className="text-[11px] text-muted-foreground truncate">{guide.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className={`text-[9px] ${difficultyColors[guide.difficulty]}`}>
                      {guide.difficulty}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredGuides?.length === 0 && (
              <p className="text-center text-muted-foreground py-10 font-mono text-sm">No guides match your search.</p>
            )}
          </div>
        </>
      )}

      {/* ── Level 3: Guide detail ── */}
      {selectedGuide && (
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-lg">{selectedGuide.icon}</span>
              </div>
              <div className="flex-1">
                <CardTitle className="text-base sm:text-lg font-mono">{selectedGuide.title}</CardTitle>
                <CardDescription className="mt-1 text-xs">{selectedGuide.summary}</CardDescription>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="secondary" className={difficultyColors[selectedGuide.difficulty]}>
                    {selectedGuide.difficulty}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedGuide.content}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/* ─── Playground Generator ─── */
const PlaygroundGenerator = () => {
  const [testType, setTestType] = useState<"ui" | "api" | "hybrid">("ui");
  const [usePOM, setUsePOM] = useState(true);
  const [tags, setTags] = useState(["@smoke"]);
  const [retries, setRetries] = useState(0);
  const [browsers, setBrowsers] = useState(["chromium"]);
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000");
  const [authSetup, setAuthSetup] = useState(false);

  const tagOptions = ["@smoke", "@critical", "@regression", "@api", "@ui", "@e2e"];
  const browserOptions = ["chromium", "firefox", "webkit"];

  const toggleItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter(t => t !== item) : [...arr, item]);
  };

  const generateConfig = () => {
    const projects = browsers.map(b => `    {
      name: '${b}',
      use: { ...devices['Desktop ${b === "chromium" ? "Chrome" : b === "firefox" ? "Firefox" : "Safari"}'] },
    }`).join(",\n");

    return `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? ${retries} : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['json', { outputFile: 'results.json' }],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: '${baseUrl}',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
${projects}
  ],
});`;
  };

  const generateTest = () => {
    const tagStr = tags.length ? `{ tag: [${tags.map(t => `'${t}'`).join(", ")}] }, ` : "";

    if (testType === "api") {
      return `import { test, expect } from '@playwright/test';
${authSetup ? `
let token: string;

test.beforeAll(async ({ request }) => {
  const res = await request.post('/api/auth/login', {
    data: { email: 'test@example.com', password: 'password' },
  });
  token = (await res.json()).token;
});
` : ""}
test.describe('api-tests', () => {
  test('GET /api/resource', ${tagStr}async ({ request }) => {
    const res = await request.get('/api/resource'${authSetup ? `, {
      headers: { Authorization: \`Bearer \${token}\` },
    }` : ""});
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /api/resource', ${tagStr}async ({ request }) => {
    const res = await request.post('/api/resource', {
      ${authSetup ? `headers: { Authorization: \`Bearer \${token}\` },\n      ` : ""}data: { name: 'Test Item', value: 42 },
    });
    expect(res.status()).toBe(201);
  });
});`;
    }

    if (testType === "hybrid") {
      return `import { test, expect } from '@playwright/test';

test.describe('e2e-flow', () => {
  test('create via API → verify in UI', ${tagStr}async ({ page, request }) => {
    const res = await request.post('/api/items', {
      data: { name: 'E2E Widget', price: 19.99 },
    });
    const { id } = await res.json();

    await page.goto('/items');
    await expect(page.locator(\`[data-id="\${id}"]\`)).toBeVisible();
    await expect(page.locator(\`[data-id="\${id}"] .name\`)).toHaveText('E2E Widget');

    await request.delete(\`/api/items/\${id}\`);
  });
});`;
    }

    if (usePOM) {
      return `import { test, expect } from '@playwright/test';

class ExamplePage {
  constructor(private page: import('@playwright/test').Page) {}
  readonly heading = this.page.locator('h1');
  readonly searchInput = this.page.locator('[placeholder="Search..."]');
  readonly results = this.page.locator('.result-item');

  async goto() { await this.page.goto('/'); }
  async search(q: string) { await this.searchInput.fill(q); await this.searchInput.press('Enter'); }
}

test.describe('example-suite', () => {
  test('page loads', ${tagStr}async ({ page }) => {
    const p = new ExamplePage(page);
    await p.goto();
    await expect(p.heading).toBeVisible();
  });

  test('search works', ${tagStr}async ({ page }) => {
    const p = new ExamplePage(page);
    await p.goto();
    await p.search('test query');
    await expect(p.results.first()).toBeVisible();
  });
});`;
    }

    return `import { test, expect } from '@playwright/test';

test.describe('example-suite', () => {
  test('page loads', ${tagStr}async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('navigation', ${tagStr}async ({ page }) => {
    await page.goto('/');
    await page.click('nav a:has-text("About")');
    await expect(page).toHaveURL('/about');
  });

  test('form submission', ${tagStr}async ({ page }) => {
    await page.goto('/contact');
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'test@example.com');
    await page.click('button[type="submit"]');
    await expect(page.locator('.success-toast')).toBeVisible();
  });
});`;
  };

  const chipClass = (active: boolean) =>
    `px-2.5 py-1 rounded-md text-xs font-mono cursor-pointer transition-colors border ${
      active ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
    }`;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Configure your test setup and get ready-to-use code. Select options and copy the output.
      </p>
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Test Type</label>
          <div className="flex flex-wrap gap-2">
            {(["ui", "api", "hybrid"] as const).map(t => (
              <button key={t} onClick={() => setTestType(t)} className={chipClass(testType === t)}>
                {t === "ui" ? "🖥️ UI" : t === "api" ? "🔗 API" : "🔄 Hybrid"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map(tag => (
              <button key={tag} onClick={() => toggleItem(tags, tag, setTags)} className={chipClass(tags.includes(tag))}>{tag}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Browsers</label>
          <div className="flex flex-wrap gap-2">
            {browserOptions.map(b => (
              <button key={b} onClick={() => toggleItem(browsers, b, setBrowsers)} className={chipClass(browsers.includes(b))}>{b}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Base URL</label>
            <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} className="block w-48 px-2 py-1 text-xs font-mono rounded border bg-muted/50 text-foreground" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CI Retries</label>
            <input type="number" min={0} max={5} value={retries} onChange={e => setRetries(Number(e.target.value))} className="block w-16 px-2 py-1 text-xs font-mono rounded border bg-muted/50 text-foreground" />
          </div>
          {testType === "ui" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Page Object</label>
              <button onClick={() => setUsePOM(!usePOM)} className={chipClass(usePOM)}>{usePOM ? "✓ Enabled" : "Disabled"}</button>
            </div>
          )}
          {testType === "api" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Auth Setup</label>
              <button onClick={() => setAuthSetup(!authSetup)} className={chipClass(authSetup)}>{authSetup ? "✓ Enabled" : "Disabled"}</button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">📦 Generated playwright.config.ts</h3>
        <SnippetBlock title="playwright.config.ts" code={generateConfig()} />
      </div>
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">🧪 Generated Test File</h3>
        <SnippetBlock title="tests/example.spec.ts" code={generateTest()} />
      </div>

      <Tip variant="success" icon="🎮">
        <strong className="text-foreground">Interactive!</strong> Change any option and the code updates instantly. Copy the output into your project.
      </Tip>
    </div>
  );
};

export default HelpPage;

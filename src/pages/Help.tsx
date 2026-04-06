import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

const CodeBlock = ({ children, title }: { children: string; title?: string }) => (
  <div className="rounded-lg border bg-muted/50 overflow-hidden">
    {title && <div className="px-4 py-2 border-b bg-muted text-xs font-mono text-muted-foreground">{title}</div>}
    <pre className="p-4 text-xs font-mono text-foreground overflow-x-auto whitespace-pre">{children}</pre>
  </div>
);

const Tip = ({ icon = "💡", variant = "primary", children }: { icon?: string; variant?: "primary" | "warning" | "success"; children: React.ReactNode }) => {
  const bg = variant === "warning" ? "bg-warning/10 border-warning/30" : variant === "success" ? "bg-success/10 border-success/30" : "bg-primary/5 border-primary/20";
  return (
    <div className={`flex items-start gap-2 p-3 rounded-md ${bg}`}>
      <span className="text-sm">{icon}</span>
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  );
};

const HelpPage = () => {
  return (
    <div className="container py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-4xl">
      <div>
        <h1 className="font-mono text-lg sm:text-xl font-bold text-foreground">Playwright Intelligence — Guide</h1>
        <p className="text-sm text-muted-foreground mt-1">
          How to structure your tests, suites, tags, and logs so the dashboard can parse and render them beautifully.
        </p>
      </div>

      <Accordion type="multiple" defaultValue={["getting-started"]} className="space-y-2">
        {/* Getting Started */}
        <AccordionItem value="getting-started" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>🚀</span> Getting Started</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* Suites */}
        <AccordionItem value="suites" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>📂</span> Structuring Test Suites</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-sm text-muted-foreground">
              Each <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">describe()</code> block maps to a suite. 
              Use clear, consistent suite names — they power the Suite Breakdown and Suite Detail views.
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
            <Tip>
              <strong className="text-foreground">Best practice:</strong> Keep suite names lowercase and descriptive. 
              Use one file per suite for clean file-based grouping.
            </Tip>
          </AccordionContent>
        </AccordionItem>

        {/* Tags */}
        <AccordionItem value="tags" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>🏷️</span> Using Tags for Filtering</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-sm text-muted-foreground">
              Tags categorize tests by priority, type, or feature. They power filtering and the Tag Summary view.
            </p>
            <CodeBlock title="tests/checkout.spec.ts">{`// Tag individual tests
test('add to cart', { tag: ['@smoke', '@critical'] }, async ({ page }) => {
  await page.goto('/products');
  await page.click('.add-to-cart');
  await expect(page.locator('.cart-count')).toHaveText('1');
});

// Tag an entire suite
test.describe('payment', { tag: '@regression' }, () => {
  test('payment success', async ({ page }) => {
    // Inherits @regression
  });
  test('payment failure', { tag: '@critical' }, async ({ page }) => {
    // Has both @regression and @critical
  });
});`}</CodeBlock>
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recommended Tags</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { tag: "@smoke", desc: "Quick sanity checks" },
                  { tag: "@critical", desc: "Must-pass tests" },
                  { tag: "@regression", desc: "Full regression suite" },
                  { tag: "@ui", desc: "Visual / UI tests" },
                  { tag: "@api", desc: "API endpoint tests" },
                  { tag: "@flaky", desc: "Known flaky tests" },
                ].map(({ tag, desc }) => (
                  <div key={tag} className="flex items-center gap-1.5 px-2 py-1 rounded-md border bg-muted/50">
                    <Badge variant="outline" className="font-mono text-[10px]">{tag}</Badge>
                    <span className="text-[10px] text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Severity Levels */}
        <AccordionItem value="severity" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>🎯</span> Severity Levels</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-sm text-muted-foreground">
              Severity levels help prioritize which failures to fix first. The dashboard supports 5 levels, auto-inferred from tags and error types.
            </p>

            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Level</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Icon</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">When to Use</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    ["Blocker", "🔴", "Blocks release — critical path completely broken"],
                    ["Critical", "🟠", "Major feature broken — must fix before release"],
                    ["Normal", "🟡", "Standard priority — typical assertion failures"],
                    ["Minor", "🔵", "Low impact — cosmetic issues, edge cases"],
                    ["Trivial", "⚪", "Minimal impact — nice-to-fix items"],
                  ].map(([level, icon, desc]) => (
                    <tr key={level} className="hover:bg-muted/30">
                      <td className="px-3 py-2 text-foreground font-semibold">{level}</td>
                      <td className="px-3 py-2">{icon}</td>
                      <td className="px-3 py-2 text-muted-foreground font-sans">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <CodeBlock title="Setting severity via tags">{`// Explicit severity tags (highest priority)
test('login flow', { tag: ['@critical'] }, async ({ page }) => { ... });
test('footer link', { tag: ['@trivial'] }, async ({ page }) => { ... });

// Playwright annotations (also supported)
test('checkout', async ({ page }) => {
  test.info().annotations.push({ type: 'severity', description: 'blocker' });
  // ...
});

// Auto-inference: @smoke/@p0 → critical, @regression/@p1 → normal
// Timeouts/network errors → critical, assertions → normal, script errors → minor`}</CodeBlock>
          </AccordionContent>
        </AccordionItem>

        {/* Defect Categories */}
        <AccordionItem value="defect-categories" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>🐛</span> Defect Categories</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-sm text-muted-foreground">
              Failed tests are automatically classified into defect categories to help you understand <em>why</em> tests fail — not just <em>that</em> they fail.
            </p>

            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Category</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Meaning</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Example Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    ["🐛 Product Defect", "Actual application bugs", "AssertionError, expected X but got Y"],
                    ["🔧 Test Defect", "Test code issues", "TypeError, ReferenceError, element not found"],
                    ["🏗️ Infrastructure", "Environment problems", "TimeoutError, net::ERR, 502 Bad Gateway"],
                    ["❓ Unclassified", "Needs manual review", "Generic errors without clear patterns"],
                  ].map(([cat, meaning, example]) => (
                    <tr key={cat} className="hover:bg-muted/30">
                      <td className="px-3 py-2 text-foreground font-sans">{cat}</td>
                      <td className="px-3 py-2 text-muted-foreground font-sans">{meaning}</td>
                      <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">{example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Tip>
              <strong className="text-foreground">Auto-classification:</strong> The dashboard analyzes error messages using pattern matching.
              Use Playwright's built-in assertions for best auto-classification. Avoid generic <code className="font-mono bg-muted px-1 rounded">throw new Error('fail')</code>.
            </Tip>

            <CodeBlock title="Writing classifiable errors">{`// ✅ Product defect — assertion failure
await expect(page.locator('.price')).toHaveText('$49.99');
// → "AssertionError: expected '$0.00' to equal '$49.99'" → Product Defect

// ✅ Test defect — caught as script error  
const title = await page.locator('.missing').textContent();
// → "TypeError: Cannot read properties of null" → Test Defect

// ✅ Infrastructure — caught as timeout
await page.locator('.slow-btn').click({ timeout: 5000 });
// → "TimeoutError: Timeout 5000ms exceeded" → Infrastructure`}</CodeBlock>
          </AccordionContent>
        </AccordionItem>

        {/* Test Steps */}
        <AccordionItem value="test-steps" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>📝</span> Test Steps</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-sm text-muted-foreground">
              Test steps provide a step-by-step breakdown of test execution, showing exactly where a test failed. 
              Playwright captures steps automatically from its API calls, or you can add custom steps.
            </p>

            <CodeBlock title="Using Playwright's test.step() for detailed breakdown">{`import { test, expect } from '@playwright/test';

test('complete checkout flow', async ({ page }) => {
  await test.step('Navigate to products', async () => {
    await page.goto('/products');
    await expect(page.locator('.product-grid')).toBeVisible();
  });

  await test.step('Add item to cart', async () => {
    await page.click('.product-card:first-child .add-btn');
    await expect(page.locator('.cart-badge')).toHaveText('1');
  });

  await test.step('Open checkout', async () => {
    await page.click('.cart-icon');
    await page.click('.checkout-btn');
    await expect(page).toHaveURL('/checkout');
  });

  await test.step('Fill payment details', async () => {
    await page.fill('#card-number', '4242424242424242');
    await page.fill('#expiry', '12/28');
    await page.fill('#cvc', '123');
  });

  await test.step('Complete purchase', async () => {
    await page.click('#pay-btn');
    await expect(page.locator('.success-message')).toBeVisible();
  });
});`}</CodeBlock>

            <div className="rounded-lg border overflow-hidden">
              <div className="px-4 py-2 bg-muted border-b text-xs font-mono text-muted-foreground">Step Rendering Preview</div>
              <div className="p-3 space-y-0.5 bg-muted/20 font-mono text-[11px]">
                <div className="flex items-center gap-2 py-0.5">
                  <span className="text-success font-bold">✓</span>
                  <span className="text-foreground flex-1">Navigate to products</span>
                  <span className="text-muted-foreground">245ms</span>
                </div>
                <div className="flex items-center gap-2 py-0.5">
                  <span className="text-success font-bold">✓</span>
                  <span className="text-foreground flex-1">Add item to cart</span>
                  <span className="text-muted-foreground">180ms</span>
                </div>
                <div className="flex items-center gap-2 py-0.5">
                  <span className="text-success font-bold">✓</span>
                  <span className="text-foreground flex-1">Open checkout</span>
                  <span className="text-muted-foreground">320ms</span>
                </div>
                <div className="flex items-center gap-2 py-0.5">
                  <span className="text-destructive font-bold">✗</span>
                  <span className="text-foreground flex-1">Fill payment details</span>
                  <span className="text-muted-foreground">50ms</span>
                </div>
                <div className="text-destructive/70 text-[10px] ml-4">Element not found: #card-number</div>
              </div>
            </div>

            <Tip>
              <strong className="text-foreground">Native support:</strong> When using Playwright's JSON reporter, steps from <code className="font-mono bg-muted px-1 rounded">test.step()</code> are automatically captured and rendered in the dashboard. No custom reporter needed.
            </Tip>
          </AccordionContent>
        </AccordionItem>

        {/* Environment Comparison */}
        <AccordionItem value="environments" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>🌐</span> Environment Comparison</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-sm text-muted-foreground">
              The Environment Comparison view lets you compare test results across different environments (staging, production, etc.) to spot env-specific failures.
            </p>

            <CodeBlock title="Setting environment in your config">{`// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'staging',
      use: { baseURL: 'https://staging.example.com' },
    },
    {
      name: 'production', 
      use: { baseURL: 'https://www.example.com' },
    },
  ],
});

// Or via environment variables in CI:
// TEST_ENV=staging npx playwright test --reporter=json`}</CodeBlock>

            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">What You Get</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: "📊", title: "Per-env pass rates", desc: "See which environments are most stable" },
                  { icon: "🔀", title: "Cross-env failures", desc: "Tests that pass in one env but fail in another" },
                  { icon: "🐛", title: "Env-specific defects", desc: "Failures categorized by product/test/infrastructure" },
                  { icon: "📈", title: "Trend per environment", desc: "Track stability improvements per environment" },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-2 p-3 rounded-md border bg-muted/30">
                    <span>{item.icon}</span>
                    <div>
                      <p className="text-xs font-medium text-foreground">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Tip variant="success" icon="🔀">
              <strong className="text-foreground">Pro tip:</strong> If the same test passes on staging but fails on production, it's likely an environment config issue — not a product bug. Use the Environment Comparison view to quickly identify these.
            </Tip>
          </AccordionContent>
        </AccordionItem>

        {/* Console Logs */}
        <AccordionItem value="logs" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>📝</span> Console Logs & Error Rendering</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-sm text-muted-foreground">
              Logs captured during test execution are rendered with color-coding. Use prefixes for clean rendering.
            </p>
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
          </AccordionContent>
        </AccordionItem>

        {/* API Payloads */}
        <AccordionItem value="api" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>🔗</span> API Request & Response Payloads</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-sm text-muted-foreground">
              API tests can display request/response payloads inline with collapsible headers and bodies.
            </p>
            <CodeBlock title="Capturing API calls">{`test('POST /orders', { tag: ['@api'] }, async ({ request }) => {
  const payload = { productId: 'sku-123', quantity: 2 };
  const response = await request.post('/api/v1/orders', { data: payload });
  const body = await response.json();

  test.info().attach('api-payload', {
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify({
      method: 'POST',
      url: '/api/v1/orders',
      statusCode: response.status(),
      requestBody: payload,
      responseBody: body,
      latency: 230,
    })),
  });

  expect(response.ok()).toBeTruthy();
});`}</CodeBlock>
          </AccordionContent>
        </AccordionItem>

        {/* Retries & Flaky */}
        <AccordionItem value="retries" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>⚡</span> Retries & Flaky Test Detection</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-sm text-muted-foreground">
              The dashboard automatically detects flaky tests — tests that fail initially but pass on retry.
            </p>
            <CodeBlock title="playwright.config.ts">{`export default defineConfig({
  retries: 2,  // Retry failed tests up to 2 times
  projects: [
    {
      name: 'chromium',
      retries: process.env.CI ? 2 : 0,  // Only retry in CI
    },
  ],
});`}</CodeBlock>
            <Tip variant="warning" icon="⚡">
              <strong className="text-foreground">Flaky detection:</strong> A test is marked flaky if it has retries &gt; 0 across 2+ runs. 
              The Insights panel surfaces the most flaky tests with fix recommendations.
            </Tip>
          </AccordionContent>
        </AccordionItem>

        {/* File Formats */}
        <AccordionItem value="formats" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>📁</span> Supported File Formats</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* Custom Reporter */}
        <AccordionItem value="reporter" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>🔌</span> Custom Playwright Reporter</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-sm text-muted-foreground">
              For maximum control, create a custom reporter that outputs the exact format the dashboard expects:
            </p>
            <CodeBlock title="reporters/dashboard-reporter.ts">{`import { Reporter, TestCase, TestResult as PWResult, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

class DashboardReporter implements Reporter {
  private results: any[] = [];
  private startTime = Date.now();
  
  onTestEnd(test: TestCase, result: PWResult) {
    const suite = test.parent.title || 'default';
    const apiAttachment = result.attachments.find(a => a.name === 'api-payload');
    const severityTag = test.tags.find(t => 
      ['@blocker','@critical','@normal','@minor','@trivial'].includes(t)
    );
    
    this.results.push({
      id: test.id,
      name: \`\${suite} > \${test.title}\`,
      suite,
      file: path.relative(process.cwd(), test.location.file),
      status: result.status === 'timedOut' ? 'failed' : result.status,
      duration: result.duration,
      retries: result.retry,
      tags: test.tags.map(t => t.replace('@', '')),
      severity: severityTag?.replace('@', '') || undefined,
      error: result.error?.message ? \`\${result.error.message}\\n\${result.error.stack || ''}\` : undefined,
      logs: result.stdout.map(s => s.toString().trim()).filter(Boolean),
      apiPayload: apiAttachment ? JSON.parse(apiAttachment.body!.toString()) : undefined,
      steps: result.steps.map(s => ({
        name: s.title,
        status: s.error ? 'failed' : 'passed',
        duration: s.duration,
        error: s.error?.message,
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
        branch: process.env.GIT_BRANCH || process.env.GITHUB_REF_NAME || 'unknown',
        environment: process.env.TEST_ENV || 'local',
        total: this.results.length,
        passed, failed, skipped,
        duration: Math.round((Date.now() - this.startTime) / 1000),
      },
      results: this.results,
    };
    
    const outDir = process.env.REPORT_OUTPUT || 'test-results';
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, \`run-\${Date.now()}.json\`),
      JSON.stringify(output, null, 2)
    );
  }
}

export default DashboardReporter;`}</CodeBlock>
            <Tip>
              <strong className="text-foreground">CI Integration:</strong> Set <code className="font-mono bg-muted px-1 rounded">GIT_BRANCH</code> and <code className="font-mono bg-muted px-1 rounded">TEST_ENV</code> env vars in CI to auto-tag runs with branch and environment.
            </Tip>
          </AccordionContent>
        </AccordionItem>

        {/* Schema Reference */}
        <AccordionItem value="schema" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>📋</span> Schema Reference</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">TestResult Fields</h3>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Field</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Type</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      ["id", "string", "Unique test identifier"],
                      ["name", "string", "Format: 'suite > test name'"],
                      ["suite", "string", "Top-level describe() group"],
                      ["file", "string", "Source file path"],
                      ["status", "enum", "'passed' | 'failed' | 'skipped'"],
                      ["duration", "number", "Milliseconds for test execution"],
                      ["retries", "number", "Number of retry attempts"],
                      ["tags", "string[]", "Array of tag labels"],
                      ["error", "string?", "Error message + stack trace"],
                      ["logs", "string[]?", "Captured console output lines"],
                      ["apiPayload", "ApiPayload?", "API request/response data"],
                      ["severity", "Severity?", "'blocker'|'critical'|'normal'|'minor'|'trivial'"],
                      ["defectCategory", "DefectCategory?", "'product'|'test'|'infrastructure'|'unknown'"],
                      ["steps", "TestStep[]?", "Step-by-step execution breakdown"],
                    ].map(([field, type, desc]) => (
                      <tr key={field} className="hover:bg-muted/30">
                        <td className="px-3 py-2 text-foreground">{field}</td>
                        <td className="px-3 py-2 text-muted-foreground">{type}</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">TestStep Fields</h3>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Field</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Type</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      ["name", "string", "Step description"],
                      ["status", "TestStatus", "'passed' | 'failed' | 'skipped'"],
                      ["duration", "number", "Step duration in ms"],
                      ["error", "string?", "Error if step failed"],
                      ["steps", "TestStep[]?", "Nested sub-steps"],
                    ].map(([field, type, desc]) => (
                      <tr key={field} className="hover:bg-muted/30">
                        <td className="px-3 py-2 text-foreground">{field}</td>
                        <td className="px-3 py-2 text-muted-foreground">{type}</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Failure Cause Analysis */}
        <AccordionItem value="failure-analysis" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>🔬</span> Failure Cause Analysis & Trends</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-sm text-muted-foreground">
              Each test's detail page automatically categorizes failures and shows pass/fail trends. Error classification:
            </p>

            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Category</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Detected By</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    ["⏱️ Timeout", "\"Timeout\" in error", "TimeoutError: Timeout 30000ms exceeded"],
                    ["🌐 Network", "\"net::ERR\", \"502\"", "net::ERR_CONNECTION_REFUSED"],
                    ["🔍 Element Not Found", "\"not found\"", "Element not found: #email-input"],
                    ["🔀 State Mismatch", "\"expected\" + URL/text", "expected URL \"/dashboard\" but got \"/login\""],
                    ["💥 Script Error", "\"TypeError\"", "Cannot read properties of null"],
                    ["❌ Assertion", "\"assert\" in error", "expected element to be visible"],
                  ].map(([cat, detection, example]) => (
                    <tr key={cat} className="hover:bg-muted/30">
                      <td className="px-3 py-2 text-foreground font-sans">{cat}</td>
                      <td className="px-3 py-2 text-muted-foreground">{detection}</td>
                      <td className="px-3 py-2 text-destructive/70 truncate max-w-[200px]">{example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Tip variant="success" icon="📊">
              <strong className="text-foreground">What you get:</strong> Status Timeline, Failure Cause Analysis with frequency, sample errors, and actionable fix suggestions — all on each test's detail page.
            </Tip>
          </AccordionContent>
        </AccordionItem>

        {/* Naming Conventions */}
        <AccordionItem value="naming" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>✏️</span> Naming Conventions</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* Run vs Suite Reports */}
        <AccordionItem value="reports" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>📄</span> Run Reports vs Suite Reports</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-sm text-muted-foreground">
              The dashboard offers two distinct export types, each designed for a different audience and purpose.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <h3 className="text-sm font-semibold text-foreground">Run Report</h3>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  A <strong className="text-foreground">snapshot of a single CI execution</strong> — what happened in one test run.
                </p>
                <div className="space-y-1 text-[10px] text-muted-foreground">
                  <p>✓ Summary stats (pass/fail/skip counts)</p>
                  <p>✓ Suite breakdown across all suites</p>
                  <p>✓ Tag summary &amp; duration analysis</p>
                  <p>✓ Full test results list with errors</p>
                  <p>✓ Custom metadata overrides</p>
                </div>
                <div className="rounded bg-muted/50 p-2 text-[10px] text-muted-foreground">
                  <strong className="text-foreground">Best for:</strong> CI/CD reports, release sign-offs, sharing a specific build's results with stakeholders.
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2 border-primary/30">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📂</span>
                  <h3 className="text-sm font-semibold text-foreground">Suite Report</h3>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  A <strong className="text-foreground">stability story across multiple runs</strong> — how a suite performs over time.
                </p>
                <div className="space-y-1 text-[10px] text-muted-foreground">
                  <p>🛡️ Stability score &amp; visual heatmap</p>
                  <p>📈 Pass rate trend across runs</p>
                  <p>🔀 Cross-run test comparison matrix</p>
                  <p>⚡ Flaky tests with flake rates</p>
                  <p>🔍 Failure pattern analysis</p>
                </div>
                <div className="rounded bg-primary/5 p-2 text-[10px] text-muted-foreground">
                  <strong className="text-foreground">Best for:</strong> Sprint reviews, quality health checks, identifying chronic flakiness, tracking suite stability over time.
                </div>
              </div>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <div className="px-4 py-2 bg-muted border-b text-xs font-mono text-muted-foreground">Quick Comparison</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Feature</th>
                    <th className="text-center px-3 py-2 text-muted-foreground font-medium">Run Report</th>
                    <th className="text-center px-3 py-2 text-muted-foreground font-medium">Suite Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono">
                  {[
                    ["Data scope", "Single run", "Multiple runs"],
                    ["Stability score", "—", "✓"],
                    ["Pass rate trend", "—", "✓"],
                    ["Cross-run comparison", "—", "✓"],
                    ["Flaky test detection", "—", "✓"],
                    ["Failure patterns", "—", "✓"],
                    ["Suite breakdown", "✓", "—"],
                    ["Full test list", "✓", "Latest run"],
                    ["Tag summary", "✓", "✓"],
                    ["Duration analysis", "✓", "✓"],
                    ["Custom metadata", "✓", "✓"],
                    ["Scope control", "Fixed (1 run)", "All / Last 5 / Last 10"],
                  ].map(([feature, run, suite]) => (
                    <tr key={feature} className="hover:bg-muted/30">
                      <td className="px-3 py-1.5 text-foreground font-sans">{feature}</td>
                      <td className="px-3 py-1.5 text-center">{run === "✓" ? <span className="text-success">✓</span> : run === "—" ? <span className="text-muted-foreground">—</span> : <span className="text-muted-foreground">{run}</span>}</td>
                      <td className="px-3 py-1.5 text-center">{suite === "✓" ? <span className="text-success">✓</span> : suite === "—" ? <span className="text-muted-foreground">—</span> : <span className="text-muted-foreground">{suite}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">How to Export</h3>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">Run Report:</strong> Navigate to a run's detail page → click <code className="font-mono bg-muted px-1 rounded">📄 Export Report</code> in the header.
                </p>
                <p>
                  <strong className="text-foreground">Suite Report:</strong> Navigate to a suite's detail page → click <code className="font-mono bg-muted px-1 rounded">📄 Export Report</code> in the header.
                </p>
              </div>
            </div>

            <Tip variant="success" icon="💡">
              <strong className="text-foreground">When to use which:</strong> Use a <strong>Run Report</strong> to answer "what happened in this build?" Use a <strong>Suite Report</strong> to answer "how healthy is this test suite over time?"
            </Tip>
          </AccordionContent>
        </AccordionItem>
        {/* Code Snippets & Examples */}
        <AccordionItem value="code-snippets" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>💻</span> Code Snippets &amp; Examples</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            <p className="text-sm text-muted-foreground">
              Real-world, copy-paste-ready examples for common UI and API automation patterns with Playwright.
            </p>

            {/* UI Automation */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span>🖥️</span> UI Automation Examples
              </h3>

              <SnippetBlock
                title="Login with Page Object Model"
                language="typescript"
                code={`// pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitBtn: Locator;
  readonly errorMsg: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitBtn = page.locator('button[type="submit"]');
    this.errorMsg = page.locator('[data-testid="error-message"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitBtn.click();
  }

  async expectError(text: string) {
    await expect(this.errorMsg).toContainText(text);
  }
}

// tests/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('auth', () => {
  test('successful login', { tag: ['@smoke', '@critical'] }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'password123');
    await expect(page).toHaveURL('/dashboard');
  });

  test('invalid credentials', { tag: ['@regression'] }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'wrong');
    await loginPage.expectError('Invalid credentials');
  });
});`}
              />

              <SnippetBlock
                title="Form Validation with Data-Driven Tests"
                language="typescript"
                code={`import { test, expect } from '@playwright/test';

const invalidInputs = [
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
}`}
              />

              <SnippetBlock
                title="Visual Regression with Screenshots"
                language="typescript"
                code={`import { test, expect } from '@playwright/test';

test.describe('visual', { tag: '@visual' }, () => {
  test('dashboard renders correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });

  test('responsive mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await expect(page.locator('.sidebar')).not.toBeVisible();
    await expect(page.locator('.mobile-menu')).toBeVisible();
    await expect(page).toHaveScreenshot('dashboard-mobile.png');
  });

  test('dark mode toggle', async ({ page }) => {
    await page.goto('/settings');
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).toHaveAttribute('class', /dark/);
    await expect(page).toHaveScreenshot('dark-mode.png');
  });
});`}
              />

              <SnippetBlock
                title="File Upload & Download Testing"
                language="typescript"
                code={`import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('file-ops', { tag: '@regression' }, () => {
  test('upload CSV and verify preview', async ({ page }) => {
    await page.goto('/import');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/data.csv'));
    await expect(page.locator('.preview-table')).toBeVisible();
    await expect(page.locator('.row-count')).toHaveText('150 rows');
  });

  test('download report as PDF', async ({ page }) => {
    await page.goto('/reports/123');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-pdf'),
    ]);
    expect(download.suggestedFilename()).toMatch(/report.*\\.pdf$/);
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
  });
});`}
              />

              <SnippetBlock
                title="Multi-Tab & Popup Handling"
                language="typescript"
                code={`import { test, expect } from '@playwright/test';

test('OAuth popup login', { tag: ['@smoke'] }, async ({ page, context }) => {
  await page.goto('/login');

  // Listen for popup before clicking
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    page.click('#google-login'),
  ]);

  // Interact with OAuth popup
  await popup.waitForLoadState();
  await popup.fill('#identifierId', 'test@gmail.com');
  await popup.click('#identifierNext');

  // Popup closes, verify main page
  await page.waitForURL('/dashboard');
  await expect(page.locator('.user-avatar')).toBeVisible();
});`}
              />
            </div>

            {/* API Automation */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span>🔗</span> API Automation Examples
              </h3>

              <SnippetBlock
                title="CRUD API Testing with Chained Requests"
                language="typescript"
                code={`import { test, expect } from '@playwright/test';

test.describe('users-api', { tag: ['@api', '@critical'] }, () => {
  let userId: string;

  test('POST /api/users — create user', async ({ request }) => {
    const res = await request.post('/api/users', {
      data: { name: 'Jane Doe', email: 'jane@test.com', role: 'admin' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.name).toBe('Jane Doe');
    userId = body.id;
  });

  test('GET /api/users/:id — fetch user', async ({ request }) => {
    const res = await request.get(\`/api/users/\${userId}\`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.email).toBe('jane@test.com');
  });

  test('PATCH /api/users/:id — update user', async ({ request }) => {
    const res = await request.patch(\`/api/users/\${userId}\`, {
      data: { role: 'viewer' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.role).toBe('viewer');
  });

  test('DELETE /api/users/:id — remove user', async ({ request }) => {
    const res = await request.delete(\`/api/users/\${userId}\`);
    expect(res.status()).toBe(204);
    // Verify it's gone
    const check = await request.get(\`/api/users/\${userId}\`);
    expect(check.status()).toBe(404);
  });
});`}
              />

              <SnippetBlock
                title="Auth Token & Protected Endpoints"
                language="typescript"
                code={`import { test, expect } from '@playwright/test';

let authToken: string;

test.beforeAll('get auth token', async ({ request }) => {
  const res = await request.post('/api/auth/login', {
    data: { email: 'admin@test.com', password: 'secret' },
  });
  const body = await res.json();
  authToken = body.token;
});

test.describe('protected-api', { tag: ['@api'] }, () => {
  test('GET /api/orders — with auth', async ({ request }) => {
    const res = await request.get('/api/orders', {
      headers: { Authorization: \`Bearer \${authToken}\` },
    });
    expect(res.status()).toBe(200);
    const orders = await res.json();
    expect(orders.length).toBeGreaterThan(0);
  });

  test('GET /api/orders — without auth → 401', async ({ request }) => {
    const res = await request.get('/api/orders');
    expect(res.status()).toBe(401);
  });

  test('GET /api/admin — wrong role → 403', async ({ request }) => {
    // Login as viewer
    const login = await request.post('/api/auth/login', {
      data: { email: 'viewer@test.com', password: 'secret' },
    });
    const { token } = await login.json();
    const res = await request.get('/api/admin/users', {
      headers: { Authorization: \`Bearer \${token}\` },
    });
    expect(res.status()).toBe(403);
  });
});`}
              />

              <SnippetBlock
                title="API Response Schema Validation"
                language="typescript"
                code={`import { test, expect } from '@playwright/test';

// Reusable schema validator helper
function validateSchema(obj: any, schema: Record<string, string>) {
  for (const [key, type] of Object.entries(schema)) {
    expect(typeof obj[key], \`\${key} should be \${type}\`).toBe(type);
  }
}

test.describe('api-contracts', { tag: ['@api', '@regression'] }, () => {
  test('GET /api/products — matches schema', async ({ request }) => {
    const res = await request.get('/api/products');
    expect(res.status()).toBe(200);
    const products = await res.json();
    expect(Array.isArray(products)).toBe(true);

    for (const product of products.slice(0, 5)) {
      validateSchema(product, {
        id: 'string',
        name: 'string',
        price: 'number',
        inStock: 'boolean',
      });
      expect(product.price).toBeGreaterThan(0);
    }
  });

  test('POST /api/orders — validates required fields', async ({ request }) => {
    const res = await request.post('/api/orders', { data: {} });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.errors).toContainEqual(
      expect.objectContaining({ field: 'productId', message: expect.any(String) })
    );
  });
});`}
              />

              <SnippetBlock
                title="GraphQL API Testing"
                language="typescript"
                code={`import { test, expect } from '@playwright/test';

const GRAPHQL_URL = '/graphql';

test.describe('graphql', { tag: ['@api'] }, () => {
  test('query users list', async ({ request }) => {
    const res = await request.post(GRAPHQL_URL, {
      data: {
        query: \`
          query {
            users(limit: 10) {
              id
              name
              email
              createdAt
            }
          }
        \`,
      },
    });
    const { data, errors } = await res.json();
    expect(errors).toBeUndefined();
    expect(data.users.length).toBeLessThanOrEqual(10);
    expect(data.users[0]).toHaveProperty('id');
  });

  test('mutation create post', async ({ request }) => {
    const res = await request.post(GRAPHQL_URL, {
      data: {
        query: \`
          mutation CreatePost($input: PostInput!) {
            createPost(input: $input) { id title }
          }
        \`,
        variables: { input: { title: 'Test Post', body: 'Hello' } },
      },
    });
    const { data } = await res.json();
    expect(data.createPost.title).toBe('Test Post');
  });
});`}
              />

              <SnippetBlock
                title="Performance & Load Assertions"
                language="typescript"
                code={`import { test, expect } from '@playwright/test';

test.describe('api-perf', { tag: ['@api', '@smoke'] }, () => {
  test('GET /api/health — responds under 500ms', async ({ request }) => {
    const start = Date.now();
    const res = await request.get('/api/health');
    const latency = Date.now() - start;

    expect(res.status()).toBe(200);
    expect(latency).toBeLessThan(500);

    // Attach latency for dashboard rendering
    test.info().attach('api-payload', {
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify({
        method: 'GET', url: '/api/health',
        statusCode: 200, latency,
        responseBody: await res.json(),
      })),
    });
  });

  test('GET /api/products — pagination works', async ({ request }) => {
    const res = await request.get('/api/products?page=1&limit=20');
    const body = await res.json();
    expect(body.data.length).toBeLessThanOrEqual(20);
    expect(body.meta).toMatchObject({
      page: 1,
      limit: 20,
      total: expect.any(Number),
    });
  });
});`}
              />
            </div>

            {/* Mixed / Integration */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span>🔄</span> Integration &amp; E2E Patterns
              </h3>

              <SnippetBlock
                title="API Setup → UI Verification (Hybrid Test)"
                language="typescript"
                code={`import { test, expect } from '@playwright/test';

test('create item via API, verify in UI', {
  tag: ['@e2e', '@critical'],
}, async ({ page, request }) => {
  // Step 1: Create data via API
  const res = await request.post('/api/products', {
    data: { name: 'Widget Pro', price: 29.99, category: 'gadgets' },
  });
  const { id } = await res.json();

  // Step 2: Verify it appears in the UI
  await page.goto('/products');
  await page.fill('.search-input', 'Widget Pro');
  await expect(page.locator(\`[data-product-id="\${id}"]\`)).toBeVisible();
  await expect(page.locator(\`[data-product-id="\${id}"] .price\`))
    .toHaveText('$29.99');

  // Step 3: Cleanup via API
  await request.delete(\`/api/products/\${id}\`);
});`}
              />

              <SnippetBlock
                title="Database Seeding with Fixtures"
                language="typescript"
                code={`import { test as base, expect } from '@playwright/test';

// Custom fixture that seeds and cleans up test data
const test = base.extend<{ testUser: { email: string; password: string } }>({
  testUser: async ({ request }, use) => {
    // Seed
    const user = { email: \`test-\${Date.now()}@e2e.com\`, password: 'Test123!' };
    await request.post('/api/test/seed-user', { data: user });

    // Provide to test
    await use(user);

    // Cleanup
    await request.delete('/api/test/cleanup', {
      data: { email: user.email },
    });
  },
});

test('new user onboarding flow', async ({ page, testUser }) => {
  await page.goto('/login');
  await page.fill('#email', testUser.email);
  await page.fill('#password', testUser.password);
  await page.click('button[type="submit"]');
  await expect(page.locator('.onboarding-wizard')).toBeVisible();
});`}
              />
            </div>

            <Tip variant="success" icon="📋">
              <strong className="text-foreground">Copy &amp; adapt!</strong> All snippets follow Playwright best practices and produce output compatible with this dashboard. Use tags, steps, and structured errors for the best rendering.
            </Tip>
          </AccordionContent>
        </AccordionItem>

        {/* Code Playground */}
        <AccordionItem value="playground" className="rounded-lg border bg-card px-4 sm:px-6">
          <AccordionTrigger className="font-mono text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
            <span className="flex items-center gap-2"><span>🎮</span> Code Playground — Generate Your Config</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-sm text-muted-foreground">
              Configure your test setup and get ready-to-use code. Select your options below and copy the generated output.
            </p>
            <PlaygroundGenerator />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

/* ─── Copyable Snippet Block ─── */
const SnippetBlock = ({ title, code, language = "typescript" }: { title: string; code: string; language?: string }) => {
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
  const body = await res.json();
  token = body.token;
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
    const body = await res.json();
    expect(body).toHaveProperty('id');
  });
});`;
    }

    if (testType === "hybrid") {
      return `import { test, expect } from '@playwright/test';

test.describe('e2e-flow', () => {
  test('create via API → verify in UI', ${tagStr}async ({ page, request }) => {
    // Create test data via API
    const res = await request.post('/api/items', {
      data: { name: 'E2E Widget', price: 19.99 },
    });
    const { id } = await res.json();

    // Navigate and verify in UI
    await page.goto('/items');
    await expect(page.locator(\`[data-id="\${id}"]\`)).toBeVisible();
    await expect(page.locator(\`[data-id="\${id}"] .name\`)).toHaveText('E2E Widget');

    // Cleanup
    await request.delete(\`/api/items/\${id}\`);
  });
});`;
    }

    // UI test
    if (usePOM) {
      return `import { test, expect } from '@playwright/test';

// --- Page Object ---
class ExamplePage {
  constructor(private page: import('@playwright/test').Page) {}

  readonly heading = this.page.locator('h1');
  readonly searchInput = this.page.locator('[placeholder="Search..."]');
  readonly results = this.page.locator('.result-item');

  async goto() {
    await this.page.goto('/');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
  }
}

// --- Tests ---
test.describe('example-suite', () => {
  test('page loads', ${tagStr}async ({ page }) => {
    const examplePage = new ExamplePage(page);
    await examplePage.goto();
    await expect(examplePage.heading).toBeVisible();
  });

  test('search works', ${tagStr}async ({ page }) => {
    const examplePage = new ExamplePage(page);
    await examplePage.goto();
    await examplePage.search('test query');
    await expect(examplePage.results.first()).toBeVisible();
  });
});`;
    }

    return `import { test, expect } from '@playwright/test';

test.describe('example-suite', () => {
  test('page loads correctly', ${tagStr}async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('navigation works', ${tagStr}async ({ page }) => {
    await page.goto('/');
    await page.click('nav a:has-text("About")');
    await expect(page).toHaveURL('/about');
    await expect(page.locator('h1')).toContainText('About');
  });

  test('form submission', ${tagStr}async ({ page }) => {
    await page.goto('/contact');
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'test@example.com');
    await page.fill('#message', 'Hello from Playwright');
    await page.click('button[type="submit"]');
    await expect(page.locator('.success-toast')).toBeVisible();
  });
});`;
  };

  const chipClass = (active: boolean) =>
    `px-2.5 py-1 rounded-md text-xs font-mono cursor-pointer transition-colors border ${
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
    }`;

  return (
    <div className="space-y-5">
      {/* Options */}
      <div className="grid grid-cols-1 gap-4">
        {/* Test Type */}
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

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map(tag => (
              <button key={tag} onClick={() => toggleItem(tags, tag, setTags)} className={chipClass(tags.includes(tag))}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Browsers */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Browsers</label>
          <div className="flex flex-wrap gap-2">
            {browserOptions.map(b => (
              <button key={b} onClick={() => toggleItem(browsers, b, setBrowsers)} className={chipClass(browsers.includes(b))}>
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Options Row */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              className="block w-48 px-2 py-1 text-xs font-mono rounded border bg-muted/50 text-foreground"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CI Retries</label>
            <input
              type="number"
              min={0}
              max={5}
              value={retries}
              onChange={e => setRetries(Number(e.target.value))}
              className="block w-16 px-2 py-1 text-xs font-mono rounded border bg-muted/50 text-foreground"
            />
          </div>
          {testType === "ui" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Page Object</label>
              <button onClick={() => setUsePOM(!usePOM)} className={chipClass(usePOM)}>
                {usePOM ? "✓ Enabled" : "Disabled"}
              </button>
            </div>
          )}
          {testType === "api" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Auth Setup</label>
              <button onClick={() => setAuthSetup(!authSetup)} className={chipClass(authSetup)}>
                {authSetup ? "✓ Enabled" : "Disabled"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Generated Config */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">📦 Generated playwright.config.ts</h3>
        <SnippetBlock title="playwright.config.ts" code={generateConfig()} />
      </div>

      {/* Generated Test */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">🧪 Generated Test File</h3>
        <SnippetBlock title={`tests/example.spec.ts`} code={generateTest()} />
      </div>

      <Tip variant="success" icon="🎮">
        <strong className="text-foreground">Interactive!</strong> Change any option above and the code updates instantly. Copy the output and drop it into your project.
      </Tip>
    </div>
  );
};

export default HelpPage;

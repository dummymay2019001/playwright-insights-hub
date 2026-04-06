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
      </Accordion>
    </div>
  );
};

export default HelpPage;

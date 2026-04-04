import { Badge } from "@/components/ui/badge";

const CodeBlock = ({ children, title }: { children: string; title?: string }) => (
  <div className="rounded-lg border bg-muted/50 overflow-hidden">
    {title && <div className="px-4 py-2 border-b bg-muted text-xs font-mono text-muted-foreground">{title}</div>}
    <pre className="p-4 text-xs font-mono text-foreground overflow-x-auto whitespace-pre">{children}</pre>
  </div>
);

const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
  <section className="rounded-lg border bg-card p-4 sm:p-6 space-y-4">
    <h2 className="font-mono text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
      <span>{icon}</span> {title}
    </h2>
    {children}
  </section>
);

const HelpPage = () => {
  return (
    <div className="container py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-4xl">
      <div>
        <h1 className="font-mono text-lg sm:text-xl font-bold text-foreground">Playwright Intelligence — Guide</h1>
        <p className="text-sm text-muted-foreground mt-1">
          How to structure your tests, suites, tags, and logs so the dashboard can parse and render them beautifully.
        </p>
      </div>

      {/* Suites */}
      <Section title="Structuring Test Suites" icon="📂">
        <p className="text-sm text-muted-foreground">
          Each <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">describe()</code> block maps to a suite. 
          Use clear, consistent suite names — they power the Suite Breakdown view on each run.
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

  test('signup flow', async ({ page }) => {
    await page.goto('/signup');
    // ... signup steps
  });
});`}</CodeBlock>
        <div className="flex items-start gap-2 p-3 rounded-md bg-primary/5 border border-primary/20">
          <span className="text-sm">💡</span>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Best practice:</strong> Keep suite names lowercase and descriptive. 
            Use one file per suite for clean file-based grouping (e.g. <code className="font-mono bg-muted px-1 rounded">tests/auth.spec.ts</code>).
          </p>
        </div>
      </Section>

      {/* Tags */}
      <Section title="Using Tags for Filtering" icon="🏷️">
        <p className="text-sm text-muted-foreground">
          Tags let you categorize tests by priority, type, or feature. Use Playwright's <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">tag</code> annotation 
          to add tags that appear in our Tag Summary and filters.
        </p>
        <CodeBlock title="tests/checkout.spec.ts">{`import { test, expect } from '@playwright/test';

// Tag individual tests
test('add to cart', { tag: ['@smoke', '@critical'] }, async ({ page }) => {
  await page.goto('/products');
  await page.click('.add-to-cart');
  await expect(page.locator('.cart-count')).toHaveText('1');
});

// Tag an entire suite
test.describe('payment', { tag: '@regression' }, () => {
  test('payment success', async ({ page }) => {
    // This test inherits @regression
  });

  test('payment failure', { tag: '@critical' }, async ({ page }) => {
    // This test has both @regression and @critical
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
              { tag: "@payment", desc: "Payment flow tests" },
              { tag: "@flaky", desc: "Known flaky tests" },
            ].map(({ tag, desc }) => (
              <div key={tag} className="flex items-center gap-1.5 px-2 py-1 rounded-md border bg-muted/50">
                <Badge variant="outline" className="font-mono text-[10px]">{tag}</Badge>
                <span className="text-[10px] text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Console Logs */}
      <Section title="Console Logs & Error Rendering" icon="📝">
        <p className="text-sm text-muted-foreground">
          Logs captured during test execution are rendered in the expandable test row. Structure your logs with prefixes for clean rendering.
        </p>
        <CodeBlock title="Using structured log prefixes">{`import { test, expect } from '@playwright/test';

test('checkout flow', async ({ page }) => {
  // These console logs are captured and rendered in the dashboard
  console.log('[INFO] Starting checkout flow');
  console.log('[INFO] Adding product to cart');

  await page.goto('/checkout');

  // Errors are highlighted in red
  console.log('[ERROR] Payment gateway timeout');

  // Warnings get special treatment
  console.log('[WARN] Retrying payment attempt 2/3');

  // Debug info for detailed investigation
  console.log('[DEBUG] Cart state: {items: 3, total: 49.99}');
});`}</CodeBlock>

        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Log Level Rendering</h3>
          <div className="rounded-lg border overflow-hidden">
            <div className="px-4 py-2 bg-muted border-b text-xs font-mono text-muted-foreground">Preview</div>
            <div className="p-3 space-y-1 bg-muted/20 font-mono text-xs">
              <p className="text-muted-foreground">[INFO] Starting checkout flow</p>
              <p className="text-muted-foreground">[INFO] Adding product to cart</p>
              <p className="text-destructive font-medium">[ERROR] Payment gateway timeout</p>
              <p className="text-warning">[WARN] Retrying payment attempt 2/3</p>
              <p className="text-muted-foreground/60">[DEBUG] Cart state: {"{ items: 3, total: 49.99 }"}</p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-md bg-primary/5 border border-primary/20">
          <span className="text-sm">💡</span>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Tip:</strong> Use <code className="font-mono bg-muted px-1 rounded">[ERROR]</code> prefix 
            to make errors visually stand out. The dashboard highlights any log line containing "ERROR" in red.
          </p>
        </div>
      </Section>

      {/* Error Messages */}
      <Section title="Error Messages & Stack Traces" icon="🔴">
        <p className="text-sm text-muted-foreground">
          When tests fail, Playwright captures assertion errors and stack traces. These render in the expandable test detail with syntax highlighting.
        </p>
        <CodeBlock title="Clean assertion messages">{`// ✅ Good — clear and descriptive
await expect(page.locator('.cart-count'))
  .toHaveText('3', { message: 'Cart should show 3 items after adding' });

// ✅ Good — custom error context
test('user can checkout', async ({ page }) => {
  const cartTotal = await page.locator('.total').textContent();
  expect(Number(cartTotal)).toBeGreaterThan(0);
  // Error: "expect(received).toBeGreaterThan(expected)
  //   Expected: > 0
  //   Received: 0"
});

// ❌ Avoid — generic assertions without context
await expect(true).toBe(false); // unhelpful error`}</CodeBlock>
      </Section>

      {/* Retries & Flaky */}
      <Section title="Retries & Flaky Test Detection" icon="⚡">
        <p className="text-sm text-muted-foreground">
          The dashboard automatically detects flaky tests — tests that fail initially but pass on retry. Configure retries in your Playwright config:
        </p>
        <CodeBlock title="playwright.config.ts">{`import { defineConfig } from '@playwright/test';

export default defineConfig({
  retries: 2,  // Retry failed tests up to 2 times
  
  // Or set per-project
  projects: [
    {
      name: 'chromium',
      retries: process.env.CI ? 2 : 0,  // Only retry in CI
    },
  ],
});`}</CodeBlock>
        <div className="flex items-start gap-2 p-3 rounded-md bg-warning/10 border border-warning/30">
          <span className="text-sm">⚡</span>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Flaky detection:</strong> A test is marked flaky if it has retries &gt; 0 across 2 or more runs. 
            The Insights panel surfaces the most flaky tests with recommendations to fix them.
          </p>
        </div>
      </Section>

      {/* JSON Structure */}
      <Section title="Result File Structure" icon="📁">
        <p className="text-sm text-muted-foreground">
          The dashboard reads test results from structured JSON. Here's the expected format:
        </p>
        <CodeBlock title="results.json">{`{
  "manifest": {
    "runId": "run-2026-04-01T10-00-00",
    "timestamp": "2026-04-01T10:00:00.000Z",
    "branch": "main",
    "environment": "staging",
    "total": 34,
    "passed": 30,
    "failed": 3,
    "skipped": 1,
    "duration": 120
  },
  "results": [
    {
      "id": "test-1",
      "name": "auth > login with valid credentials",
      "suite": "auth",
      "file": "tests/auth.spec.ts",
      "status": "passed",
      "duration": 1234,
      "retries": 0,
      "tags": ["smoke", "critical"],
      "error": null,
      "logs": ["[INFO] Starting login test"]
    }
  ]
}`}</CodeBlock>

        <div className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Field Reference</h3>
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
                  ["name", "string", "Format: 'suite > test name'"],
                  ["suite", "string", "Top-level describe() group"],
                  ["status", "enum", "'passed' | 'failed' | 'skipped'"],
                  ["duration", "number", "Milliseconds for test result"],
                  ["retries", "number", "Number of retry attempts"],
                  ["tags", "string[]", "Array of tag labels"],
                  ["error", "string?", "Error message + stack trace"],
                  ["logs", "string[]?", "Captured console output lines"],
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
      </Section>

      {/* Naming Conventions */}
      <Section title="Naming Conventions" icon="✏️">
        <p className="text-sm text-muted-foreground">
          The dashboard uses the test name format <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">suite &gt; test name</code> for grouping and display.
        </p>
        <CodeBlock title="Recommended naming">{`// ✅ Good — clear suite > test pattern
test.describe('auth', () => {
  test('login with valid credentials', ...);
  test('login with invalid password', ...);
});
// Produces: "auth > login with valid credentials"

// ✅ Good — nested describes for sub-features
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
      </Section>
    </div>
  );
};

export default HelpPage;

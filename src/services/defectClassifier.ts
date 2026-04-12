import { DefectCategory, Severity } from "@/models/types";

/**
 * Auto-classify failure errors into defect categories.
 * - product: actual application bugs (assertion failures, state mismatches)
 * - test: test code issues (script errors, element selectors)
 * - infrastructure: env/network issues (timeouts, connection errors)
 * - unknown: unclassifiable
 */
export function classifyDefect(error?: string): DefectCategory {
  if (!error) return "unknown";
  const e = error.toLowerCase();

  // Infrastructure: network, timeout, service errors
  if (
    e.includes("timeout") ||
    e.includes("net::err") ||
    e.includes("econnrefused") ||
    e.includes("econnreset") ||
    e.includes("502") ||
    e.includes("503") ||
    e.includes("504") ||
    e.includes("bad gateway") ||
    e.includes("service unavailable") ||
    e.includes("connection refused") ||
    e.includes("dns") ||
    e.includes("certificate") ||
    e.includes("cors") ||
    e.includes("frame was detached") ||
    e.includes("target closed") ||
    e.includes("browser context was destroyed") ||
    e.includes("err_name_not_resolved") ||
    e.includes("navigation failed") ||
    e.includes("err_aborted")
  ) {
    return "infrastructure";
  }

  // Test defects: script errors, wrong selectors, test code bugs
  if (
    e.includes("typeerror") ||
    e.includes("referenceerror") ||
    e.includes("syntaxerror") ||
    e.includes("cannot read properties") ||
    e.includes("is not defined") ||
    e.includes("is not a function") ||
    e.includes("no element matches") ||
    e.includes("element not found") ||
    e.includes("locator.fill") ||
    e.includes("strict mode violation")
  ) {
    return "test";
  }

  // Product defects: assertion failures, unexpected behavior
  if (
    e.includes("assert") ||
    e.includes("expected") ||
    e.includes("toequal") ||
    e.includes("tobetruthy") ||
    e.includes("tohavetext") ||
    e.includes("tohaveurl") ||
    e.includes("tobevisible") ||
    e.includes("state mismatch") ||
    e.includes("but got") ||
    e.includes("but received") ||
    e.includes("status 4") ||
    e.includes("status 5")
  ) {
    return "product";
  }

  return "unknown";
}

/**
 * Infer severity from test tags, error type, and context.
 * Priority: explicit tag > error-based inference > default
 */
export function inferSeverity(tags: string[], error?: string): Severity {
  // Check tags first for explicit severity
  const severityTags: Record<string, Severity> = {
    blocker: "blocker",
    critical: "critical",
    major: "critical",
    normal: "normal",
    minor: "minor",
    trivial: "trivial",
  };

  for (const tag of tags) {
    const normalized = tag.toLowerCase().replace(/^@/, "");
    if (severityTags[normalized]) return severityTags[normalized];
  }

  // Infer from tags
  if (tags.some(t => ["smoke", "p0"].includes(t.toLowerCase()))) return "critical";
  if (tags.some(t => ["regression", "p1"].includes(t.toLowerCase()))) return "normal";

  // Infer from error type
  if (error) {
    const e = error.toLowerCase();
    if (e.includes("timeout") || e.includes("net::err") || e.includes("connection")) return "critical";
    if (e.includes("assert") || e.includes("expected")) return "normal";
    if (e.includes("typeerror") || e.includes("referenceerror")) return "minor";
  }

  return "normal";
}

export const DEFECT_CATEGORY_META: Record<DefectCategory, { label: string; icon: string; color: string; description: string }> = {
  product: {
    label: "Product Defect",
    icon: "🐛",
    color: "hsl(var(--destructive))",
    description: "Actual application bugs — the feature doesn't work as expected",
  },
  test: {
    label: "Test Defect",
    icon: "🔧",
    color: "hsl(var(--warning))",
    description: "Test code issues — selectors, references, or test logic errors",
  },
  infrastructure: {
    label: "Infrastructure",
    icon: "🏗️",
    color: "hsl(38, 80%, 55%)",
    description: "Environment issues — network, timeouts, service availability",
  },
  unknown: {
    label: "Unclassified",
    icon: "❓",
    color: "hsl(var(--muted-foreground))",
    description: "Could not auto-classify — review error details manually",
  },
};

export const SEVERITY_META: Record<Severity, { label: string; icon: string; color: string; priority: number }> = {
  blocker: { label: "Blocker", icon: "🔴", color: "hsl(0, 72%, 50%)", priority: 0 },
  critical: { label: "Critical", icon: "🟠", color: "hsl(var(--destructive))", priority: 1 },
  normal: { label: "Normal", icon: "🟡", color: "hsl(var(--warning))", priority: 2 },
  minor: { label: "Minor", icon: "🔵", color: "hsl(var(--primary))", priority: 3 },
  trivial: { label: "Trivial", icon: "⚪", color: "hsl(var(--muted-foreground))", priority: 4 },
};

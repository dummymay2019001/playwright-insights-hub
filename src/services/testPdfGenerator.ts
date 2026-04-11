import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { TestExportOptions } from "@/models/testExportTypes";
import { RunManifest, TestResult } from "@/models/types";
import { formatDate } from "@/utils/format";

type HistoryEntry = { run: RunManifest; test: TestResult };

const COLORS = {
  primary: [37, 99, 235] as [number, number, number],
  success: [34, 139, 94] as [number, number, number],
  destructive: [220, 53, 69] as [number, number, number],
  warning: [234, 170, 0] as [number, number, number],
  muted: [128, 138, 155] as [number, number, number],
  dark: [30, 41, 59] as [number, number, number],
  light: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function gray(c: [number, number, number]): [number, number, number] {
  const g = Math.round(c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114);
  return [g, g, g];
}

function col(c: [number, number, number], mode: "color" | "grayscale"): [number, number, number] {
  return mode === "grayscale" ? gray(c) : c;
}

function statusColor(status: string, mode: "color" | "grayscale"): [number, number, number] {
  if (status === "passed") return col(COLORS.success, mode);
  if (status === "failed") return col(COLORS.destructive, mode);
  return col(COLORS.muted, mode);
}

function categorizeError(error?: string): string {
  if (!error) return "Unknown";
  const e = error.toLowerCase();
  if (e.includes("timeout")) return "Timeout";
  if (e.includes("net::err") || e.includes("502") || e.includes("503") || e.includes("connection")) return "Network";
  if (e.includes("not found") || e.includes("no element matches")) return "Element Not Found";
  if (e.includes("expected") && (e.includes("url") || e.includes("text") || e.includes("got"))) return "State Mismatch";
  if (e.includes("typeerror") || e.includes("referenceerror") || e.includes("cannot read")) return "Script Error";
  if (e.includes("assert")) return "Assertion";
  return "Other";
}

export function generateTestPdfReport(
  testName: string,
  history: HistoryEntry[],
  options: TestExportOptions
): void {
  const cm = options.colorMode;
  const pageFormat = options.pageSize === "letter" ? "letter" : "a4";
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: pageFormat });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - 20) { doc.addPage(); y = margin; }
  };

  const drawSectionHeader = (title: string) => {
    checkPageBreak(12);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...col(COLORS.dark, cm));
    doc.text(title, margin, y);
    y += 2;
    doc.setDrawColor(...col(COLORS.primary, cm));
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;
  };

  const addPageFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...col(COLORS.muted, cm));
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: "center" });
      if (options.footerNote) doc.text(options.footerNote, margin, pageHeight - 8);
      doc.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth - margin, pageHeight - 8, { align: "right" });
    }
  };

  // Compute stats
  const total = history.length;
  const passed = history.filter(h => h.test.status === "passed").length;
  const failed = history.filter(h => h.test.status === "failed").length;
  const skipped = history.filter(h => h.test.status === "skipped").length;
  const flaky = history.filter(h => h.test.retries > 0).length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const avgDuration = total > 0 ? Math.round(history.reduce((s, h) => s + h.test.duration, 0) / total) : 0;
  const totalRetries = history.reduce((s, h) => s + h.test.retries, 0);
  const latestResult = history[history.length - 1];

  // Collect unique traits
  const allTags = new Set<string>();
  const allSuites = new Set<string>();
  const allFiles = new Set<string>();
  const allEnvs = new Set<string>();
  const allBranches = new Set<string>();
  for (const h of history) {
    h.test.tags.forEach(t => allTags.add(t));
    allSuites.add(h.test.suite);
    allFiles.add(h.test.file);
    allEnvs.add(h.run.environment);
    allBranches.add(h.run.branch);
  }

  // ===== HEADER =====
  doc.setFillColor(...col(COLORS.primary, cm));
  doc.roundedRect(margin, y, 14, 14, 2, 2, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text(options.logoText, margin + 7, y + 9, { align: "center" });

  doc.setFontSize(18);
  doc.setTextColor(...col(COLORS.dark, cm));
  doc.text(options.reportTitle, margin + 18, y + 6);
  if (options.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(...col(COLORS.muted, cm));
    doc.text(options.subtitle, margin + 18, y + 12);
  }
  y += 20;

  if (options.organizationName || options.projectName) {
    doc.setFontSize(9);
    doc.setTextColor(...col(COLORS.muted, cm));
    doc.text([options.organizationName, options.projectName].filter(Boolean).join(" · "), margin, y);
    y += 5;
  }
  if (options.generatedBy) {
    doc.setFontSize(9);
    doc.setTextColor(...col(COLORS.muted, cm));
    doc.text(`Generated by: ${options.generatedBy}`, margin, y);
    y += 5;
  }

  doc.setDrawColor(...col(COLORS.primary, cm));
  doc.setLineWidth(1);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  // Test name
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...col(COLORS.dark, cm));
  const nameLines = doc.splitTextToSize(testName, contentWidth);
  doc.text(nameLines, margin, y);
  y += nameLines.length * 5 + 4;

  if (options.headerNote) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...col(COLORS.muted, cm));
    const lines = doc.splitTextToSize(options.headerNote, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 4;
  }

  // Executive Summary
  if (options.executiveSummary) {
    drawSectionHeader("Executive Summary");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...col(COLORS.dark, cm));
    const lines = doc.splitTextToSize(options.executiveSummary, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 6;
  }

  // ===== HEALTH SUMMARY =====
  if (options.includeHealthSummary) {
    drawSectionHeader("Health Summary");
    const stats = [
      { label: "Pass Rate", value: `${passRate}%`, color: passRate >= 95 ? col(COLORS.success, cm) : passRate >= 80 ? col(COLORS.warning, cm) : col(COLORS.destructive, cm) },
      { label: "Passed", value: String(passed), color: col(COLORS.success, cm) },
      { label: "Failed", value: String(failed), color: col(COLORS.destructive, cm) },
      { label: "Avg Duration", value: `${avgDuration}ms`, color: col(COLORS.dark, cm) },
      { label: "Flaky Runs", value: String(flaky), color: flaky > 0 ? col(COLORS.warning, cm) : col(COLORS.dark, cm) },
      { label: "Total Retries", value: String(totalRetries), color: totalRetries > 0 ? col(COLORS.warning, cm) : col(COLORS.dark, cm) },
    ];

    const boxWidth = contentWidth / 3 - 2;
    stats.forEach((s, i) => {
      const row = Math.floor(i / 3);
      const colIdx = i % 3;
      const x = margin + colIdx * (boxWidth + 2);
      const by = y + row * 22;
      doc.setFillColor(...col(COLORS.light, cm));
      doc.roundedRect(x, by, boxWidth, 18, 1.5, 1.5, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...col(COLORS.muted, cm));
      doc.text(s.label.toUpperCase(), x + boxWidth / 2, by + 6, { align: "center" });
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...s.color);
      doc.text(s.value, x + boxWidth / 2, by + 14, { align: "center" });
    });
    y += 48;

    // Stability indicator
    const stability = flaky === 0 && failed === 0 ? "Stable" : flaky > total * 0.3 ? "Unstable" : failed > total * 0.5 ? "Critical" : "Intermittent";
    const stabilityColor = stability === "Stable" ? col(COLORS.success, cm) : stability === "Critical" ? col(COLORS.destructive, cm) : col(COLORS.warning, cm);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...stabilityColor);
    doc.text(`Stability: ${stability}`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...col(COLORS.muted, cm));
    doc.text(`  |  Latest: ${latestResult?.test.status.toUpperCase() || "N/A"}  |  Seen in ${total} of runs  |  First: ${history[0] ? formatDate(history[0].run.timestamp) : "N/A"}`, margin + 35, y);
    y += 8;
  }

  // ===== TAGS & METADATA =====
  if (options.includeTagsAndMetadata) {
    drawSectionHeader("Test Identity & Traits");
    const metaRows: string[][] = [
      ["Latest Suite", latestResult?.test.suite || "N/A"],
      ["File", latestResult?.test.file || "N/A"],
      ["Tags", allTags.size > 0 ? [...allTags].join(", ") : "None"],
      ["Suites Seen In", [...allSuites].join(", ")],
      ["Environments", [...allEnvs].join(", ")],
      ["Branches", [...allBranches].join(", ")],
      ["Severity", latestResult?.test.severity || "Not set"],
      ["Defect Category", latestResult?.test.defectCategory || "Not classified"],
    ];
    for (const cv of options.customVariables) {
      if (cv.key && cv.value) metaRows.push([cv.key, cv.value]);
    }
    autoTable(doc, {
      startY: y,
      head: [],
      body: metaRows,
      theme: "plain",
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2, textColor: col(COLORS.dark, cm) },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 40, textColor: col(COLORS.muted, cm) } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ===== STATUS TIMELINE =====
  if (options.includeStatusTimeline) {
    drawSectionHeader("Status Timeline");
    checkPageBreak(16);
    const dotSize = Math.min(4, contentWidth / history.length - 0.5);
    const maxDots = Math.floor(contentWidth / (dotSize + 1));
    const displayHistory = history.length > maxDots ? history.slice(-maxDots) : history;

    displayHistory.forEach((h, i) => {
      const x = margin + i * (dotSize + 1);
      const c = statusColor(h.test.status, cm);
      doc.setFillColor(...c);
      doc.roundedRect(x, y, dotSize, dotSize, 0.5, 0.5, "F");
    });
    y += dotSize + 3;

    // Legend
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...col(COLORS.success, cm));
    doc.text("■ Pass", margin, y);
    doc.setTextColor(...col(COLORS.destructive, cm));
    doc.text("■ Fail", margin + 20, y);
    doc.setTextColor(...col(COLORS.muted, cm));
    doc.text("■ Skip", margin + 38, y);
    doc.setTextColor(...col(COLORS.muted, cm));
    doc.text(`(${displayHistory.length} most recent runs)`, margin + 56, y);
    y += 8;
  }

  // ===== FAILURE CAUSE ANALYSIS =====
  if (options.includeFailureCauseAnalysis && failed > 0) {
    drawSectionHeader("Failure Cause Analysis");
    const failures = history.filter(h => h.test.status === "failed");
    const causeMap = new Map<string, { count: number; errors: string[]; lastSeen: string }>();
    for (const f of failures) {
      const category = categorizeError(f.test.error);
      const entry = causeMap.get(category) || { count: 0, errors: [], lastSeen: "" };
      entry.count++;
      if (f.test.error && entry.errors.length < 2) {
        const firstLine = f.test.error.split("\n")[0];
        if (!entry.errors.includes(firstLine)) entry.errors.push(firstLine);
      }
      entry.lastSeen = f.run.timestamp;
      causeMap.set(category, entry);
    }

    const causes = [...causeMap.entries()].sort((a, b) => b[1].count - a[1].count);
    const causeRows: (string | { content: string; styles?: any })[][] = [];
    for (const [category, data] of causes) {
      causeRows.push([
        category,
        String(data.count),
        `${Math.round((data.count / failed) * 100)}%`,
        formatDate(data.lastSeen),
      ]);
      if (options.includeErrorDetails && data.errors.length > 0) {
        for (const err of data.errors) {
          causeRows.push([
            { content: "", styles: {} },
            { content: err.substring(0, 100), styles: { textColor: col(COLORS.destructive, cm), fontSize: 7, fontStyle: "italic" } },
            "",
            "",
          ]);
        }
      }
    }

    autoTable(doc, {
      startY: y,
      head: [["Category", "Count", "Share", "Last Seen"]],
      body: causeRows,
      theme: "grid",
      margin: { left: margin, right: margin },
      headStyles: { fillColor: col(COLORS.destructive, cm), fontSize: 8, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
      alternateRowStyles: { fillColor: col(COLORS.light, cm) },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ===== DURATION TREND =====
  if (options.includeDurationTrend) {
    drawSectionHeader("Duration Analysis");
    const durations = history.map(h => h.test.duration);
    const maxD = Math.max(...durations);
    const minD = Math.min(...durations);
    const p90 = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.9)] || 0;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...col(COLORS.dark, cm));
    doc.text(`Average: ${avgDuration}ms  |  Max: ${maxD}ms  |  Min: ${minD}ms  |  P90: ${p90}ms`, margin, y);
    y += 6;

    // Duration per run table (last 10)
    const recentRuns = history.slice(-10);
    autoTable(doc, {
      startY: y,
      head: [["Run", "Date", "Duration", "Status"]],
      body: recentRuns.map(h => [
        h.run.runId.substring(0, 30),
        formatDate(h.run.timestamp),
        `${h.test.duration}ms`,
        h.test.status.toUpperCase(),
      ]),
      theme: "grid",
      margin: { left: margin, right: margin },
      headStyles: { fillColor: col(COLORS.warning, cm), fontSize: 8, fontStyle: "bold", textColor: col(COLORS.dark, cm) },
      styles: { fontSize: 8, cellPadding: 2 },
      alternateRowStyles: { fillColor: col(COLORS.light, cm) },
      didParseCell: (data: any) => {
        if (data.column.index === 3 && data.section === "body") {
          const status = data.cell.raw as string;
          if (status === "PASSED") data.cell.styles.textColor = col(COLORS.success, cm);
          else if (status === "FAILED") data.cell.styles.textColor = col(COLORS.destructive, cm);
          else data.cell.styles.textColor = col(COLORS.muted, cm);
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ===== RETRY ANALYSIS =====
  if (options.includeRetryAnalysis && totalRetries > 0) {
    drawSectionHeader("Retry Analysis");
    const retriedRuns = history.filter(h => h.test.retries > 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...col(COLORS.dark, cm));
    doc.text(`Total retries: ${totalRetries}  |  Runs with retries: ${retriedRuns.length} of ${total}  |  Flakiness rate: ${Math.round((flaky / total) * 100)}%`, margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Run", "Date", "Retries", "Final Status"]],
      body: retriedRuns.map(h => [
        h.run.runId.substring(0, 30),
        formatDate(h.run.timestamp),
        String(h.test.retries),
        h.test.status.toUpperCase(),
      ]),
      theme: "grid",
      margin: { left: margin, right: margin },
      headStyles: { fillColor: col(COLORS.warning, cm), fontSize: 8, fontStyle: "bold", textColor: col(COLORS.dark, cm) },
      styles: { fontSize: 8, cellPadding: 2 },
      alternateRowStyles: { fillColor: col(COLORS.light, cm) },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ===== RUN HISTORY =====
  if (options.includeRunHistory) {
    drawSectionHeader(`Complete Run History (${total} runs)`);
    autoTable(doc, {
      startY: y,
      head: [["#", "Run ID", "Date", "Branch", "Env", "Status", "Duration", "Retries"]],
      body: [...history].reverse().map((h, i) => [
        String(i + 1),
        h.run.runId.substring(0, 25),
        formatDate(h.run.timestamp),
        h.run.branch,
        h.run.environment,
        { content: h.test.status.toUpperCase(), styles: { textColor: statusColor(h.test.status, cm), fontStyle: "bold" } },
        `${h.test.duration}ms`,
        h.test.retries > 0 ? String(h.test.retries) : "-",
      ]),
      theme: "grid",
      margin: { left: margin, right: margin },
      headStyles: { fillColor: col(COLORS.primary, cm), fontSize: 7, fontStyle: "bold" },
      styles: { fontSize: 7, cellPadding: 1.5, overflow: "linebreak" },
      alternateRowStyles: { fillColor: col(COLORS.light, cm) },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  addPageFooter();
  const safeName = options.fileName.replace(/[^a-zA-Z0-9-_]/g, "_");
  doc.save(`${safeName}.pdf`);
}

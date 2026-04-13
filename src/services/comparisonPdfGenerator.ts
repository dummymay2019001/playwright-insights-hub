import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TestRun } from "@/models/types";
import { passRate, formatDuration, formatDate } from "@/utils/format";

const GREEN: [number, number, number] = [34, 139, 34];
const RED: [number, number, number] = [220, 38, 38];
const AMBER: [number, number, number] = [217, 119, 6];
const BLUE: [number, number, number] = [37, 99, 235];
const GRAY: [number, number, number] = [107, 114, 128];
const DARK: [number, number, number] = [30, 41, 59];
const LIGHT_BG: [number, number, number] = [248, 250, 252];

interface ComparisonData {
  runA: TestRun;
  runB: TestRun;
  newFailures: { name: string; suite: string; error?: string }[];
  resolved: { name: string; suite: string }[];
  persistent: { name: string; suite: string; error?: string }[];
  newTests: { name: string; suite: string; status: string }[];
  removed: string[];
  passRateA: number;
  passRateB: number;
  passRateDelta: number;
  durationDelta: number;
  totalDelta: number;
  suiteHealthMap: Map<string, { passA: number; failA: number; passB: number; failB: number }>;
}

export function generateComparisonPdf(runA: TestRun, runB: TestRun, data: ComparisonData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 14;

  // Header
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, pw, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Run Comparison Report", margin, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, margin, 18);
  doc.text("Playwright Intelligence", margin, 23);
  y = 34;

  // Run info side by side
  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Baseline (Run A)", margin, y);
  doc.text("Compare (Run B)", pw / 2 + 4, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const infoA = [
    `ID: ${runA.manifest.runId.slice(0, 20)}`,
    `Date: ${formatDate(runA.manifest.timestamp)}`,
    `Pass Rate: ${passRate(runA.manifest)}%`,
    `Total: ${runA.manifest.total} | Failed: ${runA.manifest.failed}`,
    `Duration: ${formatDuration(runA.manifest.duration)}`,
  ];
  const infoB = [
    `ID: ${runB.manifest.runId.slice(0, 20)}`,
    `Date: ${formatDate(runB.manifest.timestamp)}`,
    `Pass Rate: ${passRate(runB.manifest)}%`,
    `Total: ${runB.manifest.total} | Failed: ${runB.manifest.failed}`,
    `Duration: ${formatDuration(runB.manifest.duration)}`,
  ];
  infoA.forEach((line, i) => { doc.text(line, margin, y + i * 4.5); });
  infoB.forEach((line, i) => { doc.text(line, pw / 2 + 4, y + i * 4.5); });
  y += infoA.length * 4.5 + 6;

  // Delta summary
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, y, pw - margin * 2, 14, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const deltas = [
    `Δ Pass Rate: ${data.passRateDelta > 0 ? "+" : ""}${data.passRateDelta}%`,
    `Δ Failures: ${data.runB.manifest.failed - data.runA.manifest.failed > 0 ? "+" : ""}${data.runB.manifest.failed - data.runA.manifest.failed}`,
    `Δ Duration: ${data.durationDelta > 0 ? "+" : ""}${data.durationDelta}s`,
    `Δ Tests: ${data.totalDelta > 0 ? "+" : ""}${data.totalDelta}`,
  ];
  doc.setTextColor(...DARK);
  deltas.forEach((d, i) => {
    doc.text(d, margin + 4 + i * 42, y + 9);
  });
  y += 20;

  // Helper for section tables
  function sectionTable(title: string, color: [number, number, number], rows: string[][], columns: string[]) {
    if (rows.length === 0) return;
    if (y > 260) { doc.addPage(); y = 14; }
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(title, margin, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [columns],
      body: rows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, font: "helvetica", cellPadding: 2, textColor: DARK },
      headStyles: { fillColor: color, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: LIGHT_BG },
      didDrawPage: () => {},
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // New Failures
  sectionTable(
    `New Failures (${data.newFailures.length})`, RED,
    data.newFailures.map((t) => [t.name, t.suite, (t.error || "—").slice(0, 80)]),
    ["Test Name", "Suite", "Error"],
  );

  // Resolved
  sectionTable(
    `Resolved (${data.resolved.length})`, GREEN,
    data.resolved.map((t) => [t.name, t.suite]),
    ["Test Name", "Suite"],
  );

  // Persistent Failures
  sectionTable(
    `Persistent Failures (${data.persistent.length})`, AMBER,
    data.persistent.map((t) => [t.name, t.suite, (t.error || "—").slice(0, 80)]),
    ["Test Name", "Suite", "Error"],
  );

  // New Tests
  sectionTable(
    `New Tests (${data.newTests.length})`, BLUE,
    data.newTests.map((t) => [t.name, t.suite, t.status]),
    ["Test Name", "Suite", "Status"],
  );

  // Removed Tests
  if (data.removed.length > 0) {
    sectionTable(
      `Removed Tests (${data.removed.length})`, GRAY,
      data.removed.map((n) => [n]),
      ["Test Name"],
    );
  }

  // Suite Health Table
  if (data.suiteHealthMap.size > 0) {
    if (y > 230) { doc.addPage(); y = 14; }
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Suite Health Comparison", margin, y);
    y += 2;

    const suiteRows = [...data.suiteHealthMap.entries()]
      .sort((a, b) => (b[1].failB - b[1].failA) - (a[1].failB - a[1].failA))
      .map(([suite, h]) => {
        const delta = h.failB - h.failA;
        return [suite, `${h.passA}`, `${h.failA}`, `${h.passB}`, `${h.failB}`, delta > 0 ? `+${delta}` : `${delta}`];
      });

    autoTable(doc, {
      startY: y,
      head: [["Suite", "Pass (A)", "Fail (A)", "Pass (B)", "Fail (B)", "Δ Fail"]],
      body: suiteRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, font: "helvetica", cellPadding: 2, textColor: DARK },
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: LIGHT_BG },
    });
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text("Playwright Intelligence · Run Comparison Report", margin, ph - 6);
    doc.text(`Page ${i} of ${totalPages}`, pw - margin, ph - 6, { align: "right" });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`comparison-${dateStr}.pdf`);
}

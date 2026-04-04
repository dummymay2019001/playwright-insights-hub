export interface PdfExportOptions {
  // Naming
  fileName: string;
  reportTitle: string;
  subtitle: string;

  // Header/Branding
  organizationName: string;
  projectName: string;
  generatedBy: string;
  logoText: string; // 2-char abbreviation for logo box

  // Custom Variables
  customVariables: { key: string; value: string }[];

  // Custom Notes
  headerNote: string;
  footerNote: string;
  executiveSummary: string;

  // Section Toggles
  includeSummaryStats: boolean;
  includePassFailBreakdown: boolean;
  includeTestList: boolean;
  includeFailedOnly: boolean;
  includeSkippedTests: boolean;
  includeErrorDetails: boolean;
  includeLogs: boolean;
  includeTagSummary: boolean;
  includeSuiteBreakdown: boolean;
  includeDurationAnalysis: boolean;
  includeMetadata: boolean;

  // Metadata Overrides (empty = use original from run)
  metadataOverrides: {
    runId: string;
    branch: string;
    environment: string;
    timestamp: string;
  };

  // Formatting
  colorMode: "color" | "grayscale";
  pageSize: "a4" | "letter";
}

export const defaultExportOptions: PdfExportOptions = {
  fileName: "test-report",
  reportTitle: "Test Execution Report",
  subtitle: "",
  organizationName: "",
  projectName: "Playwright Tests",
  generatedBy: "",
  logoText: "PW",
  customVariables: [],
  headerNote: "",
  footerNote: "",
  executiveSummary: "",
  includeSummaryStats: true,
  includePassFailBreakdown: true,
  includeTestList: true,
  includeFailedOnly: false,
  includeSkippedTests: true,
  includeErrorDetails: true,
  includeLogs: false,
  includeTagSummary: true,
  includeSuiteBreakdown: true,
  includeDurationAnalysis: true,
  includeMetadata: true,
  metadataOverrides: { runId: "", branch: "", environment: "", timestamp: "" },
  colorMode: "color",
  pageSize: "a4",
};

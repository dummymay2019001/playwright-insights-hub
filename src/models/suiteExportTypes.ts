export interface SuiteExportOptions {
  // Naming
  fileName: string;
  reportTitle: string;
  subtitle: string;

  // Header/Branding
  organizationName: string;
  projectName: string;
  generatedBy: string;
  logoText: string;

  // Custom Variables
  customVariables: { key: string; value: string }[];

  // Custom Notes
  headerNote: string;
  footerNote: string;
  executiveSummary: string;

  // Suite-Specific Section Toggles
  includeStabilityOverview: boolean;
  includePassRateTrend: boolean;
  includeCrossRunComparison: boolean;
  includeFlakyTests: boolean;
  includeFailurePatterns: boolean;
  includeTestList: boolean;
  includeFailedOnly: boolean;
  includeSkippedTests: boolean;
  includeErrorDetails: boolean;
  includeMetadata: boolean;
  includeTagSummary: boolean;
  includeDurationAnalysis: boolean;

  // Metadata Overrides
  metadataOverrides: {
    suiteName: string;
    environment: string;
  };

  // Formatting
  colorMode: "color" | "grayscale";
  pageSize: "a4" | "letter";
}

export const defaultSuiteExportOptions: SuiteExportOptions = {
  fileName: "suite-report",
  reportTitle: "Suite Stability Report",
  subtitle: "",
  organizationName: "",
  projectName: "Playwright Tests",
  generatedBy: "",
  logoText: "SR",
  customVariables: [],
  headerNote: "",
  footerNote: "",
  executiveSummary: "",
  includeStabilityOverview: true,
  includePassRateTrend: true,
  includeCrossRunComparison: true,
  includeFlakyTests: true,
  includeFailurePatterns: true,
  includeTestList: true,
  includeFailedOnly: false,
  includeSkippedTests: true,
  includeErrorDetails: true,
  includeMetadata: true,
  includeTagSummary: true,
  includeDurationAnalysis: true,
  metadataOverrides: { suiteName: "", environment: "" },
  colorMode: "color",
  pageSize: "a4",
};

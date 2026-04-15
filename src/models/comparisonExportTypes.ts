export interface ComparisonExportOptions {
  fileName: string;
  reportTitle: string;
  subtitle: string;
  organizationName: string;
  projectName: string;
  generatedBy: string;
  logoText: string;
  customVariables: { key: string; value: string }[];
  headerNote: string;
  footerNote: string;
  executiveSummary: string;

  // Custom run labels
  runALabel: string;
  runBLabel: string;

  // Section toggles
  includeDeltaSummary: boolean;
  includeNewFailures: boolean;
  includeResolved: boolean;
  includePersistentFailures: boolean;
  includeNewTests: boolean;
  includeRemovedTests: boolean;
  includeSuiteHealth: boolean;
  includeErrorDetails: boolean;
  includeDurationRegressions: boolean;
  includeFailureCategoryShift: boolean;
  includeFlakyBetweenRuns: boolean;

  colorMode: "color" | "grayscale";
  pageSize: "a4" | "letter";
}

export const defaultComparisonExportOptions: ComparisonExportOptions = {
  fileName: "comparison-report",
  reportTitle: "Run Comparison Report",
  subtitle: "",
  organizationName: "",
  projectName: "Playwright Tests",
  generatedBy: "",
  logoText: "PW",
  customVariables: [],
  headerNote: "",
  footerNote: "",
  executiveSummary: "",
  runALabel: "",
  runBLabel: "",
  includeDeltaSummary: true,
  includeNewFailures: true,
  includeResolved: true,
  includePersistentFailures: true,
  includeNewTests: true,
  includeRemovedTests: true,
  includeSuiteHealth: true,
  includeErrorDetails: true,
  includeDurationRegressions: true,
  includeFailureCategoryShift: true,
  includeFlakyBetweenRuns: true,
  colorMode: "color",
  pageSize: "a4",
};

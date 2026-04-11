export interface TestExportOptions {
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

  // Section toggles
  includeHealthSummary: boolean;
  includeStatusTimeline: boolean;
  includeFailureCauseAnalysis: boolean;
  includeDurationTrend: boolean;
  includeRetryAnalysis: boolean;
  includeRunHistory: boolean;
  includeTagsAndMetadata: boolean;
  includeErrorDetails: boolean;

  colorMode: "color" | "grayscale";
  pageSize: "a4" | "letter";
}

export const defaultTestExportOptions: TestExportOptions = {
  fileName: "test-health-report",
  reportTitle: "Test Health Report",
  subtitle: "",
  organizationName: "",
  projectName: "Playwright Tests",
  generatedBy: "",
  logoText: "PW",
  customVariables: [],
  headerNote: "",
  footerNote: "",
  executiveSummary: "",
  includeHealthSummary: true,
  includeStatusTimeline: true,
  includeFailureCauseAnalysis: true,
  includeDurationTrend: true,
  includeRetryAnalysis: true,
  includeRunHistory: true,
  includeTagsAndMetadata: true,
  includeErrorDetails: true,
  colorMode: "color",
  pageSize: "a4",
};

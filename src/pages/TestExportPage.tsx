import { useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRuns } from "@/store/RunsContext";
import { TestExportOptions, defaultTestExportOptions } from "@/models/testExportTypes";
import { generateTestPdfReport } from "@/services/testPdfGenerator";
import { TestExportSettingsPanel } from "@/components/TestExportSettingsPanel";
import { TestReportPreview } from "@/components/TestReportPreview";
import { Button } from "@/components/ui/button";

type PreviewState = "none" | "current" | "stale";

const TestExportPage = () => {
  const { testName } = useParams<{ testName: string }>();
  const navigate = useNavigate();
  const { runs, loading } = useRuns();
  const previewRef = useRef<HTMLDivElement>(null);

  const decodedName = testName ? decodeURIComponent(testName) : "";

  const history = useMemo(() => {
    const sorted = [...runs].sort(
      (a, b) => new Date(a.manifest.timestamp).getTime() - new Date(b.manifest.timestamp).getTime()
    );
    return sorted
      .map((run) => {
        const test = run.results.find((t) => t.name === decodedName);
        if (!test) return null;
        return { run: run.manifest, test };
      })
      .filter(Boolean) as { run: typeof runs[0]["manifest"]; test: typeof runs[0]["results"][0] }[];
  }, [runs, decodedName]);

  const [options, setOptions] = useState<TestExportOptions>(() => ({
    ...defaultTestExportOptions,
    fileName: `test-health-${(decodedName || "test").replace(/[^a-zA-Z0-9]/g, "-").substring(0, 40)}`,
    subtitle: decodedName,
  }));

  const [previewState, setPreviewState] = useState<PreviewState>("none");
  const [previewOptions, setPreviewOptions] = useState<TestExportOptions | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleOptionsChange = useCallback((newOptions: TestExportOptions) => {
    setOptions(newOptions);
    if (previewState === "current") setPreviewState("stale");
  }, [previewState]);

  const handlePreview = useCallback(() => {
    setPreviewOptions({ ...options });
    setPreviewState("current");
    setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [options]);

  const handleDownload = useCallback(() => {
    if (history.length === 0) return;
    setGenerating(true);
    setTimeout(() => {
      try {
        const exportOpts = previewState === "current" && previewOptions ? previewOptions : options;
        generateTestPdfReport(decodedName, history, exportOpts);
      } catch (e) {
        console.error("PDF generation failed:", e);
      }
      setGenerating(false);
    }, 100);
  }, [history, decodedName, options, previewOptions, previewState]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="font-mono text-muted-foreground">Test not found across any runs</p>
        <Button variant="outline" onClick={() => navigate(-1)}>← Go Back</Button>
      </div>
    );
  }

  const buttonLabel = (() => {
    if (generating) return "Generating…";
    if (previewState === "none") return "👁 Preview Report";
    if (previewState === "stale") return "👁 Preview Latest";
    return "📄 Download PDF";
  })();

  const buttonAction = previewState === "current" ? handleDownload : handlePreview;
  const buttonVariant = previewState === "current" ? "default" : previewState === "stale" ? "outline" : "default";

  return (
    <div className="flex flex-col lg:h-[calc(100vh-3.5rem)]">
      {/* Top bar */}
      <div className="border-b bg-card px-4 py-2.5 flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="sm" className="font-mono text-xs" onClick={() => navigate(`/test/${encodeURIComponent(decodedName)}`)}>
          ← Test Detail
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">Export Test Health Report</h1>
          <p className="text-[10px] text-muted-foreground font-mono truncate">{decodedName}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {previewState === "stale" && (
            <Button variant="ghost" size="sm" className="font-mono text-xs h-8" onClick={handleDownload} disabled={generating}>
              📄 Download Current
            </Button>
          )}
          <Button
            variant={buttonVariant as any}
            size="sm"
            className={`font-mono text-xs h-8 px-4 ${previewState === "stale" ? "border-warning text-warning hover:bg-warning/10" : ""}`}
            onClick={buttonAction}
            disabled={generating}
          >
            {buttonLabel}
          </Button>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
        <div className="lg:w-[360px] xl:w-[400px] shrink-0 border-r lg:overflow-y-auto bg-card">
          <div className="p-4">
            <TestExportSettingsPanel options={options} onChange={handleOptionsChange} />
          </div>
        </div>

        <div ref={previewRef} className="flex-1 lg:overflow-y-auto bg-muted/30 p-4 sm:p-6">
          {previewState === "none" ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <span className="text-3xl">🧪</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Configure your test health report</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Includes historical runs, failure analysis, duration trends, and unique traits
                </p>
              </div>
              <Button onClick={handlePreview} className="font-mono text-xs">👁 Preview Report</Button>
            </div>
          ) : (
            <div>
              {previewState === "stale" && (
                <div className="mb-4 rounded-lg border border-warning/30 bg-warning/5 px-4 py-2.5 flex items-center justify-between">
                  <p className="text-xs text-warning font-medium">⚠ Settings changed — preview may be outdated</p>
                  <Button variant="outline" size="sm" className="h-7 text-xs font-mono border-warning/30 text-warning hover:bg-warning/10" onClick={handlePreview}>
                    Refresh Preview
                  </Button>
                </div>
              )}
              {previewOptions && <TestReportPreview testName={decodedName} history={history} options={previewOptions} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestExportPage;

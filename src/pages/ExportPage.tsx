import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRuns } from "@/store/RunsContext";
import { PdfExportOptions, defaultExportOptions } from "@/models/exportTypes";
import { generatePdfReport } from "@/services/pdfGenerator";
import { ExportSettingsPanel } from "@/components/ExportSettingsPanel";
import { ReportPreview } from "@/components/ReportPreview";
import { Button } from "@/components/ui/button";

type PreviewState = "none" | "current" | "stale";

const ExportPage = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { getRunById, loading } = useRuns();
  const previewRef = useRef<HTMLDivElement>(null);

  const run = runId ? getRunById(decodeURIComponent(runId)) : undefined;

  const [options, setOptions] = useState<PdfExportOptions>(() => ({
    ...defaultExportOptions,
    fileName: `test-report-${runId || "run"}`,
    subtitle: `Run: ${runId || ""}`,
  }));

  const [previewState, setPreviewState] = useState<PreviewState>("none");
  const [previewOptions, setPreviewOptions] = useState<PdfExportOptions | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleOptionsChange = useCallback((newOptions: PdfExportOptions) => {
    setOptions(newOptions);
    if (previewState === "current") {
      setPreviewState("stale");
    }
  }, [previewState]);

  const handlePreview = useCallback(() => {
    setPreviewOptions({ ...options });
    setPreviewState("current");
    // Scroll preview into view on mobile
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [options]);

  const handleDownload = useCallback(() => {
    if (!run) return;
    setGenerating(true);
    setTimeout(() => {
      try {
        // Use previewOptions for download if preview is current, otherwise use current options
        const exportOpts = previewState === "current" && previewOptions ? previewOptions : options;
        generatePdfReport(run, exportOpts);
      } catch (e) {
        console.error("PDF generation failed:", e);
      }
      setGenerating(false);
    }, 100);
  }, [run, options, previewOptions, previewState]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="font-mono text-muted-foreground">Run not found</p>
        <Button variant="outline" onClick={() => navigate("/")}>← Back to Dashboard</Button>
      </div>
    );
  }

  // Button logic
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
        <Button variant="ghost" size="sm" className="font-mono text-xs" onClick={() => navigate(`/run/${encodeURIComponent(run.manifest.runId)}`)}>
          ← Run Detail
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">Export Report</h1>
          <p className="text-[10px] text-muted-foreground font-mono truncate">{run.manifest.runId}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Always show download if there's a preview */}
          {previewState !== "none" && previewState === "stale" && (
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
        {/* Settings Panel */}
        <div className="lg:w-[360px] xl:w-[400px] shrink-0 border-r lg:overflow-y-auto bg-card">
          <div className="p-4">
            <ExportSettingsPanel options={options} onChange={handleOptionsChange} />
          </div>
        </div>

        {/* Preview Panel */}
        <div ref={previewRef} className="flex-1 lg:overflow-y-auto bg-muted/30 p-4 sm:p-6">
          {previewState === "none" ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <span className="text-3xl">📄</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Configure your report</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Adjust settings on the left, then click <strong>Preview Report</strong> to see a live preview
                </p>
              </div>
              <Button onClick={handlePreview} className="font-mono text-xs">
                👁 Preview Report
              </Button>
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
              {previewOptions && <ReportPreview run={run} options={previewOptions} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportPage;

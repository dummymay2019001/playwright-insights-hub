import { useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRuns } from "@/store/RunsContext";
import { TestRun } from "@/models/types";
import { PdfExportOptions, defaultExportOptions } from "@/models/exportTypes";
import { generatePdfReport } from "@/services/pdfGenerator";
import { ExportSettingsPanel } from "@/components/ExportSettingsPanel";
import { ReportPreview } from "@/components/ReportPreview";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PreviewState = "none" | "current" | "stale";
type SourceMode = "latest" | "all" | string; // string = specific runId

const SuiteExportPage = () => {
  const { suiteName } = useParams<{ suiteName: string }>();
  const navigate = useNavigate();
  const { runs, loading } = useRuns();
  const previewRef = useRef<HTMLDivElement>(null);
  const decodedName = suiteName ? decodeURIComponent(suiteName) : "";

  // Find all runs containing this suite
  const suiteRuns = useMemo(() => {
    return runs
      .filter((r) => r.results.some((t) => t.suite === decodedName))
      .sort((a, b) => new Date(b.manifest.timestamp).getTime() - new Date(a.manifest.timestamp).getTime());
  }, [runs, decodedName]);

  const [sourceMode, setSourceMode] = useState<SourceMode>("latest");

  // Build a synthetic TestRun based on source mode
  const syntheticRun = useMemo((): TestRun | undefined => {
    if (suiteRuns.length === 0) return undefined;

    if (sourceMode === "latest") {
      const latest = suiteRuns[0];
      const suiteTests = latest.results.filter((t) => t.suite === decodedName);
      return {
        manifest: {
          ...latest.manifest,
          total: suiteTests.length,
          passed: suiteTests.filter((t) => t.status === "passed").length,
          failed: suiteTests.filter((t) => t.status === "failed").length,
          skipped: suiteTests.filter((t) => t.status === "skipped").length,
          duration: Math.round(suiteTests.reduce((s, t) => s + t.duration, 0) / 1000),
        },
        results: suiteTests,
      };
    }

    if (sourceMode === "all") {
      // Aggregate: use latest result per unique test name
      const testMap = new Map<string, (typeof suiteRuns)[0]["results"][0]>();
      // Process oldest first so latest overwrites
      for (const run of [...suiteRuns].reverse()) {
        for (const t of run.results.filter((t) => t.suite === decodedName)) {
          testMap.set(t.name, t);
        }
      }
      const allTests = [...testMap.values()];
      const latest = suiteRuns[0];
      return {
        manifest: {
          ...latest.manifest,
          runId: `${decodedName} (aggregated)`,
          total: allTests.length,
          passed: allTests.filter((t) => t.status === "passed").length,
          failed: allTests.filter((t) => t.status === "failed").length,
          skipped: allTests.filter((t) => t.status === "skipped").length,
          duration: Math.round(allTests.reduce((s, t) => s + t.duration, 0) / 1000),
        },
        results: allTests,
      };
    }

    // Specific run
    const specific = suiteRuns.find((r) => r.manifest.runId === sourceMode);
    if (!specific) return undefined;
    const suiteTests = specific.results.filter((t) => t.suite === decodedName);
    return {
      manifest: {
        ...specific.manifest,
        total: suiteTests.length,
        passed: suiteTests.filter((t) => t.status === "passed").length,
        failed: suiteTests.filter((t) => t.status === "failed").length,
        skipped: suiteTests.filter((t) => t.status === "skipped").length,
        duration: Math.round(suiteTests.reduce((s, t) => s + t.duration, 0) / 1000),
      },
      results: suiteTests,
    };
  }, [suiteRuns, sourceMode, decodedName]);

  const [options, setOptions] = useState<PdfExportOptions>(() => ({
    ...defaultExportOptions,
    fileName: `suite-report-${decodedName.replace(/[^a-zA-Z0-9]/g, "-")}`,
    reportTitle: `Suite Report: ${decodedName}`,
    subtitle: `Suite-level test report`,
    includeSuiteBreakdown: false, // single suite, not useful
  }));

  const [previewState, setPreviewState] = useState<PreviewState>("none");
  const [previewOptions, setPreviewOptions] = useState<PdfExportOptions | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleOptionsChange = useCallback((newOptions: PdfExportOptions) => {
    setOptions(newOptions);
    if (previewState === "current") setPreviewState("stale");
  }, [previewState]);

  const handlePreview = useCallback(() => {
    setPreviewOptions({ ...options });
    setPreviewState("current");
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [options]);

  const handleDownload = useCallback(() => {
    if (!syntheticRun) return;
    setGenerating(true);
    setTimeout(() => {
      try {
        const exportOpts = previewState === "current" && previewOptions ? previewOptions : options;
        generatePdfReport(syntheticRun, exportOpts);
      } catch (e) {
        console.error("PDF generation failed:", e);
      }
      setGenerating(false);
    }, 100);
  }, [syntheticRun, options, previewOptions, previewState]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  if (suiteRuns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="font-mono text-muted-foreground">Suite not found</p>
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
        <Button variant="ghost" size="sm" className="font-mono text-xs" onClick={() => navigate(`/suite/${encodeURIComponent(decodedName)}`)}>
          ← Suite Detail
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">Export Suite Report</h1>
          <p className="text-[10px] text-muted-foreground font-mono truncate">{decodedName}</p>
        </div>

        {/* Source selector */}
        <div className="shrink-0">
          <Select value={sourceMode} onValueChange={(v) => { setSourceMode(v); if (previewState === "current") setPreviewState("stale"); }}>
            <SelectTrigger className="h-8 text-xs font-mono w-[160px]">
              <SelectValue placeholder="Source run" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest Run</SelectItem>
              <SelectItem value="all">Aggregated (All)</SelectItem>
              {suiteRuns.map((r) => (
                <SelectItem key={r.manifest.runId} value={r.manifest.runId}>
                  <span className="truncate">{new Date(r.manifest.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {r.manifest.runId.slice(0, 12)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <ExportSettingsPanel options={options} onChange={handleOptionsChange} />
          </div>
        </div>

        <div ref={previewRef} className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6">
          {previewState === "none" ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <span className="text-3xl">📂</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Configure your suite report</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Adjust settings on the left, then click <strong>Preview Report</strong>
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
              {previewOptions && syntheticRun && <ReportPreview run={syntheticRun} options={previewOptions} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuiteExportPage;

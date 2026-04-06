import { useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRuns } from "@/store/RunsContext";
import { SuiteExportOptions, defaultSuiteExportOptions } from "@/models/suiteExportTypes";
import { buildSuiteReportData } from "@/services/suiteReportData";
import { generateSuitePdfReport } from "@/services/suitePdfGenerator";
import { SuiteExportSettingsPanel } from "@/components/SuiteExportSettingsPanel";
import { SuiteReportPreview } from "@/components/SuiteReportPreview";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PreviewState = "none" | "current" | "stale";

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

  // Source mode not needed for suite report — always aggregate
  // But keep "scope" for how many runs to include
  const [runScope, setRunScope] = useState<string>("all");

  // Build suite report data
  const reportData = useMemo(() => {
    const scopedRuns = runScope === "all" ? runs :
      runScope === "last5" ? suiteRuns.slice(0, 5).map((sr) => runs.find((r) => r.manifest.runId === sr.manifest.runId)!).filter(Boolean) :
      runScope === "last10" ? suiteRuns.slice(0, 10).map((sr) => runs.find((r) => r.manifest.runId === sr.manifest.runId)!).filter(Boolean) :
      runs;
    return buildSuiteReportData(decodedName, scopedRuns, "all");
  }, [runs, suiteRuns, decodedName, runScope]);

  const [options, setOptions] = useState<SuiteExportOptions>(() => ({
    ...defaultSuiteExportOptions,
    fileName: `suite-report-${decodedName.replace(/[^a-zA-Z0-9]/g, "-")}`,
    reportTitle: `Suite Stability Report`,
    subtitle: decodedName,
  }));

  const [previewState, setPreviewState] = useState<PreviewState>("none");
  const [previewOptions, setPreviewOptions] = useState<SuiteExportOptions | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleOptionsChange = useCallback((newOptions: SuiteExportOptions) => {
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
    if (!reportData) return;
    setGenerating(true);
    setTimeout(() => {
      try {
        const exportOpts = previewState === "current" && previewOptions ? previewOptions : options;
        generateSuitePdfReport(reportData, exportOpts);
      } catch (e) {
        console.error("PDF generation failed:", e);
      }
      setGenerating(false);
    }, 100);
  }, [reportData, options, previewOptions, previewState]);

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
      <div className="border-b bg-card px-4 py-2.5 flex items-center gap-3 shrink-0 flex-wrap">
        <Button variant="ghost" size="sm" className="font-mono text-xs" onClick={() => navigate(`/suite/${encodeURIComponent(decodedName)}`)}>
          ← Suite Detail
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">Export Suite Report</h1>
          <p className="text-[10px] text-muted-foreground font-mono truncate">{decodedName} · {reportData.runsAnalyzed} runs analyzed</p>
        </div>

        {/* Scope selector */}
        <div className="shrink-0">
          <Select value={runScope} onValueChange={(v) => { setRunScope(v); if (previewState === "current") setPreviewState("stale"); }}>
            <SelectTrigger className="h-8 text-xs font-mono w-[130px]">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Runs</SelectItem>
              <SelectItem value="last5">Last 5 Runs</SelectItem>
              <SelectItem value="last10">Last 10 Runs</SelectItem>
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
            <SuiteExportSettingsPanel options={options} onChange={handleOptionsChange} />
          </div>
        </div>

        <div ref={previewRef} className="flex-1 lg:overflow-y-auto bg-muted/30 p-4 sm:p-6">
          {previewState === "none" ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <span className="text-3xl">📂</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Configure your suite report</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This report includes <strong>stability trends</strong>, <strong>flaky tests</strong>,
                  <strong> cross-run comparison</strong>, and <strong>failure patterns</strong> — unique to suite-level analysis.
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
              {previewOptions && <SuiteReportPreview data={reportData} options={previewOptions} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuiteExportPage;

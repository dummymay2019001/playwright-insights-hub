import { useState, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useRuns } from "@/store/RunsContext";
import { buildComparison } from "@/pages/Compare";
import { ComparisonExportOptions, defaultComparisonExportOptions } from "@/models/comparisonExportTypes";
import { ComparisonExportSettingsPanel } from "@/components/ComparisonExportSettingsPanel";
import { ComparisonReportPreview } from "@/components/ComparisonReportPreview";
import { generateComparisonPdf } from "@/services/comparisonPdfGenerator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown, Eye, RefreshCw } from "lucide-react";

type PreviewState = "none" | "current" | "stale";

const CompareExportPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { runs, loading } = useRuns();
  const previewRef = useRef<HTMLDivElement>(null);

  const runIdA = searchParams.get("a") || "";
  const runIdB = searchParams.get("b") || "";

  const comparison = useMemo(() => {
    const a = runs.find((r) => r.manifest.runId === runIdA);
    const b = runs.find((r) => r.manifest.runId === runIdB);
    if (!a || !b) return null;
    return buildComparison(a, b);
  }, [runs, runIdA, runIdB]);

  const [options, setOptions] = useState<ComparisonExportOptions>(() => ({
    ...defaultComparisonExportOptions,
    subtitle: `Baseline vs Compare · ${new Date().toLocaleDateString()}`,
  }));
  const [previewState, setPreviewState] = useState<PreviewState>("none");
  const [previewOptions, setPreviewOptions] = useState<ComparisonExportOptions>(options);
  const [generating, setGenerating] = useState(false);

  const handleOptionsChange = (newOptions: ComparisonExportOptions) => {
    setOptions(newOptions);
    if (previewState === "current") setPreviewState("stale");
  };

  const handlePreview = () => {
    setPreviewOptions({ ...options });
    setPreviewState("current");
    setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleDownload = () => {
    if (!comparison) return;
    setGenerating(true);
    const exportOpts = previewState === "current" ? previewOptions : options;
    setTimeout(() => {
      generateComparisonPdf(comparison.runA, comparison.runB, comparison, exportOpts);
      setGenerating(false);
    }, 100);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="font-mono text-muted-foreground animate-pulse">Loading…</div></div>;
  }

  if (!comparison) {
    return (
      <div className="container py-8 text-center space-y-4">
        <p className="text-muted-foreground">Runs not found. Please go back and select two runs to compare.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/compare")}><ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Compare</Button>
      </div>
    );
  }

  return (
    <div className="container py-4 sm:py-6 space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="font-mono text-xs gap-1" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5" onClick={handlePreview}>
            <Eye className="h-3.5 w-3.5" /> Preview
          </Button>
          <Button size="sm" className="font-mono text-xs gap-1.5" onClick={handleDownload} disabled={generating}>
            <FileDown className="h-3.5 w-3.5" /> {generating ? "Generating…" : "Download PDF"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Settings */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Export Settings</h2>
          <div className="rounded-lg border bg-card p-4 max-h-[calc(100vh-140px)] overflow-y-auto">
            <ComparisonExportSettingsPanel options={options} onChange={handleOptionsChange} />
          </div>
        </div>

        {/* Preview */}
        <div ref={previewRef} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Report Preview</h2>
            {previewState === "stale" && (
              <Button variant="outline" size="sm" className="font-mono text-xs gap-1 text-amber-600" onClick={handlePreview}>
                <RefreshCw className="h-3 w-3" /> Refresh Preview
              </Button>
            )}
          </div>
          {previewState === "none" ? (
            <div className="rounded-lg border bg-card p-12 text-center space-y-3">
              <p className="text-muted-foreground text-sm">Click "Preview" to see your report</p>
              <Button variant="outline" size="sm" className="font-mono text-xs" onClick={handlePreview}>
                <Eye className="h-3.5 w-3.5 mr-1" /> Generate Preview
              </Button>
            </div>
          ) : (
            <div className={previewState === "stale" ? "opacity-70" : ""}>
              <ComparisonReportPreview data={comparison} options={previewOptions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompareExportPage;

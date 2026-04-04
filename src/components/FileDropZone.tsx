import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ingestFiles, IngestionResult } from "@/services/fileIngestion";

interface FileDropZoneProps {
  onImport: (result: IngestionResult) => void;
  compact?: boolean;
}

export function FileDropZone({ onImport, compact = false }: FileDropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<IngestionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setProcessing(true);
    setLastResult(null);
    try {
      const result = await ingestFiles(files);
      setLastResult(result);
      if (result.runs.length > 0) {
        onImport(result);
      }
    } finally {
      setProcessing(false);
    }
  }, [onImport]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input ref={fileInputRef} type="file" accept=".json" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        <Button variant="outline" size="sm" className="font-mono text-xs" onClick={() => fileInputRef.current?.click()} disabled={processing}>
          {processing ? "⏳ Processing…" : "📂 Import JSON"}
        </Button>
        {lastResult && (
          <span className="text-[10px] font-mono text-muted-foreground">
            {lastResult.runs.length} run{lastResult.runs.length !== 1 ? "s" : ""} imported
            {lastResult.errors.length > 0 && ` · ${lastResult.errors.length} error${lastResult.errors.length !== 1 ? "s" : ""}`}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative rounded-xl border-2 border-dashed transition-all duration-200
          ${dragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/20 hover:border-muted-foreground/40"}
          ${compact ? "p-4" : "p-6 sm:p-10"}
        `}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div className={`rounded-2xl bg-muted/50 flex items-center justify-center ${compact ? "w-10 h-10" : "w-16 h-16"}`}>
            <span className={compact ? "text-xl" : "text-3xl"}>{processing ? "⏳" : dragging ? "📥" : "📂"}</span>
          </div>

          {processing ? (
            <p className="font-mono text-sm text-muted-foreground animate-pulse">Processing files…</p>
          ) : (
            <>
              <div>
                <p className="font-mono text-sm font-medium text-foreground">
                  Drop JSON files or folders here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports single run files, multi-run arrays, or folders with manifest + suite files
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" accept=".json" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
                <input ref={folderInputRef} type="file" accept=".json" multiple className="hidden"
                  {...{ webkitdirectory: "", directory: "" } as any}
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
                <Button variant="outline" size="sm" className="font-mono text-xs" onClick={() => fileInputRef.current?.click()}>
                  📄 Select Files
                </Button>
                <Button variant="outline" size="sm" className="font-mono text-xs" onClick={() => folderInputRef.current?.click()}>
                  📁 Select Folder
                </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                {[".json single run", ".json multi-run", "folder w/ manifest", "flat results array"].map((f) => (
                  <Badge key={f} variant="outline" className="font-mono text-[10px] text-muted-foreground">{f}</Badge>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Result feedback */}
      {lastResult && (
        <div className={`rounded-lg border p-3 space-y-2 ${lastResult.errors.length > 0 && lastResult.runs.length === 0 ? "border-destructive/30 bg-destructive/5" : "border-success/30 bg-success/5"}`}>
          {lastResult.runs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm">✅</span>
              <p className="font-mono text-xs text-foreground">
                Successfully imported <strong>{lastResult.runs.length}</strong> run{lastResult.runs.length !== 1 ? "s" : ""} with{" "}
                <strong>{lastResult.runs.reduce((s, r) => s + r.results.length, 0)}</strong> total tests
              </p>
            </div>
          )}
          {lastResult.errors.length > 0 && (
            <div className="space-y-1">
              {lastResult.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs">⚠️</span>
                  <p className="font-mono text-[10px] text-destructive">
                    <strong>{err.file}:</strong> {err.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ingestFiles, IngestionResult } from "@/services/fileIngestion";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FileDropZoneProps {
  onImport: (result: IngestionResult) => void;
  compact?: boolean;
}

export function FileDropZone({ onImport, compact = false }: FileDropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setProcessing(true);
    const fileCount = files.length;
    const toastId = toast.loading(`Processing ${fileCount} file${fileCount !== 1 ? "s" : ""}…`, {
      description: "Parsing and validating test results",
    });

    try {
      const result = await ingestFiles(files);

      if (result.runs.length > 0) {
        onImport(result);
        const totalTests = result.runs.reduce((s, r) => s + r.results.length, 0);
        toast.success(
          `Imported ${result.runs.length} run${result.runs.length !== 1 ? "s" : ""} successfully`,
          {
            id: toastId,
            description: `${totalTests.toLocaleString()} tests across ${result.runs.length} run${result.runs.length !== 1 ? "s" : ""}`,
            duration: 4000,
          }
        );
      }

      if (result.errors.length > 0 && result.runs.length === 0) {
        toast.error(`Import failed — ${result.errors.length} error${result.errors.length !== 1 ? "s" : ""}`, {
          id: toastId,
          description: result.errors.map(e => `${e.file}: ${e.message}`).join("\n"),
          duration: 6000,
        });
      } else if (result.errors.length > 0) {
        toast.warning(
          `Imported with ${result.errors.length} warning${result.errors.length !== 1 ? "s" : ""}`,
          {
            description: result.errors.map(e => `${e.file}: ${e.message}`).join("\n"),
            duration: 5000,
          }
        );
      }

      if (result.runs.length === 0 && result.errors.length === 0) {
        toast.error("No test runs found", {
          id: toastId,
          description: "The file(s) didn't contain any recognizable test data",
          duration: 5000,
        });
      }
    } catch (err) {
      toast.error("Import failed", {
        id: toastId,
        description: err instanceof Error ? err.message : "An unexpected error occurred",
        duration: 6000,
      });
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
        <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={processing}>
          {processing ? (
            <><Loader2 className="h-3 w-3 animate-spin" /> Importing…</>
          ) : (
            "📂 Import JSON"
          )}
        </Button>
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
          p-6 sm:p-10
        `}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div className="rounded-2xl bg-muted/50 flex items-center justify-center w-16 h-16">
            {processing ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <span className="text-3xl">{dragging ? "📥" : "📂"}</span>
            )}
          </div>

          {processing ? (
            <div className="space-y-1">
              <p className="font-mono text-sm font-medium text-foreground">Importing test results…</p>
              <p className="text-xs text-muted-foreground animate-pulse">Parsing and validating files</p>
            </div>
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
    </div>
  );
}

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { TestRun } from "@/models/types";
import { generateMockRuns } from "@/services/mockData";
import { loadRunsFromStorage, saveRunsToStorage, clearStoredRuns } from "@/services/fileIngestion";

type DataMode = "demo" | "imported";

interface RunsContextValue {
  runs: TestRun[];
  loading: boolean;
  dataMode: DataMode;
  getRunById: (id: string) => TestRun | undefined;
  importRuns: (newRuns: TestRun[], append?: boolean) => void;
  removeRun: (runId: string) => void;
  clearRuns: () => void;
  switchToDemo: () => void;
}

const RunsContext = createContext<RunsContextValue | null>(null);

export function RunsProvider({ children }: { children: ReactNode }) {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataMode, setDataMode] = useState<DataMode>("demo");

  useEffect(() => {
    // Check for persisted imported runs first
    const stored = loadRunsFromStorage();
    if (stored && stored.length > 0) {
      setRuns(stored);
      setDataMode("imported");
      setLoading(false);
    } else {
      // Fall back to demo data
      const timer = setTimeout(() => {
        setRuns(generateMockRuns(8));
        setDataMode("demo");
        setLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const getRunById = useCallback(
    (id: string) => runs.find((r) => r.manifest.runId === id),
    [runs]
  );

  const importRuns = useCallback((newRuns: TestRun[], append = false) => {
    setRuns((prev) => {
      const base = append && dataMode === "imported" ? prev : [];
      const merged = [...base];
      const existingIds = new Set(merged.map((r) => r.manifest.runId));
      for (const run of newRuns) {
        if (!existingIds.has(run.manifest.runId)) {
          merged.push(run);
          existingIds.add(run.manifest.runId);
        }
      }
      saveRunsToStorage(merged);
      return merged;
    });
    setDataMode("imported");
  }, [dataMode]);

  const clearRuns = useCallback(() => {
    clearStoredRuns();
    setRuns(generateMockRuns(8));
    setDataMode("demo");
  }, []);

  const switchToDemo = useCallback(() => {
    clearStoredRuns();
    setRuns(generateMockRuns(8));
    setDataMode("demo");
  }, []);

  const removeRun = useCallback((runId: string) => {
    setRuns((prev) => {
      const updated = prev.filter((r) => r.manifest.runId !== runId);
      if (updated.length === 0) {
        clearStoredRuns();
        setDataMode("demo");
        return generateMockRuns(8);
      }
      saveRunsToStorage(updated);
      return updated;
    });
  }, []);

  return (
    <RunsContext.Provider value={{ runs, loading, dataMode, getRunById, importRuns, removeRun, clearRuns, switchToDemo }}>
      {children}
    </RunsContext.Provider>
  );
}

export function useRuns() {
  const ctx = useContext(RunsContext);
  if (!ctx) throw new Error("useRuns must be used within RunsProvider");
  return ctx;
}

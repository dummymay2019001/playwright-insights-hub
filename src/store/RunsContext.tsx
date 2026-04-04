import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { TestRun } from "@/models/types";
import { generateMockRuns } from "@/services/mockData";

interface RunsContextValue {
  runs: TestRun[];
  loading: boolean;
  getRunById: (id: string) => TestRun | undefined;
}

const RunsContext = createContext<RunsContextValue | null>(null);

export function RunsProvider({ children }: { children: ReactNode }) {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate async loading from file system
    const timer = setTimeout(() => {
      setRuns(generateMockRuns(8));
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const getRunById = (id: string) => runs.find((r) => r.manifest.runId === id);

  return (
    <RunsContext.Provider value={{ runs, loading, getRunById }}>
      {children}
    </RunsContext.Provider>
  );
}

export function useRuns() {
  const ctx = useContext(RunsContext);
  if (!ctx) throw new Error("useRuns must be used within RunsProvider");
  return ctx;
}

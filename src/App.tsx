import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RunsProvider } from "@/store/RunsContext";
import { AppShell } from "@/components/AppShell";
import Index from "./pages/Index.tsx";
import RunDetail from "./pages/RunDetail.tsx";
import Trends from "./pages/Trends.tsx";
import Insights from "./pages/Insights.tsx";
import TestDetail from "./pages/TestDetail.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RunsProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/run/:runId" element={<RunDetail />} />
              <Route path="/trends" element={<Trends />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/test/:testName" element={<TestDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </RunsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

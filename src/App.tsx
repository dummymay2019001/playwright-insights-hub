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
import Compare from "./pages/Compare.tsx";
import CompareExportPage from "./pages/CompareExportPage.tsx";
import Insights from "./pages/Insights.tsx";
import TestDetail from "./pages/TestDetail.tsx";
import ExportPage from "./pages/ExportPage.tsx";
import SuiteExportPage from "./pages/SuiteExportPage.tsx";
import TestExportPage from "./pages/TestExportPage.tsx";
import SuiteDetail from "./pages/SuiteDetail.tsx";
import EnvironmentsPage from "./pages/Environments.tsx";
import HelpPage from "./pages/Help.tsx";
import AboutPage from "./pages/About.tsx";
import TestsPage from "./pages/Tests.tsx";
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
              <Route path="/compare" element={<Compare />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/test/:testName" element={<TestDetail />} />
              <Route path="/suite/:suiteName" element={<SuiteDetail />} />
              <Route path="/tests" element={<TestsPage />} />
              <Route path="/environments" element={<EnvironmentsPage />} />
              <Route path="/export/compare" element={<CompareExportPage />} />
              <Route path="/export/suite/:suiteName" element={<SuiteExportPage />} />
              <Route path="/export/test/:testName" element={<TestExportPage />} />
              <Route path="/export/:runId" element={<ExportPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </RunsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

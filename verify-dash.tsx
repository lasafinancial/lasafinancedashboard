// TEMPORARY harness that mounts the real Dashboard. Delete after use.
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import { startAutoRefresh } from "@/lib/googleSheetsService";
import "./src/index.css";
startAutoRefresh();
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={new QueryClient()}><ThemeProvider attribute="class" defaultTheme="dark"><TooltipProvider><BrowserRouter><Dashboard /></BrowserRouter></TooltipProvider></ThemeProvider></QueryClientProvider>
);

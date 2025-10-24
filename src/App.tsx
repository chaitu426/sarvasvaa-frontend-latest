import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MilkCollections from "./pages/MilkCollections";
import Products from "./pages/Products";
import Productions from "./pages/Productions";
import Stocks from "./pages/Stocks";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import ReportPage from "./pages/PdfReport"
import SQLAgentChat from "./pages/Aiagent"

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              }
            />
            <Route
              path="/milk-collections"
              element={
                <AppLayout>
                  <MilkCollections />
                </AppLayout>
              }
            />
            <Route
              path="/products"
              element={
                <AppLayout>
                  <Products />
                </AppLayout>
              }
            />
            <Route
              path="/productions"
              element={
                <AppLayout>
                  <Productions />
                </AppLayout>
              }
            />
            <Route
              path="/stocks"
              element={
                <AppLayout>
                  <Stocks />
                </AppLayout>
              }
            />
            <Route
              path="/sales"
              element={
                <AppLayout>
                  <Sales />
                </AppLayout>
              }
            />
            <Route
              path="/reports"
              element={
                <AppLayout>
                  <Reports />
                </AppLayout>
              }
            />
            <Route
              path="/reportpage"
              element={
                <AppLayout>
                  <ReportPage />
                </AppLayout>
              }
            />
            <Route
              path="/ai"
              element={
                <AppLayout>
                  <SQLAgentChat/>
                </AppLayout>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

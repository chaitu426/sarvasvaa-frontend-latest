import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Detect current route (use startsWith if you have child routes)
  const isAIPage = location.pathname === "/ai";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      {/* Top-level: don't force overflow hidden globally so non-AI pages can scroll */}
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />

        {/* MAIN */}
        {isAIPage ? (
          /* AI route: full-height, page won't scroll; child handles its own scrolling */
          <main className="flex-1 flex flex-col h-screen">
            {/* Make the child occupy full height */}
            <div className="flex-1 overflow-hidden">{children}</div>
          </main>
        ) : (
          /* Normal pages: allow page-level scrolling and keep padding */
          <main className="flex-1 flex flex-col">
            <div className="p-4 w-full">{children}</div>
          </main>
        )}
      </div>

      <Toaster />
    </SidebarProvider>
  );
}

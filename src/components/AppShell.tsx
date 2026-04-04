import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: "📋" },
  { path: "/trends", label: "Trends", icon: "📈" },
  { path: "/insights", label: "Insights", icon: "💡" },
  { path: "/help", label: "Guide", icon: "📖" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isDetailPage = location.pathname.startsWith("/run/") || location.pathname.startsWith("/test/") || location.pathname.startsWith("/export/");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Nav */}
      <header className="border-b bg-card sticky top-0 z-20 shadow-sm">
        <div className="container flex items-center gap-3 h-12 sm:h-14">
          {/* Logo */}
          <button onClick={() => navigate("/")} className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-mono font-bold text-xs">PW</span>
            </div>
            <span className="font-semibold text-sm text-foreground hidden sm:inline">Playwright Intelligence</span>
          </button>

          {/* Nav Links */}
          {!isDetailPage && (
            <nav className="flex items-center gap-0.5 ml-4">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`font-mono text-xs h-8 px-2.5 sm:px-3 ${isActive ? "" : "text-muted-foreground"}`}
                    onClick={() => navigate(item.path)}
                  >
                    <span className="sm:hidden">{item.icon}</span>
                    <span className="hidden sm:inline">{item.icon} {item.label}</span>
                  </Button>
                );
              })}
            </nav>
          )}

          {/* Back button on detail pages */}
          {isDetailPage && (
            <Button variant="ghost" size="sm" className="font-mono text-xs ml-2" onClick={() => navigate(-1)}>
              ← Back
            </Button>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground hidden md:inline px-2 py-1 rounded bg-muted">
              v1.0 · Local Mode
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

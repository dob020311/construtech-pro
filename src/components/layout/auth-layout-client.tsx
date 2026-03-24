"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";

export function AuthLayoutClient({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Topbar sidebarCollapsed={collapsed} />
      <main
        className={cn(
          "transition-all duration-300 pt-16",
          collapsed ? "ml-[72px]" : "ml-[260px]"
        )}
      >
        <div className="p-6 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}

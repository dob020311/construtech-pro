"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Calculator,
  Users,
  Bot,
  FolderOpen,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Zap,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Licitações",
    href: "/licitacoes",
    icon: FileText,
  },
  {
    label: "Orçamentos",
    href: "/orcamentos",
    icon: Calculator,
  },
  {
    label: "CRM",
    href: "/crm/pipeline",
    icon: Users,
    children: [
      { label: "Pipeline", href: "/crm/pipeline" },
      { label: "Contatos", href: "/crm/contatos" },
      { label: "Empresas", href: "/crm/empresas" },
      { label: "Atividades", href: "/crm/atividades" },
    ],
  },
  {
    label: "Automações RPA",
    href: "/rpa",
    icon: Bot,
  },
  {
    label: "Documentos",
    href: "/documentos",
    icon: FolderOpen,
    children: [
      { label: "Repositório", href: "/documentos" },
      { label: "Validades", href: "/documentos/validades" },
      { label: "Templates", href: "/documentos/templates" },
    ],
  },
  {
    label: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out",
        "bg-[hsl(218,35%,8%)] border-r border-[hsl(218,35%,14%)]",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-16 px-4 border-b border-[hsl(218,35%,14%)]",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white font-heading font-bold text-sm leading-tight truncate">
                ConstruTech
              </p>
              <p className="text-[hsl(215,20%,65%)] text-xs leading-tight">Pro</p>
            </div>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1 rounded text-[hsl(215,20%,65%)] hover:text-white hover:bg-[hsl(218,35%,13%)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <ul className="space-y-0.5 px-3">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const expanded = expandedItems.includes(item.href);
            const hasChildren = item.children && item.children.length > 0;

            return (
              <li key={item.href}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => {
                        if (collapsed) return;
                        toggleExpanded(item.href);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                        active
                          ? "bg-primary text-white"
                          : "text-[hsl(215,20%,65%)] hover:bg-[hsl(218,35%,13%)] hover:text-white",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "flex-shrink-0",
                          collapsed ? "w-5 h-5" : "w-4 h-4"
                        )}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left font-medium">{item.label}</span>
                          <ChevronRight
                            className={cn(
                              "w-3.5 h-3.5 transition-transform",
                              expanded && "rotate-90"
                            )}
                          />
                        </>
                      )}
                    </button>
                    {!collapsed && expanded && (
                      <ul className="mt-0.5 ml-10 space-y-0.5">
                        {item.children?.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                "block px-3 py-2 rounded-lg text-sm transition-colors",
                                pathname === child.href || pathname.startsWith(child.href + "/")
                                  ? "bg-[hsl(218,35%,18%)] text-white"
                                  : "text-[hsl(215,20%,55%)] hover:bg-[hsl(218,35%,13%)] hover:text-white"
                              )}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                      active
                        ? "bg-primary text-white"
                        : "text-[hsl(215,20%,65%)] hover:bg-[hsl(218,35%,13%)] hover:text-white",
                      collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon
                      className={cn(
                        "flex-shrink-0",
                        collapsed ? "w-5 h-5" : "w-4 h-4"
                      )}
                    />
                    {!collapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom - collapse button when collapsed */}
      {collapsed && (
        <div className="p-3 border-t border-[hsl(218,35%,14%)]">
          <button
            onClick={onToggle}
            className="w-full flex justify-center p-2 rounded-lg text-[hsl(215,20%,65%)] hover:text-white hover:bg-[hsl(218,35%,13%)] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Version tag */}
      {!collapsed && (
        <div className="p-4 border-t border-[hsl(218,35%,14%)]">
          <div className="flex items-center gap-2 text-[hsl(215,20%,45%)] text-xs">
            <Zap className="w-3 h-3" />
            <span>v1.0.0 — Lei 14.133/2021</span>
          </div>
        </div>
      )}
    </aside>
  );
}

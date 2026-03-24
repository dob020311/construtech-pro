"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { Bell, Search, Moon, Sun, LogOut, User, Settings, ChevronDown, FileText, Calculator, FolderOpen, Users, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

interface TopbarProps {
  sidebarCollapsed: boolean;
}

export function Topbar({ sidebarCollapsed }: TopbarProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: searchResults, isFetching: searching } = trpc.search.global.useQuery(
    { q: debouncedQ },
    { enabled: debouncedQ.length >= 2 }
  );

  const hasResults = searchResults && (
    searchResults.licitacoes.length + searchResults.orcamentos.length +
    searchResults.documentos.length + searchResults.contatos.length
  ) > 0;

  const handleResultClick = (href: string) => {
    setSearchQuery("");
    setSearchOpen(false);
    router.push(href);
  };

  const utils = trpc.useUtils();

  const { data: notifications } = trpc.user.getNotifications.useQuery(
    { unreadOnly: false },
    { refetchInterval: 30000 }
  );

  const markRead = trpc.user.markNotificationsRead.useMutation({
    onSuccess: () => utils.user.getNotifications.invalidate(),
  });

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "U";

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 z-30 flex items-center justify-between px-6",
        "bg-background border-b border-border transition-all duration-300",
        sidebarCollapsed ? "left-[72px]" : "left-[260px]"
      )}
    >
      {/* Search */}
      <div ref={searchRef} className="flex items-center gap-3 flex-1 max-w-md relative">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />}
          <input
            type="text"
            placeholder="Buscar licitações, orçamentos... (mín. 2 caracteres)"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            className={cn(
              "w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border",
              "bg-muted/50 placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
              "transition-colors"
            )}
          />
        </div>

        {/* Search Results Dropdown */}
        {searchOpen && debouncedQ.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-[420px] overflow-y-auto">
            {!hasResults && !searching ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhum resultado para &ldquo;{debouncedQ}&rdquo;
              </div>
            ) : (
              <div className="py-2">
                {/* Licitações */}
                {searchResults && searchResults.licitacoes.length > 0 && (
                  <SearchSection
                    title="Licitações"
                    icon={<FileText className="w-3.5 h-3.5" />}
                  >
                    {searchResults.licitacoes.map((l) => (
                      <SearchItem
                        key={l.id}
                        title={l.number}
                        subtitle={l.object}
                        badge={l.organ}
                        onClick={() => handleResultClick(`/licitacoes/${l.id}`)}
                      />
                    ))}
                  </SearchSection>
                )}

                {/* Orçamentos */}
                {searchResults && searchResults.orcamentos.length > 0 && (
                  <SearchSection
                    title="Orçamentos"
                    icon={<Calculator className="w-3.5 h-3.5" />}
                  >
                    {searchResults.orcamentos.map((o) => (
                      <SearchItem
                        key={o.id}
                        title={o.name}
                        subtitle={o.status}
                        onClick={() => handleResultClick(`/orcamentos/${o.id}`)}
                      />
                    ))}
                  </SearchSection>
                )}

                {/* Documentos */}
                {searchResults && searchResults.documentos.length > 0 && (
                  <SearchSection
                    title="Documentos"
                    icon={<FolderOpen className="w-3.5 h-3.5" />}
                  >
                    {searchResults.documentos.map((d) => (
                      <SearchItem
                        key={d.id}
                        title={d.name}
                        subtitle={d.type}
                        onClick={() => handleResultClick(`/documentos`)}
                      />
                    ))}
                  </SearchSection>
                )}

                {/* Contatos */}
                {searchResults && searchResults.contatos.length > 0 && (
                  <SearchSection
                    title="Contatos"
                    icon={<Users className="w-3.5 h-3.5" />}
                  >
                    {searchResults.contatos.map((c) => (
                      <SearchItem
                        key={c.id}
                        title={c.name}
                        subtitle={c.email ?? c.role ?? ""}
                        onClick={() => handleResultClick(`/crm/contatos`)}
                      />
                    ))}
                  </SearchSection>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-sm">Notificações</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        const unreadIds = notifications?.filter((n) => !n.read).map((n) => n.id) ?? [];
                        if (unreadIds.length) markRead.mutate({ ids: unreadIds });
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications && notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => { if (!notif.read) markRead.mutate({ ids: [notif.id] }); }}
                        className={cn(
                          "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0",
                          !notif.read && "bg-primary/5"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                          <div className={cn("flex-1", notif.read && "pl-3.5")}>
                            <p className="text-sm font-medium">{notif.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notif.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                      Nenhuma notificação
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium leading-tight truncate max-w-[120px]">
                {session?.user?.name}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {session?.user?.companyName}
              </p>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/configuracoes/perfil"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Meu Perfil
                  </Link>
                  <Link
                    href="/configuracoes"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Configurações
                  </Link>
                  <hr className="my-1 border-border" />
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</span>
      </div>
      {children}
      <div className="my-1 border-t border-border last:hidden" />
    </div>
  );
}

function SearchItem({ title, subtitle, badge, onClick }: {
  title: string; subtitle?: string; badge?: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>}
      </div>
      {badge && (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate max-w-[120px] flex-shrink-0">
          {badge}
        </span>
      )}
    </button>
  );
}

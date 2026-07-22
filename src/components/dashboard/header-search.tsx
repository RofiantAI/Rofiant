"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  LayoutDashboard,
  MessageSquare,
  Key,
  BarChart3,
  Settings,
  Megaphone,
  Layout,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { DashboardSearchResult } from "@/app/api/dashboard/search/route";
import { canAccessTool } from "@/lib/service-plan-access";

type PageResult = {
  type: "page";
  id: string;
  title: string;
  href: string;
  subtitle?: string;
};

type SearchResult = DashboardSearchResult | PageResult;

type SiteScreen = { slug: string; label: string };

const TYPE_ICONS: Record<SearchResult["type"], LucideIcon> = {
  page: LayoutDashboard,
  conversation: MessageSquare,
};

function useSearchablePages(
  plan: string,
  isSiteOwner: boolean,
  siteScreens: SiteScreen[],
  t: ReturnType<typeof useTranslations<"dashboard.sidebar">>,
) {
  return useMemo(() => {
    const pages: { href: string; label: string; icon: LucideIcon }[] = [
      { href: "/chat", label: t("nav.chatAi"), icon: MessageSquare },
      { href: "/dashboard/usage", label: t("nav.usage"), icon: BarChart3 },
      { href: "/dashboard/audit-log", label: t("nav.auditLog"), icon: ShieldCheck },
    ];

    if (canAccessTool(plan, "apiKeys")) {
      pages.push({ href: "/dashboard/settings?tab=api", label: t("nav.apiKeys"), icon: Key });
    }

    pages.push({ href: "/dashboard/settings", label: t("accountSettings"), icon: Settings });

    if (isSiteOwner) {
      pages.push({
        href: "/dashboard/admin/broadcast",
        label: t("nav.siteBroadcast"),
        icon: Megaphone,
      });
    }

    for (const screen of siteScreens) {
      pages.push({
        href: `/dashboard/pages/${screen.slug}`,
        label: screen.label,
        icon: Layout,
      });
    }

    return pages;
  }, [isSiteOwner, plan, siteScreens, t]);
}

export function DashboardHeaderSearch({
  plan,
  isSiteOwner = false,
  siteScreens = [],
}: {
  plan: string;
  isSiteOwner?: boolean;
  siteScreens?: SiteScreen[];
}) {
  const router = useRouter();
  const tSidebar = useTranslations("dashboard.sidebar");
  const t = useTranslations("dashboard.globalSearch");
  const pages = useSearchablePages(plan, isSiteOwner, siteScreens, tSidebar);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiResults, setApiResults] = useState<DashboardSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const isActive = trimmed.length > 0;

  const pageResults = useMemo<PageResult[]>(() => {
    if (!isActive) return [];
    const q = trimmed.toLowerCase();
    return pages
      .filter((p) => p.label.toLowerCase().includes(q))
      .slice(0, 6)
      .map((p) => ({
        type: "page" as const,
        id: p.href,
        title: p.label,
        href: p.href,
      }));
  }, [isActive, pages, trimmed]);

  useEffect(() => {
    if (!isActive) {
      setApiResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/dashboard/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("Search failed");
        setApiResults((await res.json()) as DashboardSearchResult[]);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setApiResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, isActive]);

  const allResults = useMemo(
    () => [...pageResults, ...apiResults],
    [pageResults, apiResults],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [allResults.length, trimmed]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigate = useCallback(
    (result: SearchResult) => {
      setQuery("");
      setOpen(false);
      router.push(result.href);
    },
    [router],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || allResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % allResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + allResults.length) % allResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const result = allResults[activeIndex];
      if (result) navigate(result);
    }
  }

  const grouped = useMemo(() => {
    const groups: { key: SearchResult["type"]; label: string; items: SearchResult[] }[] = [];
    const order: SearchResult["type"][] = ["page", "conversation"];
    const labels: Record<SearchResult["type"], string> = {
      page: t("groups.pages"),
      conversation: t("groups.conversations"),
    };

    for (const type of order) {
      const items = allResults.filter((r) => r.type === type);
      if (items.length) groups.push({ key: type, label: labels[type], items });
    }
    return groups;
  }, [allResults, t]);

  let resultOffset = 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={t("placeholder")}
        aria-label={t("placeholder")}
        aria-expanded={open && isActive}
        aria-controls="dashboard-search-results"
        className="w-full h-9 pl-9 pr-14 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="p-1 text-foreground-muted hover:text-foreground transition-colors"
            aria-label={t("clear")}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline text-[10px] text-foreground-muted border border-border rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        )}
      </div>

      {open && isActive && (
        <div
          id="dashboard-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[min(420px,60vh)] overflow-y-auto rounded-xl border border-border bg-background-secondary shadow-xl"
        >
          {loading && allResults.length === 0 && (
            <p className="px-4 py-3 text-sm text-foreground-muted">{t("searching")}</p>
          )}
          {!loading && allResults.length === 0 && (
            <p className="px-4 py-3 text-sm text-foreground-muted">
              {t("noResults", { query: trimmed })}
            </p>
          )}
          {grouped.map((group) => (
            <div key={group.key}>
              <p className="px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted sticky top-0 bg-background-secondary border-b border-border">
                {group.label}
              </p>
              {group.items.map((result) => {
                const index = resultOffset++;
                const Icon = TYPE_ICONS[result.type];
                const isSelected = index === activeIndex;
                return (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.href}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(result);
                    }}
                    className={`flex items-start gap-3 px-4 py-3 text-sm transition-colors ${
                      isSelected
                        ? "bg-background-tertiary text-foreground"
                        : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 mt-0.5 text-foreground-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{result.title}</span>
                      {result.subtitle && (
                        <span className="block truncate text-xs text-foreground-muted mt-0.5">
                          {result.subtitle}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

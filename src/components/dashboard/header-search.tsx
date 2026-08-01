"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  LayoutDashboard,
  BarChart3,
  CreditCard,
  Settings,
  Layout,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

type PageResult = {
  type: "page";
  id: string;
  title: string;
  href: string;
  subtitle?: string;
  icon: LucideIcon;
};

type SiteScreen = { slug: string; label: string };

function useSearchablePages(
  plan: string,
  isSiteOwner: boolean,
  siteScreens: SiteScreen[],
  t: ReturnType<typeof useTranslations<"dashboard.sidebar">>,
) {
  return useMemo(() => {
    const pages: { href: string; label: string; icon: LucideIcon }[] = [
      { href: "/dashboard", label: t("nav.overview"), icon: LayoutDashboard },
      { href: "/dashboard/usage", label: t("nav.usage"), icon: BarChart3 },
      { href: "/dashboard/billing", label: t("nav.billing"), icon: CreditCard },
      { href: "/dashboard/settings", label: t("accountSettings"), icon: Settings },
    ];

    if (isSiteOwner) {
      pages.push({
        href: "/dashboard/admin/pages",
        label: t("nav.managePages"),
        icon: Layout,
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
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const isActive = trimmed.length > 0;

  const results = useMemo<PageResult[]>(() => {
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
        icon: p.icon,
      }));
  }, [isActive, pages, trimmed]);

  const activeIndexKey = `${trimmed}:${results.length}`;
  const [prevActiveIndexKey, setPrevActiveIndexKey] = useState(activeIndexKey);
  if (activeIndexKey !== prevActiveIndexKey) {
    setPrevActiveIndexKey(activeIndexKey);
    setActiveIndex(0);
  }

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
    (result: PageResult) => {
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
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const result = results[activeIndex];
      if (result) navigate(result);
    }
  }

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
        role="combobox"
        aria-expanded={open && isActive}
        aria-controls="dashboard-search-results"
        className="w-full h-9 pl-9 pr-14 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-foreground-muted transition-shadow focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="rounded p-1 text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
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
          {results.length === 0 && (
            <p className="px-4 py-3 text-sm text-foreground-muted">
              {t("noResults", { query: trimmed })}
            </p>
          )}
          {results.length > 0 && (
            <div>
              <p className="px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted sticky top-0 bg-background-secondary border-b border-border">
                {t("groups.pages")}
              </p>
              {results.map((result, index) => {
                const isSelected = index === activeIndex;
                return (
                  <Link
                    key={result.id}
                    href={result.href}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(result);
                    }}
                    className={`flex items-start gap-3 px-4 py-3 text-sm transition-colors focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-primary ${
                      isSelected
                        ? "bg-background-tertiary text-foreground"
                        : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                    }`}
                  >
                    <result.icon className="w-4 h-4 shrink-0 mt-0.5 text-foreground-muted" />
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
          )}
        </div>
      )}
    </div>
  );
}

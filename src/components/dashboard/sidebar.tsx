"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  CreditCard,
  Settings,
  Menu,
  X,
  Layout,
  ChevronDown,
  Headphones,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/brand-logo";
import { DashboardHeaderSearch } from "./header-search";
import { ContactModal } from "./contact-modal";
import { canAccessTool, type ProductTool } from "@/lib/service-plan-access";

function navItemVisible(plan: string, item: { tool?: ProductTool }) {
  return !item.tool || canAccessTool(plan, item.tool);
}

const developerNav: {
  href: string;
  navKey: string;
  tourId: string;
  icon: typeof BarChart3;
  exact?: boolean;
  tool?: ProductTool;
}[] = [
  { href: "/dashboard", navKey: "overview", tourId: "nav-overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/usage", navKey: "usage", tourId: "nav-usage", icon: BarChart3 },
  { href: "/dashboard/billing", navKey: "billing", tourId: "nav-billing", icon: CreditCard },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
      {children}
    </p>
  );
}

function NavBadge({ label, tone = "count" }: { label: string; tone?: "count" | "new" }) {
  const styles =
    tone === "new"
      ? "bg-emerald-500/15 text-emerald-400"
      : "bg-background-tertiary text-foreground-muted";
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${styles}`}>
      {label}
    </span>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  exact = false,
  tourId,
  badge,
  indent = false,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  tourId?: string;
  badge?: { label: string; tone?: "count" | "new" };
  indent?: boolean;
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      data-tour={tourId}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${indent ? "text-[13px]" : ""} ${
        active
          ? "bg-accent-primary/15 text-accent-primary font-medium"
          : "text-foreground-secondary hover:text-foreground hover:bg-background-tertiary/60"
      }`}
    >
      <Icon
        className={`w-4 h-4 shrink-0 ${active ? "text-accent-primary" : "text-foreground-muted"}`}
      />
      <span className="flex-1 truncate">{label}</span>
      {badge && <NavBadge {...badge} />}
    </Link>
  );
}

function NavIconItem({
  href,
  label,
  icon: Icon,
  exact = false,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
        active
          ? "bg-accent-primary/10 text-accent-primary"
          : "text-foreground-muted hover:text-foreground hover:bg-background-tertiary/60"
      }`}
    >
      <Icon className="w-4 h-4" />
    </Link>
  );
}

function NavButton({
  onClick,
  label,
  icon: Icon,
  className = "",
}: {
  onClick: () => void;
  label: string;
  icon: typeof LayoutDashboard;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${className}`}
    >
      <Icon className="w-4 h-4 shrink-0 text-foreground-muted" />
      <span className="flex-1 truncate text-left">{label}</span>
    </button>
  );
}

function NavGroup({
  label,
  icon: Icon,
  badge,
  defaultOpen = false,
  children,
}: {
  label: string;
  icon: typeof LayoutDashboard;
  badge?: { label: string; tone?: "count" | "new" };
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
      >
        <Icon className="w-4 h-4 shrink-0 text-foreground-muted" />
        <span className="flex-1 text-left truncate">{label}</span>
        {badge && <NavBadge {...badge} />}
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-foreground-muted transition-transform ${
            open ? "" : "-rotate-90"
          }`}
        />
      </button>
      {open && <div className="mt-0.5 flex flex-col gap-0.5 pl-6">{children}</div>}
    </div>
  );
}

type SiteScreenNav = {
  slug: string;
  label: string;
};

export function DashboardSidebar({
  email,
  name,
  plan = "free",
  isSiteOwner = false,
  siteScreens = [],
}: {
  email?: string;
  name?: string;
  plan?: string;
  isSiteOwner?: boolean;
  siteScreens?: SiteScreenNav[];
}) {
  const t = useTranslations("dashboard.sidebar");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    function openForTour() {
      setMobileOpen(true);
      setCollapsed(false);
    }
    window.addEventListener("dashboard-tour:open-sidebar", openForTour);
    return () => window.removeEventListener("dashboard-tour:open-sidebar", openForTour);
  }, []);

  useEffect(() => {
    // Read persisted collapse state after mount only, to keep SSR markup matching first paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(window.localStorage.getItem("dashboard-sidebar-collapsed") === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      window.localStorage.setItem("dashboard-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  const displayName = name?.trim() || email || "—";


  return (
    <>
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-border bg-background-secondary">
        <Link href="/dashboard" className="flex min-w-0 flex-1 items-center pr-3">
          <BrandLogo className="h-7 w-auto max-w-full" />
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label={t("openMenu")}
            data-tour="mobile-menu"
            className="flex items-center justify-center w-9 h-9 text-foreground-secondary"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        data-tour="sidebar"
        onClick={() => setMobileOpen(false)}
        className={`dashboard-sidebar fixed md:sticky inset-y-0 left-0 md:top-0 z-50 md:z-auto shrink-0 min-h-screen md:self-start border-r border-border bg-background-secondary flex flex-col transform transition-all duration-200 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-64 md:w-16" : "w-64"}`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMobileOpen(false);
          }}
          aria-label={t("closeMenu")}
          className="md:hidden absolute top-4 right-3 flex items-center justify-center w-8 h-8 text-foreground-muted"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={`hidden flex-1 min-h-0 flex-col items-center gap-1.5 py-4 ${collapsed ? "md:flex" : "md:hidden"}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapsed();
            }}
            aria-label={t("expandSidebar")}
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 text-foreground-muted hover:text-foreground hover:bg-background-tertiary/60"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>

          <div className="my-1.5 w-8 border-t border-border" />

          <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
            {developerNav
              .filter((item) => navItemVisible(plan, item))
              .map((item) => (
                <NavIconItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={t(`nav.${item.navKey}`)}
                  exact={item.exact}
                />
              ))}

            {siteScreens.length > 0 && (
              <NavIconItem href="/dashboard/pages" icon={Layout} label={t("sitePages")} />
            )}

            {isSiteOwner && (
              <NavIconItem href="/dashboard/admin/pages" icon={Layout} label={t("nav.managePages")} />
            )}
          </div>

          <div className="flex flex-col gap-1.5 pb-2">
            <NavIconItem href="/dashboard/settings" icon={Settings} label={t("accountSettings")} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setContactOpen(true);
              }}
              title={t("helpCenter")}
              aria-label={t("helpCenter")}
              className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 text-foreground-muted hover:text-foreground hover:bg-background-tertiary/60"
            >
              <Headphones className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={`flex flex-1 min-h-0 flex-col ${collapsed ? "md:hidden" : ""}`}>
          <div
            className="flex items-center gap-2 px-4 py-4 shrink-0 border-b border-border w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Link href="/dashboard" className="flex min-w-0 flex-1 items-center">
              <BrandLogo className="h-6 w-auto max-w-full" />
            </Link>
            <button
              onClick={toggleCollapsed}
              aria-label={t("collapseSidebar")}
              title={t("collapseSidebar")}
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg shrink-0 text-foreground-muted hover:text-foreground hover:bg-background-tertiary/60"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 pt-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            <DashboardHeaderSearch plan={plan} isSiteOwner={isSiteOwner} siteScreens={siteScreens} />
          </div>

          <nav className="flex-1 py-4 px-3 flex flex-col gap-1.5 overflow-y-auto">
            <SectionLabel>{t("mainMenu")}</SectionLabel>

            {developerNav
              .filter((item) => navItemVisible(plan, item))
              .map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={t(`nav.${item.navKey}`)}
                  tourId={item.tourId}
                  exact={item.exact}
                />
              ))}

            {siteScreens.length > 0 && (
              <NavGroup label={t("sitePages")} icon={Layout} defaultOpen={pathname.startsWith("/dashboard/pages")}>
                {siteScreens.map((screen) => (
                  <NavItem
                    key={screen.slug}
                    href={`/dashboard/pages/${screen.slug}`}
                    icon={Layout}
                    label={screen.label}
                    indent
                  />
                ))}
              </NavGroup>
            )}

            {isSiteOwner && (
              <NavItem
                href="/dashboard/admin/pages"
                icon={Layout}
                label={t("nav.managePages")}
              />
            )}
          </nav>

          <div className="px-3 pb-3 flex flex-col gap-1.5 border-t border-border pt-3">
            <SectionLabel>{t("others")}</SectionLabel>
            <NavItem href="/dashboard/settings" icon={Settings} label={t("accountSettings")} />
            <NavButton onClick={() => setContactOpen(true)} icon={Headphones} label={t("helpCenter")} />
          </div>
        </div>
      </aside>

      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        name={displayName}
        email={email}
      />
    </>
  );
}

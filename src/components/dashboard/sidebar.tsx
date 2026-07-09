"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Mic,
  FileText,
  Brain,
  Key,
  BarChart3,
  Settings,
  Building2,
  Users,
  CreditCard,
  Radio,
  BookOpen,
  Menu,
  X,
  ShieldCheck,
  User,
  Megaphone,
  Layout,
  Landmark,
  ClipboardCheck,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/brand-logo";
import { canAccessTool, type ProductTool } from "@/lib/service-plan-access";

function navItemVisible(plan: string, item: { tool?: ProductTool }) {
  return !item.tool || canAccessTool(plan, item.tool);
}

const coreNav = [
  { href: "/dashboard", navKey: "overview", tourId: "nav-overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/services", navKey: "toolsHub", icon: Wrench },
  { href: "/chat", navKey: "chatAi", tourId: "nav-chat", icon: MessageSquare },
  { href: "/dashboard/documents", navKey: "documents", tourId: "nav-documents", icon: FileText, tool: "documents" as const },
  { href: "/dashboard/voice-ai", navKey: "voiceAi", icon: Mic, tool: "voice" as const },
  { href: "/dashboard/agents", navKey: "agents", tourId: "nav-agents", icon: Brain, tool: "agents" as const },
];

const developerNav = [
  { href: "/dashboard/usage", navKey: "usage", tourId: "nav-usage", icon: BarChart3 },
  { href: "/dashboard/api-keys", navKey: "apiKeys", tourId: "nav-api-keys", icon: Key, tool: "apiKeys" as const },
  { href: "/dashboard/audit-log", navKey: "auditLog", icon: ShieldCheck, tool: "security" as const },
];

const agencyNav = [
  { href: "/dashboard/agency", navKey: "agencyOverview", icon: Building2, exact: true },
  { href: "/dashboard/agency/intelligence", navKey: "intelligence", icon: Radio, govOnly: true },
  { href: "/dashboard/agency/access-review", navKey: "accessReview", icon: ClipboardCheck },
  { href: "/dashboard/agency/broadcast", navKey: "broadcast", icon: Megaphone },
  { href: "/dashboard/agency/members", navKey: "members", icon: Users, teamOnly: true },
  { href: "/dashboard/knowledge-bases", navKey: "knowledgeBases", icon: BookOpen },
  { href: "/dashboard/agency/billing", navKey: "billing", icon: CreditCard },
  { href: "/dashboard/agency/settings", navKey: "agencySettings", icon: Settings },
];

function NavItem({
  href,
  label,
  icon: Icon,
  exact = false,
  tourId,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  tourId?: string;
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      data-tour={tourId}
      className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors ${
        active
          ? "bg-background-tertiary text-foreground font-medium"
          : "text-foreground-secondary hover:text-foreground hover:bg-background-tertiary/60"
      }`}
    >
      <Icon
        className={`w-4 h-4 shrink-0 ${active ? "text-accent-primary" : "text-foreground-muted"}`}
      />
      {label}
    </Link>
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
  locale = "en",
  isSiteOwner = false,
  siteScreens = [],
}: {
  email?: string;
  name?: string;
  plan?: string;
  locale?: string;
  isSiteOwner?: boolean;
  siteScreens?: SiteScreenNav[];
}) {
  const t = useTranslations("dashboard.sidebar");
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAgency = ["agency", "enterprise"].includes(plan);
  const isTeam = ["team", "pilot", "agency", "enterprise"].includes(plan);
  const isGov = ["agency", "enterprise"].includes(plan);
  const hasWorkflows = canAccessTool(plan, "workflows");
  const hasKnowledgeBases = canAccessTool(plan, "knowledgeBases");
  const hasApiKeys = canAccessTool(plan, "apiKeys");

  useEffect(() => {
    function openForTour() {
      setMobileOpen(true);
    }
    window.addEventListener("dashboard-tour:open-sidebar", openForTour);
    return () => window.removeEventListener("dashboard-tour:open-sidebar", openForTour);
  }, []);

  const displayName = name?.trim() || email || "—";
  const planLabel =
    plan === "enterprise" ? t("plans.enterprise")
    : plan === "agency" ? t("plans.agency")
    : plan === "pilot" ? t("plans.pilot")
    : plan === "team" ? t("plans.team")
    : plan === "pro" ? t("plans.pro")
    : t("plans.free");

  const productNav = [
    ...coreNav.filter((item) => navItemVisible(plan, item)),
    ...(hasWorkflows
      ? [{ href: "/dashboard/agency/solutions", navKey: "missionSolutions", icon: Landmark, exact: false }]
      : []),
    ...(hasKnowledgeBases && !isAgency
      ? [{ href: "/dashboard/knowledge-bases", navKey: "knowledgeBases", icon: BookOpen, exact: false }]
      : []),
  ];

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
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto w-60 shrink-0 min-h-screen border-r border-border bg-background-secondary flex flex-col transform transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
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

        <div className="h-20 px-5 border-b border-border flex items-center shrink-0">
          <Link href="/dashboard" className="flex h-full min-w-0 flex-1 items-center py-4">
            <BrandLogo className="h-full w-auto max-w-full" />
          </Link>
        </div>

        <nav className="flex-1 py-4 px-3 flex flex-col gap-6 overflow-y-auto">
          <div>
            <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
              {t("product")}
            </p>
            <div className="flex flex-col gap-0.5">
              {productNav.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={t(`nav.${item.navKey}`)}
                  exact={"exact" in item ? item.exact : undefined}
                  tourId={"tourId" in item ? item.tourId : undefined}
                />
              ))}
            </div>
          </div>

          {isAgency && (
            <div>
              <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
                {t("agency")}
              </p>
              <div className="flex flex-col gap-0.5">
                {agencyNav
                  .filter((item) => !("teamOnly" in item && item.teamOnly && !isTeam))
                  .filter((item) => !("govOnly" in item && item.govOnly && !isGov))
                  .map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      label={t(`nav.${item.navKey}`)}
                      exact={"exact" in item ? item.exact : undefined}
                    />
                  ))}
              </div>
            </div>
          )}

          {siteScreens.length > 0 && (
            <div>
              <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
                {t("sitePages")}
              </p>
              <div className="flex flex-col gap-0.5">
                {siteScreens.map((screen) => (
                  <NavItem
                    key={screen.slug}
                    href={`/dashboard/pages/${screen.slug}`}
                    icon={Layout}
                    label={screen.label}
                  />
                ))}
              </div>
            </div>
          )}

          {isSiteOwner && (
            <div>
              <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
                {t("siteAdmin")}
              </p>
              <div className="flex flex-col gap-0.5">
                <NavItem
                  href="/dashboard/admin/broadcast"
                  icon={Megaphone}
                  label={t("nav.siteBroadcast")}
                />
              </div>
            </div>
          )}

          <div>
            <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
              {t("developer")}
            </p>
            <div className="flex flex-col gap-0.5">
              {developerNav
                .filter((item) => navItemVisible(plan, item))
                .map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={t(`nav.${item.navKey}`)}
                    tourId={"tourId" in item ? item.tourId : undefined}
                  />
                ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 w-full px-2 py-2">
            <div className="w-8 h-8 shrink-0 rounded-md bg-background-tertiary border border-border flex items-center justify-center">
              <User className="w-4 h-4 text-foreground-muted" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm text-foreground truncate">{displayName}</p>
              <p className="text-xs text-foreground-muted">{planLabel}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft, Home, Settings2, Sparkles, MoreHorizontal, LogOut,
  CreditCard, ExternalLink, Gift, Check, Copy, Building2, Zap, Crown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { routing } from "@/i18n/routing";
import { UserAvatar } from "@/components/dashboard/user-avatar-button";
import { DashboardCard } from "@/components/dashboard/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import {
  UsageAnalytics,
  type UsageDayPoint,
  type SourceBreakdown,
  type ModelUsageRow,
} from "@/app/(dashboard)/dashboard/usage/usage-charts";
import { SettingsClient } from "@/app/(dashboard)/dashboard/settings/settings-client";
import { TABS as SETTINGS_TABS, type Tab as SettingsSectionTab } from "@/app/(dashboard)/dashboard/settings/settings-tab-sidebar";

type Tab = "overview" | "plan" | "settings";

const PLAN_META: Record<string, { label: string; tagline: string; price: number }> = {
  free: { label: "Free", tagline: "Start automating today", price: 0 },
  pro: { label: "Pro", tagline: "For power users", price: 15 },
  ultra: { label: "Ultra", tagline: "For your heaviest workloads", price: 30 },
};

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, ultra: 2 };
const TIER_ORDER = ["free", "pro", "ultra"] as const;
const TIER_ICON: Record<string, typeof Building2> = { free: Building2, pro: Zap, ultra: Crown };

const TIER_FEATURES: Record<string, { intro?: string; items: string[] }> = {
  free: {
    items: [
      "Local file, command & app tools",
      "Chat with hosted or local models",
      "MCP server support",
      "Unlimited tasks",
    ],
  },
  pro: {
    intro: "Everything in Free and:",
    items: ["Our most capable models", "Multi-step Agents", "Full API access"],
  },
  ultra: {
    intro: "Everything in Pro, plus:",
    items: [
      "5x higher usage limits",
      "First access to new models",
      "Priority support",
      "Early access to new features",
    ],
  },
};

const MARKETING_ORIGIN =
  process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://www.rofiant.ca";

function InviteFriendsCard({ userId, referralCount }: { userId: string; referralCount: number }) {
  const [copied, setCopied] = useState(false);
  const inviteLink = `${MARKETING_ORIGIN}/en/auth/signup?ref=${userId}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DashboardCard>
      <div className="flex items-center gap-2 mb-1">
        <Gift className="w-4 h-4 text-foreground-muted" />
        <span className="text-sm font-medium text-foreground">Invite friends</span>
      </div>
      <p className="text-sm text-foreground-secondary mb-4">
        Share your link. {referralCount > 0 && (
          <span className="text-foreground-secondary">
            {referralCount} {referralCount === 1 ? "person has" : "people have"} joined so far.
          </span>
        )}
      </p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={inviteLink}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 h-9 px-3 text-xs font-mono text-foreground-secondary bg-background-tertiary border border-border rounded-lg truncate"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium border border-border rounded-lg text-foreground hover:bg-background-tertiary transition-colors shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </DashboardCard>
  );
}

function ManagePlanTab({ plan }: { plan: string }) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");
  const currentRank = PLAN_RANK[plan] ?? 0;
  const currentMeta = PLAN_META[plan] ?? PLAN_META.free;

  async function openBillingPortal() {
    setPortalError("");
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal");
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setPortalError(data.error ?? "Couldn't open the billing portal.");
    } catch {
      setPortalError("Couldn't open the billing portal.");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Manage plan</h1>
        <p className="text-sm text-foreground-secondary mt-1">
          Compare plans, upgrade for higher limits, or manage your existing subscription.
        </p>
      </div>

      <DashboardCard>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-foreground-muted uppercase tracking-wider mb-1">Current plan</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">{currentMeta.label}</span>
              <span className="text-sm text-foreground-muted">
                {currentMeta.price === 0 ? "Free" : `$${currentMeta.price}/mo`}
              </span>
            </div>
            {portalError && (
              <p role="alert" className="text-xs text-red-400 mt-2">
                {portalError}
              </p>
            )}
          </div>
          {currentRank > 0 && (
            <button
              type="button"
              onClick={openBillingPortal}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium border border-border rounded-lg text-foreground hover:bg-background-tertiary disabled:opacity-50 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              {portalLoading ? "Opening…" : "Manage billing"}
              <ExternalLink className="w-3.5 h-3.5 text-foreground-muted" />
            </button>
          )}
        </div>
      </DashboardCard>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {TIER_ORDER.map((tier) => {
          const rank = PLAN_RANK[tier];
          const isCurrent = tier === plan;
          const isUpgrade = rank > currentRank;
          const Icon = TIER_ICON[tier];
          const { intro: featuresIntro, items: features } = TIER_FEATURES[tier];

          return (
            <div
              key={tier}
              className={`flex flex-col p-8 rounded-2xl border ${
                isCurrent
                  ? "border-accent-primary/40 bg-accent-primary/5 ring-1 ring-accent-primary/20"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5 text-foreground-muted" />
                <h2 className="text-xl font-normal text-foreground">{PLAN_META[tier].label}</h2>
                {isCurrent && (
                  <Badge variant="success" className="ml-auto">
                    Current
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {PLAN_META[tier].tagline}
              </p>
              <div className="mb-8 mt-5">
                {PLAN_META[tier].price === 0 ? (
                  <div className="text-4xl font-normal text-foreground">Free</div>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-normal text-foreground">
                      ${PLAN_META[tier].price}
                    </span>
                    <span className="text-sm text-foreground-muted mb-1.5">/mo</span>
                  </div>
                )}
              </div>

              <div className="mb-10 flex-1">
                {featuresIntro && (
                  <p className="text-sm text-foreground-secondary mb-3">{featuresIntro}</p>
                )}
                <ul className="space-y-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-foreground-secondary">
                      <Check className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto">
                {isCurrent ? (
                  <div className="h-10 flex items-center justify-center text-sm text-foreground-muted border border-dashed border-border rounded-lg">
                    Your current plan
                  </div>
                ) : isUpgrade ? (
                  <Link
                    href={`/api/checkout?plan=${tier}`}
                    className="inline-flex items-center justify-center w-full h-10 px-5 text-sm font-medium bg-foreground text-background hover:opacity-90 rounded-lg transition-colors"
                  >
                    Upgrade to {PLAN_META[tier].label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={openBillingPortal}
                    disabled={portalLoading}
                    className="inline-flex items-center justify-center w-full h-10 px-5 text-sm font-medium border border-border rounded-lg text-foreground hover:bg-background-tertiary disabled:opacity-50 transition-colors"
                  >
                    Downgrade
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChatSettingsShell({
  displayName,
  avatarUrl,
  isPro,
  plan,
  chartData,
  sourceBreakdown,
  modelRows,
  referralCount,
  settingsProps,
}: {
  displayName: string;
  avatarUrl: string | null;
  isPro: boolean;
  plan: string;
  chartData: UsageDayPoint[];
  sourceBreakdown: SourceBreakdown[];
  modelRows: ModelUsageRow[];
  referralCount: number;
  settingsProps: {
    email: string;
    userId: string;
    displayName: string;
    bio: string;
    avatarUrl: string | null;
    hasCustomAvatar: boolean;
    plan: string;
  };
}) {
  const planMeta = PLAN_META[plan] ?? PLAN_META.free;
  const [tab, setTab] = useState<Tab>("overview");
  const [settingsTab, setSettingsTab] = useState<SettingsSectionTab>("account");
  const tSettings = useTranslations("dashboard.settings");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push(`/${routing.defaultLocale}/auth/login`);
  }

  const totalRequests = modelRows.reduce((sum, m) => sum + m.requests, 0);
  const totalTokens = modelRows.reduce((sum, m) => sum + m.tokens, 0);

  return (
    <div className="flex h-full min-h-0">
      <aside className="w-64 shrink-0 border-r border-border flex flex-col justify-between py-4 px-3">
        <div>
          <Link
            href="/chat"
            className="flex items-center gap-2 px-2 py-2 mb-4 text-sm text-foreground-secondary hover:text-foreground rounded-md hover:bg-background-tertiary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to chat
          </Link>
          <nav className="space-y-1">
            <button
              onClick={() => setTab("overview")}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-md transition-colors text-left ${
                tab === "overview"
                  ? "bg-background-tertiary text-foreground font-medium"
                  : "text-foreground-secondary hover:text-foreground hover:bg-background-tertiary/60"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              Overview
            </button>
            <button
              onClick={() => setTab("plan")}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-md transition-colors text-left ${
                tab === "plan"
                  ? "bg-background-tertiary text-foreground font-medium"
                  : "text-foreground-secondary hover:text-foreground hover:bg-background-tertiary/60"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Manage plan
            </button>
            <button
              onClick={() => setTab("settings")}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-md transition-colors text-left ${
                tab === "settings"
                  ? "bg-background-tertiary text-foreground font-medium"
                  : "text-foreground-secondary hover:text-foreground hover:bg-background-tertiary/60"
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              Settings
            </button>
            {tab === "settings" && (
              <div className="ml-[1.1rem] pl-3 border-l border-border space-y-0.5 py-1">
                {SETTINGS_TABS.map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSettingsTab(id)}
                    className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-md transition-colors text-left ${
                      settingsTab === id
                        ? "bg-background-tertiary text-foreground font-medium"
                        : "text-foreground-secondary hover:text-foreground hover:bg-background-tertiary/60"
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        id === "danger" && settingsTab !== "danger"
                          ? "text-red-400/60"
                          : settingsTab === id
                            ? "text-accent-primary"
                            : "text-foreground-muted"
                      }`}
                    />
                    <span className={id === "danger" ? "text-red-400/80" : ""}>
                      {tSettings(`tabs.${id}`)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </nav>
        </div>

        <div className="space-y-2">
          {!isPro && (
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm border border-border rounded-lg text-foreground hover:bg-background-tertiary transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Upgrade to Pro
            </Link>
          )}

          <div className="relative" ref={menuRef}>
            {menuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1.5 rounded-lg bg-card border border-border shadow-xl py-1 overflow-hidden">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="My account"
              className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-background-tertiary transition-colors"
            >
              <UserAvatar avatarUrl={avatarUrl} className="w-8 h-8 shrink-0 border border-border" />
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm text-foreground truncate">{displayName}</div>
                <div className="text-xs text-foreground-muted">{planMeta.label}</div>
              </div>
              <MoreHorizontal className="w-4 h-4 shrink-0 text-foreground-muted" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        {tab === "overview" ? (
          <div className="space-y-6 max-w-5xl">
            <div className="grid gap-4 md:grid-cols-2">
              <DashboardCard>
                <p className="text-sm text-foreground-muted mb-2">Your usage (30 days)</p>
                <p className="text-2xl font-semibold text-foreground">
                  {totalTokens.toLocaleString()} tokens
                </p>
                <p className="text-xs text-foreground-muted mt-1">
                  {totalRequests.toLocaleString()} requests across all models
                </p>
              </DashboardCard>

              <DashboardCard>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-semibold text-foreground">{planMeta.label}</span>
                  <span className="text-sm text-foreground-muted">${planMeta.price}/mo</span>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">
                  {isPro
                    ? "Access to premium models, unlimited usage, and more."
                    : "Entry-level plan with access to premium models, unlimited usage, and more."}
                </p>
                {isPro ? (
                  <Badge variant="success">Current plan</Badge>
                ) : (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center px-3 py-1.5 text-sm rounded-md bg-foreground text-background hover:opacity-90 transition-opacity"
                  >
                    Upgrade to Pro
                  </Link>
                )}
              </DashboardCard>
            </div>

            <InviteFriendsCard userId={settingsProps.userId} referralCount={referralCount} />

            <UsageAnalytics
              chartData={chartData}
              sourceBreakdown={sourceBreakdown}
              modelRows={modelRows}
            />
          </div>
        ) : tab === "plan" ? (
          <ManagePlanTab plan={plan} />
        ) : (
          <SettingsClient
            {...settingsProps}
            tab={settingsTab}
            onTabChange={setSettingsTab}
            hideSidebar
          />
        )}
      </div>
    </div>
  );
}

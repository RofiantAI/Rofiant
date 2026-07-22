"use client";

import Link from "next/link";
import { ArrowLeft, User, Shield, Key, Bell, Globe, Palette, AlertTriangle } from "lucide-react";
import type { useTranslations } from "next-intl";

export type Tab = "account" | "security" | "api" | "notifications" | "preferences" | "appearance" | "danger";

const TABS: { id: Tab; icon: React.ElementType }[] = [
  { id: "account", icon: User },
  { id: "security", icon: Shield },
  { id: "api", icon: Key },
  { id: "notifications", icon: Bell },
  { id: "preferences", icon: Globe },
  { id: "appearance", icon: Palette },
  { id: "danger", icon: AlertTriangle },
];

export function SettingsTabSidebar({
  tab,
  setTab,
  t,
  backHref,
  backLabel,
}: {
  tab: Tab;
  setTab: (tab: Tab) => void;
  t: ReturnType<typeof useTranslations>;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible shrink-0 md:w-44 pb-1 md:pb-0">
      {backHref && (
        <Link
          href={backHref}
          className="shrink-0 md:w-full flex items-center gap-2.5 px-3 py-2 mb-2 text-sm rounded-md text-foreground-secondary hover:text-foreground hover:bg-background-tertiary/60 transition-colors md:border-b md:border-border md:pb-3 md:mb-3 md:rounded-none"
        >
          <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0 text-foreground-muted" />
          <span>{backLabel}</span>
        </Link>
      )}
      {TABS.map(({ id, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          className={`shrink-0 md:w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors text-left ${
            tab === id
              ? "bg-background-tertiary text-foreground font-medium"
              : "text-foreground-secondary hover:text-foreground hover:bg-background-tertiary/60"
          }`}
        >
          <Icon
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              id === "danger" && tab !== "danger"
                ? "text-red-400/60"
                : tab === id
                  ? "text-accent-primary"
                  : "text-foreground-muted"
            }`}
          />
          <span className={id === "danger" ? "text-red-400/80" : ""}>{t(`tabs.${id}`)}</span>
        </button>
      ))}
    </nav>
  );
}

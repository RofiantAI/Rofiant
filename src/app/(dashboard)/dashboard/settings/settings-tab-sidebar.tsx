"use client";

import Link from "next/link";
import { ArrowLeft, User, Shield, Bell, Globe, Palette, AlertTriangle } from "lucide-react";
import type { useTranslations } from "next-intl";

export type Tab = "account" | "security" | "notifications" | "preferences" | "appearance" | "danger";

export const TABS: { id: Tab; icon: React.ElementType }[] = [
  { id: "account", icon: User },
  { id: "security", icon: Shield },
  { id: "notifications", icon: Bell },
  { id: "preferences", icon: Globe },
  { id: "appearance", icon: Palette },
];

const DANGER_TAB: { id: Tab; icon: React.ElementType } = { id: "danger", icon: AlertTriangle };

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
    <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible shrink-0 md:w-48 pb-1 md:pb-0">
      {backHref && (
        <Link
          href={backHref}
          className="shrink-0 md:w-full flex items-center gap-2.5 px-3 py-2 mb-2 text-sm rounded-xl text-foreground-secondary hover:text-foreground hover:bg-background-tertiary/60 transition-colors md:border-b md:border-border md:pb-3 md:mb-3 md:rounded-none"
        >
          <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0 text-foreground-muted" />
          <span>{backLabel}</span>
        </Link>
      )}
      {TABS.map(({ id, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          className={`relative shrink-0 md:w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors text-left ${
            tab === id
              ? "bg-accent-primary/10 text-foreground font-medium"
              : "text-foreground-secondary hover:text-foreground hover:bg-background-tertiary/60"
          }`}
        >
          {tab === id && (
            <span className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-accent-primary" />
          )}
          <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${tab === id ? "text-accent-primary" : "text-foreground-muted"}`} />
          <span>{t(`tabs.${id}`)}</span>
        </button>
      ))}

      <div className="hidden md:block my-2 border-t border-border" />

      <button
        onClick={() => setTab(DANGER_TAB.id)}
        className={`shrink-0 md:w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors text-left ${
          tab === DANGER_TAB.id
            ? "bg-red-500/10 text-red-400 font-medium"
            : "text-red-400/70 hover:text-red-400 hover:bg-red-500/5"
        }`}
      >
        <DANGER_TAB.icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{t(`tabs.${DANGER_TAB.id}`)}</span>
      </button>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "./user-avatar-button";

export function WorkspaceMenu({
  orgName,
  displayName,
  email,
  avatarUrl,
  locale,
  isPaid,
}: {
  orgName?: string | null;
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
  locale: string;
  isPaid: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("dashboard.sidebar");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const title = orgName?.trim() || displayName;

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        data-tour="user-menu"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("accountMenu")}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-background-tertiary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
      >
        <div className="relative shrink-0">
          <UserAvatar avatarUrl={avatarUrl} className="w-9 h-9" />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background-secondary bg-accent-success" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          {email && <p className="truncate font-mono text-xs text-foreground-muted">{email}</p>}
        </div>
        <ChevronsUpDown className="w-4 h-4 shrink-0 text-foreground-muted" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-xl border border-border bg-background-secondary shadow-xl">
          <div className="py-1">
            {!isPaid && (
              <Link
                href={`/${locale}/pricing`}
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-primary"
              >
                <ArrowUpRight className="w-4 h-4" />
                {t("upgrade")}
              </Link>
            )}
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-primary"
            >
              <Settings className="w-4 h-4" />
              {t("accountSettings")}
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-foreground-muted transition-colors hover:bg-background-tertiary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-primary"
            >
              <LogOut className="w-4 h-4" />
              {t("signOut")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

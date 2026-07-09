"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, LogOut, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { UserAvatarButton } from "./user-avatar-button";

export function DashboardUserMenu({
  displayName,
  email,
  avatarUrl,
  locale,
  isPaid,
}: {
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

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        data-tour="user-menu"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("accountMenu")}
        aria-expanded={open}
        className="flex items-center justify-center rounded-full hover:opacity-90 transition-opacity overflow-hidden p-0 ring-0 border-0 bg-transparent"
      >
        <UserAvatarButton avatarUrl={avatarUrl} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 rounded-lg border border-border bg-background-secondary shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            {email && (
              <p className="text-xs text-foreground-muted truncate mt-0.5">{email}</p>
            )}
          </div>
          <div className="py-1">
            {!isPaid && (
              <Link
                href={`/${locale}/pricing`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-foreground-secondary hover:text-foreground hover:bg-background-tertiary transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" />
                {t("upgrade")}
              </Link>
            )}
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-foreground-secondary hover:text-foreground hover:bg-background-tertiary transition-colors"
            >
              <Settings className="w-4 h-4" />
              {t("accountSettings")}
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-foreground-muted hover:text-foreground hover:bg-background-tertiary transition-colors"
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

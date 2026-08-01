"use client";

import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkspaceMenu } from "./workspace-menu";

export function DashboardTopbar({
  displayName,
  orgName,
  email,
  avatarUrl,
  locale,
  isPaid,
}: {
  displayName: string;
  orgName?: string | null;
  email?: string;
  avatarUrl?: string | null;
  locale: string;
  isPaid: boolean;
}) {
  const t = useTranslations("dashboard.topbar");

  return (
    <div className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background-secondary px-4 sm:px-6 md:px-8">
      <p className="min-w-0 truncate text-base font-semibold text-foreground">
        {t("greeting", { name: displayName })}
      </p>
      <div className="flex shrink-0 items-center gap-1.5">
        <ThemeToggle />
        <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
        <div className="w-48">
          <WorkspaceMenu
            orgName={orgName}
            displayName={displayName}
            email={email}
            avatarUrl={avatarUrl}
            locale={locale}
            isPaid={isPaid}
          />
        </div>
      </div>
    </div>
  );
}

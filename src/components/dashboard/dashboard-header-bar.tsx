"use client";

import { DashboardHeaderSearch } from "./header-search";
import { DashboardNotifications } from "./dashboard-notifications";
import { DashboardUserMenu } from "./dashboard-user-menu";

type SiteScreen = { slug: string; label: string };

export function DashboardHeaderBar({
  plan,
  locale,
  displayName,
  email,
  avatarUrl,
  isPaid,
  isSiteOwner = false,
  siteScreens = [],
}: {
  plan: string;
  locale: string;
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
  isPaid: boolean;
  isSiteOwner?: boolean;
  siteScreens?: SiteScreen[];
}) {
  return (
    <header className="sticky top-0 z-20 h-20 border-b border-border bg-background-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-background-secondary/80">
      <div className="flex h-full items-center px-4 sm:px-6 md:px-8">
        <div className="flex w-full items-center gap-3">
          <div className="flex-1 min-w-0">
            <DashboardHeaderSearch
              plan={plan}
              isSiteOwner={isSiteOwner}
              siteScreens={siteScreens}
            />
          </div>
          <DashboardNotifications />
          <DashboardUserMenu
            displayName={displayName}
            email={email}
            avatarUrl={avatarUrl}
            locale={locale}
            isPaid={isPaid}
          />
        </div>
      </div>
    </header>
  );
}

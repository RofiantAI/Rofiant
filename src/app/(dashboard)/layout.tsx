import { NextIntlClientProvider } from "next-intl";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { routing } from "@/i18n/routing";
import { getDashboardLocale, getDashboardMessages } from "@/i18n/dashboard-locale";
import { getSiteNavScreens } from "@/lib/site-pages";
import { isSiteOwner } from "@/lib/site-owner";
import { DashboardOnboarding } from "@/components/dashboard/onboarding/dashboard-onboarding";
import { getUserAvatarUrl } from "@/lib/user-avatar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const locale = await getDashboardLocale();
  const messages = await getDashboardMessages(locale);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${routing.defaultLocale}/auth/login`);

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
    redirect(`/${routing.defaultLocale}/auth/mfa`);
  }

  const plan: string = (user.user_metadata?.plan ?? "free" as string).toLowerCase();

  const siteScreens = await getSiteNavScreens(supabase);

  const displayName =
    user.user_metadata?.full_name?.trim() || user.email?.split("@")[0] || "there";
  const avatarUrl = getUserAvatarUrl(user);
  const isPaid = ["pro", "ultra"].includes(plan);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <DashboardOnboarding
        displayName={displayName}
        isPaid={isPaid}
        tourSeen={Boolean(user.user_metadata?.dashboard_tour_seen)}
      />
      <div className="flex min-h-screen bg-background flex-col md:flex-row">
        <DashboardSidebar
          email={user.email}
          name={user.user_metadata?.full_name}
          plan={plan}
          isSiteOwner={isSiteOwner(user.email)}
          siteScreens={siteScreens.map((s) => ({
            slug: s.slug,
            label: s.nav_label ?? s.title,
          }))}
        />
        <main className="flex-1 min-w-0 flex flex-col">
          <DashboardTopbar
            displayName={displayName}
            email={user.email}
            avatarUrl={avatarUrl}
            locale={locale}
            isPaid={isPaid}
          />
          <div className="flex-1 bg-background p-4 sm:p-6 md:p-8" data-tour="main-content">
            <div className="max-w-6xl mx-auto min-h-[min(50vh,420px)]" data-tour="workspace">
              {children}
            </div>
          </div>
        </main>
      </div>
    </NextIntlClientProvider>
  );
}

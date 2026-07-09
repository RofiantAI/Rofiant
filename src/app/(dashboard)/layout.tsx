import { NextIntlClientProvider } from "next-intl";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { InviteBanner } from "@/components/dashboard/invite-banner";
import { AnnouncementBanner } from "@/components/dashboard/announcement-banner";
import { routing } from "@/i18n/routing";
import { getDashboardLocale, getDashboardMessages } from "@/i18n/dashboard-locale";
import { getActiveSiteAnnouncements, getSiteNavScreens } from "@/lib/site-broadcast";
import { isSiteOwner } from "@/lib/site-owner";
import { DashboardOnboarding } from "@/components/dashboard/onboarding/dashboard-onboarding";
import { DashboardHeaderBar } from "@/components/dashboard/dashboard-header-bar";
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

  const admin = createAdminClient();
  const { data: pendingRows } = await admin
    .from("agency_members")
    .select("id, role, agency_id")
    .eq("user_id", user.id)
    .eq("status", "pending");

  let pendingInvites: { id: string; agencyName: string; role: string }[] = [];

  if (pendingRows && pendingRows.length > 0) {
    const agencyIds = pendingRows.map((r: { agency_id: string }) => r.agency_id);
    const { data: agencies } = await admin
      .from("agencies")
      .select("id, name")
      .in("id", agencyIds);

    const agencyMap = Object.fromEntries(
      (agencies ?? []).map((a: { id: string; name: string }) => [a.id, a.name])
    );

    pendingInvites = pendingRows.map((r: { id: string; role: string; agency_id: string }) => ({
      id: r.id,
      agencyName: agencyMap[r.agency_id] ?? "An agency",
      role: r.role,
    }));
  }

  const [announcements, siteScreens] = await Promise.all([
    getActiveSiteAnnouncements(supabase),
    getSiteNavScreens(supabase),
  ]);

  const displayName =
    user.user_metadata?.full_name?.trim() || user.email?.split("@")[0] || "there";
  const avatarUrl = getUserAvatarUrl(user);
  const isPaid = ["pro", "team", "pilot", "agency", "enterprise"].includes(plan);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <DashboardOnboarding userId={user.id} displayName={displayName} isPaid={isPaid} />
      <div className="flex min-h-screen bg-background flex-col md:flex-row">
        <DashboardSidebar
          email={user.email}
          name={user.user_metadata?.full_name}
          plan={plan}
          locale={locale}
          isSiteOwner={isSiteOwner(user.email)}
          siteScreens={siteScreens.map((s) => ({
            slug: s.slug,
            label: s.nav_label ?? s.title,
          }))}
        />
        <main className="flex-1 min-w-0 overflow-auto flex flex-col">
          <DashboardHeaderBar
            plan={plan}
            locale={locale}
            displayName={displayName}
            email={user.email ?? undefined}
            avatarUrl={avatarUrl}
            isPaid={isPaid}
            isSiteOwner={isSiteOwner(user.email)}
            siteScreens={siteScreens.map((s) => ({
              slug: s.slug,
              label: s.nav_label ?? s.title,
            }))}
          />
          <AnnouncementBanner
            dismissLabel={messages.dashboard?.announcementBanner?.dismiss ?? "Dismiss"}
            announcements={announcements.map((a) => ({
              id: a.id,
              title: a.title,
              body: a.body,
              variant: a.variant,
            }))}
          />
          {pendingInvites.length > 0 && <InviteBanner invites={pendingInvites} />}
          <div className="flex-1 p-4 sm:p-6 md:p-8" data-tour="main-content">
            <div className="max-w-6xl mx-auto min-h-[min(50vh,420px)]" data-tour="workspace">
              {children}
            </div>
          </div>
        </main>
      </div>
    </NextIntlClientProvider>
  );
}

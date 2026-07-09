import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { routing } from "@/i18n/routing";
import { AgencySettingsClient } from "./settings-client";
import { DashboardPage, DashboardHeader } from "@/components/dashboard/ui/page-shell";

export default async function AgencySettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${routing.defaultLocale}/auth/login`);

  const planRaw: string = user.user_metadata?.plan ?? "free";
  const plan = planRaw.toLowerCase();
  const isPaid = ["pro", "team", "pilot", "agency", "enterprise"].includes(plan);
  if (!isPaid) redirect("/dashboard/agency");

  let { data: agency } = await supabase
    .from("agencies")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!agency) {
    const { data: created } = await supabase
      .from("agencies")
      .insert({ owner_id: user.id, name: "My Agency" })
      .select()
      .single();

    if (created) {
      await supabase.from("agency_members").insert({
        agency_id: created.id,
        user_id: user.id,
        email: user.email,
        role: "admin",
        status: "active",
        joined_at: new Date().toISOString(),
      });
      agency = created;
    }
  }

  if (!agency) redirect("/dashboard/agency");

  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.agency.settings" });

  return (
    <DashboardPage>
      <DashboardHeader title={t("title")} description={t("subtitle")} />
      <AgencySettingsClient
      agencyId={agency.id}
      agencyName={agency.name}
      agencyDescription={agency.description ?? ""}
      agencyWebsite={agency.website ?? ""}
      defaultMemberRole={agency.default_member_role ?? "member"}
      membersCanInvite={agency.members_can_invite ?? false}
      require2fa={agency.require_2fa ?? false}
      allowedDomains={agency.allowed_domains ?? []}
      notifyMemberJoined={agency.notify_member_joined ?? true}
      notifyMemberLeft={agency.notify_member_left ?? true}
      ownerEmail={user.email ?? ""}
      plan={plan}
      scimConfigured={!!agency.scim_token}
      ssoDomain={agency.sso_domain ?? ""}
    />
    </DashboardPage>
  );
}

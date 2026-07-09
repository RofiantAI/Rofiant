import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, Building2, MessageSquare, FileText, Brain, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { routing } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import {
  DashboardPage,
  DashboardHeader,
  DashboardMetricGrid,
  DashboardMetric,
  DashboardCard,
  DashboardSection,
  DashboardUpgradeGate,
} from "@/components/dashboard/ui/page-shell";

export default async function AgencyOverviewPage() {
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.agency.overview" });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${routing.defaultLocale}/auth/login`);

  const userId = user.id;
  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  const isPaid = ["pro", "team", "pilot", "agency", "enterprise"].includes(plan);
  const isTeamOrAbove = ["team", "pilot", "agency", "enterprise"].includes(plan);

  if (!isPaid) {
    return (
      <DashboardPage>
        <DashboardHeader title={t("title")} description={t("subtitle")} />
        <DashboardUpgradeGate
          icon={Building2}
          title={t("upsell.title")}
          description={t("upsell.description")}
          ctaHref={`/${locale}/pricing`}
          ctaLabel={t("upsell.cta")}
        />
      </DashboardPage>
    );
  }

  let { data: agency } = await supabase
    .from("agencies")
    .select("*")
    .eq("owner_id", userId)
    .single();

  if (!agency) {
    const { data: created } = await supabase
      .from("agencies")
      .insert({ owner_id: userId, name: "My Agency" })
      .select()
      .single();

    if (created) {
      await supabase.from("agency_members").insert({
        agency_id: created.id,
        user_id: userId,
        email: user.email,
        role: "admin",
        status: "active",
        joined_at: new Date().toISOString(),
      });
      agency = created;
    }
  }

  const [
    { data: members },
    { count: convCount },
    { count: docCount },
    { count: agentCount },
  ] = await Promise.all([
    supabase
      .from("agency_members")
      .select("id, email, role, status")
      .eq("agency_id", agency?.id ?? "")
      .order("invited_at", { ascending: false })
      .limit(8),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("documents").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "indexed"),
    supabase.from("agents").select("*", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const allMembers = members ?? [];
  const activeMembers = allMembers.filter((m) => m.status === "active").length;
  const pendingMembers = allMembers.filter((m) => m.status === "pending").length;

  const planLabel =
    plan === "enterprise" ? "Enterprise"
    : plan === "agency" ? "Agency"
    : plan === "pilot" ? "Pilot"
    : plan === "team" ? "Team"
    : "Pro";

  return (
    <DashboardPage>
      <DashboardHeader
        title={agency?.name ?? t("title")}
        description={
          <>
            {t("headerSubtitle")} · <span className="text-foreground">{planLabel}</span>
          </>
        }
        action={
          isTeamOrAbove ? (
            <Link
              href="/dashboard/agency/members"
              className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium border border-border text-foreground-secondary hover:bg-background-tertiary transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t("inviteMember")}
            </Link>
          ) : undefined
        }
      />

      <DashboardMetricGrid>
        <DashboardMetric
          label={t("stats.teamMembers")}
          value={String(activeMembers)}
          sub={pendingMembers > 0 ? t("stats.pendingInvite", { count: pendingMembers }) : t("stats.active")}
          href="/dashboard/agency/members"
          icon={Users}
        />
        <DashboardMetric
          label={t("stats.conversations")}
          value={(convCount ?? 0).toLocaleString()}
          sub={t("stats.yourWorkspace")}
          href="/chat"
          icon={MessageSquare}
        />
        <DashboardMetric
          label={t("stats.documents")}
          value={(docCount ?? 0).toLocaleString()}
          sub={t("stats.indexed")}
          href="/dashboard/documents"
          icon={FileText}
        />
        <DashboardMetric
          label={t("stats.agents")}
          value={(agentCount ?? 0).toLocaleString()}
          sub={t("stats.deployed")}
          href="/dashboard/agents"
          icon={Brain}
        />
      </DashboardMetricGrid>

      <DashboardSection
        title={t("teamMembersPanel.title")}
        action={
          <Link href="/dashboard/agency/members" className="text-xs text-foreground-muted hover:text-foreground inline-flex items-center gap-1">
            {t("teamMembersPanel.manage")}
            <ArrowRight className="w-3 h-3" />
          </Link>
        }
      >
        <DashboardCard padding={false}>
          {allMembers.length > 0 ? (
            <div className="divide-y divide-border">
              {allMembers.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-background-tertiary border border-border flex items-center justify-center text-xs font-medium text-foreground-secondary uppercase">
                      {m.email[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{m.email}</p>
                      <p className="text-xs text-foreground-muted capitalize">{m.role}</p>
                    </div>
                  </div>
                  <span className={`text-xs capitalize ${m.status === "active" ? "text-accent-success" : "text-foreground-muted"}`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-foreground-secondary">{t("teamMembersPanel.empty")}</p>
              {isTeamOrAbove && (
                <Link href="/dashboard/agency/members" className="inline-block mt-3 text-sm text-accent-primary hover:underline">
                  {t("teamMembersPanel.inviteFirst")}
                </Link>
              )}
            </div>
          )}
        </DashboardCard>
      </DashboardSection>
    </DashboardPage>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  CreditCard,
  ArrowUpRight,
  CheckCircle2,
  Zap,
  Users,
  Download,
  ShieldCheck,
  Mail,
  FileText,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { routing } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { ExportDataButton } from "./export-data-button";
import { getOrgPlanSupport, isContractPlan } from "@/lib/org-plan-config";
import { isOrgPlan } from "@/lib/agency-org";
import {
  DashboardPage,
  DashboardHeader,
  DashboardCard,
  DashboardSection,
  DashboardMetricGrid,
  DashboardMetric,
  DashboardSecondaryButton,
} from "@/components/dashboard/ui/page-shell";

const PLAN_COLORS: Record<string, string> = {
  pro: "text-accent-secondary border-accent-secondary/20 bg-accent-secondary/10",
  team: "text-accent-primary border-accent-primary/20 bg-accent-primary/10",
  pilot: "text-accent-primary border-accent-primary/20 bg-accent-primary/10",
  agency: "text-accent-primary border-accent-primary/20 bg-accent-primary/10",
  enterprise: "text-accent-primary border-accent-primary/20 bg-accent-primary/10",
};

export default async function AgencyBillingPage() {
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.agency.billing" });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${routing.defaultLocale}/auth/login`);

  const userId = user.id;
  const plan: string = (user.user_metadata?.plan ?? "free" as string).toLowerCase();
  const isPaid = ["pro", "team", "pilot", "agency", "enterprise"].includes(plan);
  if (!isPaid) redirect("/dashboard/agency");

  const contractPlan = isContractPlan(plan);
  const orgPlan = isOrgPlan(plan);
  const orgSupport = getOrgPlanSupport();

  const details = {
    label: t(`plans.${plan}.label`),
    price: t(`plans.${plan}.price`),
    features: t.raw(`plans.${plan}.features`) as string[],
    color: PLAN_COLORS[plan],
  };

  const { data: userConvs } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId);
  const convIds = (userConvs ?? []).map((c) => c.id);

  const [{ count: convCount }, msgCount] = await Promise.all([
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("user_id", userId),
    convIds.length > 0
      ? supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", convIds)
      : Promise.resolve({ count: 0 }),
  ]);
  const { count: docCount } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const billingStatus = contractPlan
    ? t("currentPlan.billedContract")
    : t("currentPlan.billedMonthly");
  const subscriptionLabel = contractPlan
    ? t("currentPlan.subscriptionContract")
    : t("currentPlan.subscriptionActive");

  return (
    <DashboardPage>
      <DashboardHeader title={t("title")} description={t("subtitle")} />

      <div className="max-w-3xl space-y-6">
        <DashboardCard padding={false}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-foreground-muted" />
              <span className="text-sm font-medium text-foreground">{t("currentPlan.title")}</span>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded ${details.color}`}>
              {details.label}
            </span>
          </div>

          <div className="px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold tabular-nums text-foreground">{details.price}</p>
                <p className="text-sm text-foreground-secondary mt-1">{billingStatus}</p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-accent-success">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {subscriptionLabel}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-foreground-muted">{t("currentPlan.account")}</p>
                <p className="text-sm text-foreground mt-0.5">{user.email}</p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
              {details.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-success shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </DashboardCard>

        {orgPlan && (
          <>
            <DashboardSection title={t("orgSupport.title")}>
              <DashboardCard className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-foreground-muted mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("orgSupport.csmLabel")}</p>
                    <a
                      href={`mailto:${orgSupport.csmEmail}`}
                      className="text-sm text-accent-primary hover:underline mt-0.5 inline-block"
                    >
                      {orgSupport.csmEmail}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 pt-3 border-t border-border">
                  <ShieldCheck className="w-4 h-4 text-foreground-muted mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("orgSupport.slaLabel")}</p>
                    <p className="text-sm text-foreground-secondary mt-0.5">{orgSupport.slaSummary}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pt-3 border-t border-border">
                  <Globe className="w-4 h-4 text-foreground-muted mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("orgSupport.hostingLabel")}</p>
                    <p className="text-sm text-foreground-secondary mt-0.5">{orgSupport.dataResidency}</p>
                  </div>
                </div>
              </DashboardCard>
            </DashboardSection>

            <DashboardSection title={t("complianceDocs.title")}>
              <DashboardCard className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href={`/${locale}/legal/fedramp`}
                  className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  {t("complianceDocs.fedrampLink")}
                </Link>
                <Link
                  href={`/${locale}/resources/compliance-guides`}
                  className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  {t("complianceDocs.guidesLink")}
                </Link>
                <Link
                  href="/dashboard/agency/access-review"
                  className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  {t("complianceDocs.accessReviewLink")}
                </Link>
                <Link
                  href="/dashboard/agency/settings#sso"
                  className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  {t("complianceDocs.ssoLink")}
                </Link>
              </DashboardCard>
            </DashboardSection>
          </>
        )}

        <DashboardSection title={t("usage.title")}>
          <DashboardMetricGrid>
            <DashboardMetric
              label={t("usage.conversations")}
              value={(convCount ?? 0).toLocaleString()}
              sub={t("usage.unlimited")}
              icon={Zap}
            />
            <DashboardMetric
              label={t("usage.messages")}
              value={(msgCount.count ?? 0).toLocaleString()}
              sub={t("usage.unlimited")}
            />
            <DashboardMetric
              label={t("usage.documents")}
              value={(docCount ?? 0).toLocaleString()}
              sub={t("usage.unlimited")}
            />
          </DashboardMetricGrid>
        </DashboardSection>

        {plan === "pro" && (
          <DashboardCard>
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-background-tertiary border border-border shrink-0">
                <Users className="w-4 h-4 text-foreground-muted" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{t("upgrade.title")}</p>
                <p className="text-sm text-foreground-secondary mt-1">{t("upgrade.description")}</p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 mt-4 h-9 px-4 text-sm font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors"
                >
                  {t("upgrade.cta")}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </DashboardCard>
        )}

        {!contractPlan && (
          <DashboardCard className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">{t("manageSubscription.title")}</p>
              <p className="text-xs text-foreground-muted mt-0.5">{t("manageSubscription.description")}</p>
            </div>
            <Link href="/pricing">
              <DashboardSecondaryButton>
                {t("manageSubscription.cta")}
                <ArrowUpRight className="w-3 h-3" />
              </DashboardSecondaryButton>
            </Link>
          </DashboardCard>
        )}

        {contractPlan && (
          <DashboardCard className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">{t("manageContract.title")}</p>
              <p className="text-xs text-foreground-muted mt-0.5">{t("manageContract.description")}</p>
            </div>
            <a href={`mailto:${orgSupport.csmEmail}`}>
              <DashboardSecondaryButton>
                {t("manageContract.cta")}
                <ArrowUpRight className="w-3 h-3" />
              </DashboardSecondaryButton>
            </a>
          </DashboardCard>
        )}

        <DashboardCard className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Download className="w-4 h-4 text-foreground-muted mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{t("exportData.title")}</p>
              <p className="text-xs text-foreground-muted mt-0.5">{t("exportData.description")}</p>
            </div>
          </div>
          <ExportDataButton
            label={t("exportData.cta")}
            loadingLabel={t("exportData.loading")}
          />
        </DashboardCard>
      </div>
    </DashboardPage>
  );
}

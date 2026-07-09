import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import {
  resolveServiceSlug,
  SERVICE_SLUG_TO_KEY,
  SERVICE_CATEGORY_SLUGS,
} from "@/lib/service-categories";
import {
  canAccessTool,
  TOOL_DASHBOARD_HREFS,
  serviceCategoryToTool,
} from "@/lib/service-plan-access";
import { PlanToolGate } from "@/components/dashboard/plan-tool-gate";

export default async function DashboardServiceToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolved = resolveServiceSlug(slug);
  if (!resolved) notFound();

  if (resolved === "legacy-voice") {
    redirect("/dashboard/voice-ai");
  }

  const key = SERVICE_SLUG_TO_KEY[resolved];
  const tool = serviceCategoryToTool(key);
  const href = TOOL_DASHBOARD_HREFS[tool];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const plan = (user?.user_metadata?.plan ?? "free").toLowerCase();

  if (canAccessTool(plan, tool) && href) {
    redirect(href);
  }

  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "services" });

  return (
    <PlanToolGate
      plan={plan}
      tool={tool}
      title={t(`categories.${key}.name`)}
      description={t(`categories.${key}.offerings`)}
    >
      {null}
    </PlanToolGate>
  );
}

export function generateStaticParams() {
  return SERVICE_CATEGORY_SLUGS.map((slug) => ({ slug }));
}

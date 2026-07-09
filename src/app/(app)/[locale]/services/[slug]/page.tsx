import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageLayout } from "@/components/page-layout";
import { ArrowRight } from "lucide-react";
import {
  resolveServiceSlug,
  SERVICE_SLUG_TO_KEY,
  SERVICE_CATEGORY_SLUGS,
  serviceToolHref,
} from "@/lib/service-categories";
import { appUrl } from "@/lib/app-url";

export default async function ServiceToolGatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolved = resolveServiceSlug(slug);
  if (!resolved) notFound();

  if (resolved === "legacy-voice") {
    redirect("/services/voice");
  }

  const key = SERVICE_SLUG_TO_KEY[resolved];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(serviceToolHref(key));
  }
  const t = await getTranslations("services");
  const tTool = await getTranslations("services.toolGate");

  return (
    <PageLayout
      badge={t("badge")}
      title={t(`categories.${key}.name`)}
      subtitle={t(`categories.${key}.offerings`)}
    >
      <div className="border border-border p-8 max-w-2xl">
        <p className="text-sm text-foreground-secondary mb-2">{tTool("clientsLabel")}</p>
        <p className="text-sm font-medium text-foreground mb-6">{t(`categories.${key}.clients`)}</p>
        <p className="text-foreground-secondary mb-8">{tTool("description")}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={appUrl(`/auth/signup?next=${encodeURIComponent(serviceToolHref(key))}`)}
            className="inline-flex items-center justify-center gap-2 h-11 px-6 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            {tTool("signup")}
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href={appUrl(`/auth/login?next=${encodeURIComponent(serviceToolHref(key))}`)}
            className="inline-flex items-center justify-center gap-2 h-11 px-6 text-sm font-medium border border-border text-foreground hover:bg-background-tertiary transition-colors"
          >
            {tTool("login")}
          </a>
        </div>
      </div>

      <p className="mt-8 text-sm text-foreground-muted">
        <Link href="/services" className="hover:text-foreground transition-colors">
          ← {tTool("back")}
        </Link>
      </p>
    </PageLayout>
  );
}

export function generateStaticParams() {
  return [
    ...SERVICE_CATEGORY_SLUGS.map((slug) => ({ slug })),
    { slug: "defence-intelligence" },
  ];
}

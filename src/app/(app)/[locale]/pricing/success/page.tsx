import { CheckCircle, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function PricingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const t = await getTranslations("pricing.success");
  const { plan: planParam } = await searchParams;
  const plan = planParam ?? "pro";
  const label = plan === "ultra" ? t("planUltra") : t("planPro");

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-accent-success/10 border border-accent-success/20">
          <CheckCircle className="w-8 h-8 text-accent-success" />
        </div>

        <h1 className="text-3xl font-normal text-foreground mb-3">
          {t("welcomeTitle", { plan: label })}
        </h1>
        <p className="text-foreground-secondary mb-10">
          {t("subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/chat"
            className="inline-flex items-center justify-center gap-2 h-10 px-6 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            {t("openChat")}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/chat/settings"
            className="inline-flex items-center justify-center h-10 px-6 text-sm font-medium border border-border text-foreground hover:bg-background-tertiary transition-colors"
          >
            {t("goToDashboard")}
          </Link>
        </div>
      </div>
    </div>
  );
}

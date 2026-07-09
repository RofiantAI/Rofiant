import { PageLayout } from "@/components/page-layout";
import { getTranslations } from "next-intl/server";

export default async function ITARPolicyPage() {
  const t = await getTranslations("legal.itarPolicy");

  return (
    <PageLayout
      badge="LEGAL"
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <div className="prose prose-invert max-w-none space-y-6 text-foreground-secondary text-sm leading-relaxed">
        <h2 className="text-lg font-semibold text-foreground">{t("overviewHeading")}</h2>
        <p>
          {t("overviewBody")}
        </p>

        <h2 className="text-lg font-semibold text-foreground">{t("dataControlsHeading")}</h2>
        <p>
          {t("dataControlsBody")}
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          {t("accessRestrictionsHeading")}
        </h2>
        <p>
          {t("accessRestrictionsBody")}
        </p>

        <h2 className="text-lg font-semibold text-foreground">{t("contactHeading")}</h2>
        <p>
          {t("contactBody")}
        </p>
      </div>
    </PageLayout>
  );
}

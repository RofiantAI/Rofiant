import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Target, Code, Eye } from "lucide-react";

export default async function AboutPage() {
  const t = await getTranslations("company.about");


  return (
    <PageLayout
      badge={t("badge")}
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <div className="space-y-8 text-foreground-secondary leading-relaxed">
        <p className="text-lg">{t("intro1")}</p>
        <p>{t("intro2")}</p>
        <p>{t("intro3")}</p>

      </div>
    </PageLayout>
  );
}

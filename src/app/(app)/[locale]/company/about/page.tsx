import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Target, Code, Eye } from "lucide-react";

export default async function AboutPage() {
  const t = await getTranslations("company.about");

  const values = [
    { key: "missionFirst", icon: Target },
    { key: "developerFirst", icon: Code },
    { key: "transparent", icon: Eye },
  ] as const;

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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 pt-8">
          {values.map((v) => {
            const Icon = v.icon;

            return (
              <Card key={v.key} variant="bordered" className="p-6 h-full">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">{t(`values.${v.key}.title`)}</h3>
                <p className="mt-2 text-sm text-foreground-secondary">{t(`values.${v.key}.desc`)}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}

import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Lock, Key, FileText, Server, Globe, Bell } from "lucide-react";

export default async function SecurityPage() {
  const t = await getTranslations("company.security");

  const areas = [
    { key: "encryption", icon: Lock },
    { key: "accessControl", icon: Key },
    { key: "auditLogging", icon: FileText },
    { key: "infrastructure", icon: Server },
    { key: "dataResidency", icon: Globe },
    { key: "incidentResponse", icon: Bell },
  ] as const;

  return (
    <PageLayout
      badge={t("badge")}
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {areas.map((a) => {
          const Icon = a.icon;

          return (
            <Card key={a.key} variant="bordered" className="p-6 h-full">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground">{t(`areas.${a.key}.title`)}</h3>
              <p className="mt-2 text-sm text-foreground-secondary">{t(`areas.${a.key}.desc`)}</p>
            </Card>
          );
        })}
      </div>
    </PageLayout>
  );
}

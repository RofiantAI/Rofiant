import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { Lock, Key, Server, Globe, Bell } from "lucide-react";

type Tone = "primary" | "secondary" | "success" | "warning" | "orange";

const toneStyles: Record<Tone, string> = {
  primary: "bg-accent-primary/10 text-accent-primary",
  secondary: "bg-accent-secondary/10 text-accent-secondary",
  success: "bg-accent-success/10 text-accent-success",
  warning: "bg-accent-warning/10 text-accent-warning",
  orange: "bg-accent-orange/10 text-accent-orange",
};

export default async function SecurityPage() {
  const t = await getTranslations("company.security");

  const supportingAreas = [
    { key: "infrastructure", icon: Server, tone: "primary" },
    { key: "dataResidency", icon: Globe, tone: "secondary" },
    { key: "encryption", icon: Lock, tone: "warning" },
    { key: "incidentResponse", icon: Bell, tone: "orange" },
  ] satisfies { key: string; icon: typeof Lock; tone: Tone }[];

  return (
    <PageLayout badge={t("badge")} title={t("title")} subtitle={t("subtitle")}>
      <div className="border border-border p-8 sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-success/10 text-accent-success">
          <Key className="w-6 h-6" />
        </div>
        <h2 className="mt-6 text-xl font-semibold text-foreground">
          {t("areas.accessControl.title")}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-foreground-secondary">
          {t("areas.accessControl.desc")}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
        {supportingAreas.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.key} className="flex gap-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneStyles[a.tone]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t(`areas.${a.key}.title`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground-secondary">
                  {t(`areas.${a.key}.desc`)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
}

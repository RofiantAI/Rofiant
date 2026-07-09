"use client";

import { Link } from "@/i18n/navigation";
import { PageLayout } from "@/components/page-layout";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  SERVICE_CATEGORY_KEYS,
  SERVICE_CATEGORY_HREFS,
  type ServiceCategoryKey,
} from "@/lib/service-categories";

export default function ServicesPage() {
  const t = useTranslations("services");

  return (
    <PageLayout badge={t("badge")} title={t("title")} subtitle={t("subtitle")}>
      <div className="border border-border overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background-secondary">
              <th className="px-6 py-4 font-medium text-foreground-muted uppercase tracking-wider">
                {t("columns.category")}
              </th>
              <th className="px-6 py-4 font-medium text-foreground-muted uppercase tracking-wider">
                {t("columns.offerings")}
              </th>
              <th className="px-6 py-4 font-medium text-foreground-muted uppercase tracking-wider">
                {t("columns.clients")}
              </th>
              <th className="px-6 py-4 font-medium text-foreground-muted uppercase tracking-wider">
                {t("columns.action")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {SERVICE_CATEGORY_KEYS.map((key: ServiceCategoryKey) => (
              <tr key={key} className="bg-card hover:bg-background-secondary/50 transition-colors">
                <td className="px-6 py-5 align-top">
                  <Link
                    href={SERVICE_CATEGORY_HREFS[key]}
                    className="font-medium text-foreground hover:underline"
                  >
                    {t(`categories.${key}.name`)}
                  </Link>
                </td>
                <td className="px-6 py-5 align-top text-foreground-secondary">
                  {t(`categories.${key}.offerings`)}
                </td>
                <td className="px-6 py-5 align-top text-foreground-secondary">
                  {t(`categories.${key}.clients`)}
                </td>
                <td className="px-6 py-5 align-top">
                  <Link
                    href={SERVICE_CATEGORY_HREFS[key]}
                    className="inline-flex items-center gap-1 text-sm font-medium text-accent-primary hover:underline"
                  >
                    {t("openTool")}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-20 border border-border p-10 text-center">
        <h2 className="text-2xl font-normal text-foreground mb-3">{t("cta.title")}</h2>
        <p className="text-foreground-secondary mb-8 max-w-xl mx-auto">{t("cta.subtitle")}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/company/contact"
            className="inline-flex items-center gap-2 h-11 px-6 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            {t("cta.talkToSales")}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/solutions"
            className="inline-flex items-center gap-2 h-11 px-6 text-sm font-medium border border-border text-foreground hover:bg-background-tertiary transition-colors"
          >
            {t("cta.viewPlans")}
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}

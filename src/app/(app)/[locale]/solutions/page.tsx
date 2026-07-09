"use client";

import { Link } from "@/i18n/navigation";
import { PageLayout } from "@/components/page-layout";
import { CheckCircle, ArrowRight, Shield, Building2, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

const tierMeta = [
  { key: "pilot", icon: Shield, highlighted: false },
  { key: "agency", icon: Building2, highlighted: true },
  { key: "enterprise", icon: Lock, highlighted: false },
] as const;

export default function PricingPage() {
  const t = useTranslations("solutions");
  const includedItems = t.raw("included.items") as string[];
  const faqs = t.raw("faqs") as { q: string; a: string }[];

  return (
    <PageLayout
      badge={t("badge")}
      title={t("title")}
      subtitle={t("subtitle")}
    >
      {/* Tiers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-4">
        {tierMeta.map((tier) => {
          const Icon = tier.icon;
          const features = t.raw(`tiers.${tier.key}.features`) as string[];
          return (
            <div
              key={tier.key}
              className={`flex flex-col border p-8 ${
                tier.highlighted
                  ? "border-foreground bg-card"
                  : "border-border bg-card"
              }`}
            >
              {tier.highlighted && (
                <div className="text-xs font-medium uppercase tracking-widest text-foreground mb-6 pb-4 border-b border-border">
                  {t("mostCommon")}
                </div>
              )}
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5 text-foreground-muted" />
                <h2 className="text-xl font-normal text-foreground">{t(`tiers.${tier.key}.name`)}</h2>
              </div>
              <p className="text-sm font-medium text-foreground mb-2">{t(`tiers.${tier.key}.tagline`)}</p>
              <p className="text-sm text-foreground-secondary mb-8">{t(`tiers.${tier.key}.description`)}</p>

              <div className="text-sm font-medium text-foreground-muted uppercase tracking-wider mb-4">
                {t("customPricing")}
              </div>

              <ul className="space-y-3 mb-10 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground-secondary">
                    <CheckCircle className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/company/contact"
                className={`inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-medium transition-colors ${
                  tier.highlighted
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "border border-border text-foreground hover:bg-background-tertiary"
                }`}
              >
                {t(`tiers.${tier.key}.cta`)}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Baseline inclusions */}
      <div className="mt-16 border border-border p-8">
        <h2 className="text-sm font-medium text-foreground-muted uppercase tracking-wider mb-6">
          {t("included.title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {includedItems.map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-foreground-secondary">
              <CheckCircle className="w-4 h-4 text-foreground shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-20">
        <h2 className="text-2xl font-normal text-foreground mb-8">{t("faqTitle")}</h2>
        <div className="divide-y divide-border border border-border">
          {faqs.map((faq) => (
            <div key={faq.q} className="p-6">
              <h3 className="text-sm font-medium text-foreground mb-2">{faq.q}</h3>
              <p className="text-sm text-foreground-secondary">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-20 border border-border p-10 text-center">
        <h2 className="text-2xl font-normal text-foreground mb-3">{t("cta.title")}</h2>
        <p className="text-foreground-secondary mb-8 max-w-xl mx-auto">
          {t("cta.subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/company/contact"
            className="inline-flex items-center gap-2 h-11 px-6 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            {t("cta.talkToSales")}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/resources/documentation"
            className="inline-flex items-center gap-2 h-11 px-6 text-sm font-medium border border-border text-foreground hover:bg-background-tertiary transition-colors"
          >
            {t("cta.readDocs")}
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}

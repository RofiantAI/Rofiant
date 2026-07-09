"use client";

import { PageLayout } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Users, Building2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

const consumerTierMeta = [
  { key: "free", icon: Building2, price: { monthly: 0, annual: 0 }, href: "/auth/signup", highlighted: false, perUser: false },
  { key: "pro", icon: Zap, price: { monthly: 15, annual: 12 }, href: "/api/checkout?plan=pro", highlighted: true, perUser: false },
  { key: "team", icon: Users, price: { monthly: 25, annual: 20 }, href: "/api/checkout?plan=team", highlighted: false, perUser: true },
] as const;

export default function PricingPage() {
  const t = useTranslations("pricing");
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const includedItems = t.raw("included.items") as string[];
  const faqs = t.raw("faq.items") as { q: string; a: string }[];

  return (
    <PageLayout
      badge={t("badge")}
      title={t("heroTitle")}
      subtitle={t("heroSubtitle")}
    >
      {/* Billing toggle */}
      <div className="flex items-center gap-4 mt-2">
        <span className={`text-sm font-medium ${!annual ? "text-foreground" : "text-foreground-muted"}`}>
          {t("billing.monthly")}
        </span>
        <button
          onClick={() => setAnnual((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            annual ? "bg-accent-primary" : "bg-background-tertiary border border-border"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              annual ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${annual ? "text-foreground" : "text-foreground-muted"}`}>
          {t("billing.annual")}
        </span>
        {annual && (
          <Badge variant="success" className="text-xs">
            {t("billing.save")}
          </Badge>
        )}
      </div>

      {/* Consumer tiers */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {consumerTierMeta.map((tier) => {
          const Icon = tier.icon;
          const price = annual ? tier.price.annual : tier.price.monthly;
          const features = t.raw(`consumerTiers.${tier.key}.features`) as string[];
          return (
            <div
              key={tier.key}
              className={`flex flex-col p-8 border ${
                tier.highlighted
                  ? "border-foreground bg-card"
                  : "border-border bg-card"
              }`}
            >
              {tier.highlighted && (
                <div className="text-xs font-medium uppercase tracking-widest text-foreground mb-6 pb-4 border-b border-border">
                  {t("mostPopular")}
                </div>
              )}
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5 text-foreground-muted" />
                <h2 className="text-xl font-normal text-foreground">{t(`consumerTiers.${tier.key}.name`)}</h2>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">{t(`consumerTiers.${tier.key}.tagline`)}</p>
              <p className="text-sm text-foreground-secondary mb-6">{t(`consumerTiers.${tier.key}.description`)}</p>
              <div className="mb-8">
                {price === 0 ? (
                  <div className="text-4xl font-normal text-foreground">{t("free")}</div>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-normal text-foreground">${price}</span>
                    <span className="text-sm text-foreground-muted mb-1.5">
                      {tier.perUser ? t("perMonthPerUser") : t("perMonth")}
                    </span>
                  </div>
                )}
                {annual && price > 0 && (
                  <p className="text-xs text-foreground-muted mt-1">
                    {tier.perUser
                      ? t("billedAnnuallyPerUser", { price: price * 12 })
                      : t("billedAnnually", { price: price * 12 })}
                  </p>
                )}
              </div>
              <ul className="space-y-3 mb-10 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground-secondary">
                    <Check className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={tier.href}
                className={`inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-medium transition-colors ${
                  tier.highlighted
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "border border-border text-foreground hover:bg-background-tertiary"
                }`}
              >
                {t(`consumerTiers.${tier.key}.cta`)}
              </a>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-foreground-muted">{t("fairUseNote")}</p>

      {/* Included on every plan */}
      <div className="mt-12 border border-border p-8">
        <h2 className="text-sm font-medium text-foreground-muted uppercase tracking-wider mb-6">
          {t("included.title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {includedItems.map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-foreground-secondary">
              <Check className="w-4 h-4 text-foreground shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-20">
        <h2 className="text-2xl font-normal text-foreground mb-8">{t("faq.title")}</h2>
        <div className="divide-y divide-border border border-border">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-background-tertiary/50 transition-colors"
              >
                <span className="font-medium text-foreground text-sm">{faq.q}</span>
                <span className={`ml-4 shrink-0 text-foreground-muted transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 text-sm text-foreground-secondary leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

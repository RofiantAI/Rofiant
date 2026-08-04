"use client";

import { useState } from "react";
import { Zap, Crown, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ManageBillingButton } from "@/components/dashboard/manage-billing-button";

const TIERS = [
  { key: "free", icon: Building2, price: { monthly: 0, annual: 0 } },
  { key: "pro", icon: Zap, price: { monthly: 15, annual: 12 } },
  { key: "ultra", icon: Crown, price: { monthly: 30, annual: 25 } },
] as const;

export function BillingPlanTiers({ plan, isPaid }: { plan: string; isPaid: boolean }) {
  const t = useTranslations("dashboard.billing");
  const [annual, setAnnual] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-foreground">{t("plans.title")}</h2>
          <p className="text-xs text-foreground-muted mt-0.5">{t("plans.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-xs font-medium ${!annual ? "text-foreground" : "text-foreground-muted"}`}>
            {t("plans.monthly")}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            onClick={() => setAnnual((v) => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
              annual ? "bg-accent-primary" : "bg-background-tertiary border border-border"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                annual ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`text-xs font-medium ${annual ? "text-foreground" : "text-foreground-muted"}`}>
            {t("plans.annual")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const price = annual ? tier.price.annual : tier.price.monthly;
          const isCurrent = tier.key === plan;
          const href = `/api/checkout?plan=${tier.key}${annual ? "&interval=annual" : ""}`;

          return (
            <div
              key={tier.key}
              className={`flex flex-col p-5 rounded-2xl border ${
                isCurrent ? "border-accent-primary bg-accent-primary/5" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <Icon className="w-4 h-4 text-foreground-muted" />
                <h3 className="text-sm font-medium text-foreground">{t(`plans.${tier.key}.name`)}</h3>
                {isCurrent && (
                  <span className="ml-auto rounded-full bg-accent-primary/15 text-accent-primary text-[10px] font-medium px-2 py-0.5">
                    {t("plans.currentBadge")}
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground-muted mb-4">{t(`plans.${tier.key}.tagline`)}</p>

              <div className="mb-5 flex-1">
                {price === 0 ? (
                  <span className="text-2xl font-semibold text-foreground">{t("currentPlan.free")}</span>
                ) : (
                  <span className="text-2xl font-semibold text-foreground">
                    ${price}
                    <span className="text-sm font-normal text-foreground-muted">{t("plans.perMonth")}</span>
                  </span>
                )}
              </div>

              {isCurrent ? (
                <button
                  type="button"
                  disabled
                  className="h-8 px-3 rounded-lg text-xs font-medium border border-border text-foreground-muted cursor-default"
                >
                  {t("plans.currentBadge")}
                </button>
              ) : isPaid ? (
                <ManageBillingButton
                  label={t("plans.manage")}
                  loadingLabel={t("currentPlan.openingPortal")}
                  className="btn-clay-secondary h-8 px-3 rounded-xl text-xs font-medium text-foreground"
                />
              ) : (
                <a
                  href={href}
                  className="btn-clay-primary inline-flex items-center justify-center h-8 px-3 rounded-2xl text-xs font-medium"
                >
                  {t("plans.upgrade")}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

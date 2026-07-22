"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Send, Database, Shield, Globe, Clock, CheckCircle,
  FileText, Zap, MessageSquare, Lock, ChevronRight,
  Users
} from "lucide-react";

function ChatMockup() {
  const t = useTranslations("platform.chatAi.mockup");

  const messages = [
    { role: "user", text: t("q1") },
    {
      role: "assistant",
      text: t("a1"),
      source: t("a1Source"),
    },
    { role: "user", text: t("q2") },
    {
      role: "assistant",
      text: t("a2"),
      source: t("a2Source"),
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="border-b border-border px-4 py-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-accent-success" />
        <span className="text-sm font-medium text-foreground">{t("header")}</span>
        <span className="ml-auto text-xs text-foreground-muted">{t("connectedTo")}</span>
      </div>
      <div className="p-4 space-y-4 max-h-80 overflow-hidden">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="max-w-[85%]">
              <div className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={i} className="max-w-[85%]">
              <div className="text-sm text-foreground leading-relaxed">{m.text}</div>
              {m.source && (
                <div className="mt-1 text-xs text-foreground-muted flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {t("sourcePrefix")} {m.source}
                </div>
              )}
            </div>
          ),
        )}
      </div>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-full bg-background-tertiary px-3 py-2">
          <span className="text-sm text-foreground-muted flex-1">{t("inputPlaceholder")}</span>
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background shrink-0">
            <Send className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatAIPage() {
  const t = useTranslations("platform.chatAi");

  const features = [
    { key: "knowledgeBase", icon: Database, color: "text-accent-primary" },
    { key: "roleBasedAccess", icon: Shield, color: "text-accent-secondary" },
    { key: "multiLanguage", icon: Globe, color: "text-accent-success" },
    { key: "auditTrail", icon: Clock, color: "text-accent-warning" },
  ] as const;

  const howItWorks = ["upload", "configure", "chat", "monitor"] as const;

  const stats = ["avgResponse", "languages", "uptime", "sources"] as const;
  const statValues: Record<(typeof stats)[number], string> = {
    avgResponse: "<200ms",
    languages: "Multiple",
    uptime: "24/7",
    sources: "Unlimited",
  };

  const sampleQuestions = ["q1", "q2", "q3", "q4"] as const;

  const securityItems = ["i1", "i2", "i3", "i4", "i6", "i7", "i8"] as const;

  const useCases = [
    { key: "hr", icon: Users },
    { key: "it", icon: Zap },
    { key: "legal", icon: Lock },
  ] as const;

  return (
    <PageLayout
      badge={t("badge")}
      badgeVariant="info"
      title={t("title")}
      subtitle={t("subtitle")}
      hero={
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-start">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div key={s} className="bg-card border border-border  p-4">
                  <div className="text-2xl font-normal text-foreground">{statValues[s]}</div>
                  <div className="text-sm text-foreground mt-1">{t(`stats.${s}.label`)}</div>
                  <div className="text-xs text-foreground-muted">{t(`stats.${s}.sub`)}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">{t("whatUsersAsk")}</h4>
              {sampleQuestions.map((q) => (
                <div key={q} className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <MessageSquare className="w-3 h-3 text-foreground-muted" />
                  {t(`sampleQuestions.${q}`)}
                </div>
              ))}
            </div>
          </div>
          <ChatMockup />
        </div>
      }
    >
      {/* How it works */}
      <PageSection title={t("howItWorksSection.title")} subtitle={t("howItWorksSection.subtitle")}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {howItWorks.map((h) => (
            <div key={h} className="relative">
              <div className="text-5xl font-bold text-foreground/5">{t(`howItWorks.${h}.step`)}</div>
              <h3 className="text-lg font-semibold text-foreground -mt-6 mb-2">{t(`howItWorks.${h}.title`)}</h3>
              <p className="text-sm text-foreground-secondary leading-relaxed">{t(`howItWorks.${h}.desc`)}</p>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Features */}
      <PageSection title={t("capabilitiesSection.title")} subtitle={t("capabilitiesSection.subtitle")}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-8">
          {features.map((f) => {
            const Icon = f.icon;
            const details = t.raw(`features.${f.key}.details`) as string[];

            return (
              <Card key={f.key} variant="bordered" className="p-6 h-full">
                <div className="mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground">{t(`features.${f.key}.title`)}</h3>
                <p className="mt-2 text-sm text-foreground-secondary mb-4">{t(`features.${f.key}.desc`)}</p>
                <ul className="space-y-2">
                  {details.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground-muted">
                      <ChevronRight className="w-3 h-3 text-foreground-muted/50 shrink-0 mt-1" />
                      {d}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </PageSection>

      {/* Security */}
      <PageSection title={t("securitySection.title")} subtitle={t("securitySection.subtitle")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          {securityItems.map((item) => (
            <div key={item} className="flex items-center gap-3 p-4  bg-background-tertiary">
              <CheckCircle className="w-4 h-4 text-accent-success shrink-0" />
              <span className="text-sm text-foreground-secondary">{t(`securityItems.${item}`)}</span>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Use cases */}
      <PageSection title={t("useCasesSection.title")} subtitle={t("useCasesSection.subtitle")}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {useCases.map((u) => {
            const Icon = u.icon;
            return (
              <Card key={u.key} variant="bordered" className="p-6">
                <Icon className="w-6 h-6 text-foreground-muted mb-3" />
                <h3 className="font-semibold text-foreground">{t(`useCases.${u.key}.title`)}</h3>
                <p className="mt-2 text-sm text-foreground-secondary">{t(`useCases.${u.key}.desc`)}</p>
              </Card>
            );
          })}
        </div>
      </PageSection>

      {/* CTA */}
      <div className="mt-20 p-8  bg-card border border-border text-center">
        <h3 className="text-2xl font-semibold text-foreground mb-2">{t("cta.title")}</h3>
        <p className="text-foreground-secondary mb-6">{t("cta.subtitle")}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/signup">
            <Button size="lg">{t("cta.startTrial")}</Button>
          </Link>
          <Link href="/company/contact">
            <Button variant="outline" size="lg">{t("cta.talkToSales")}</Button>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}

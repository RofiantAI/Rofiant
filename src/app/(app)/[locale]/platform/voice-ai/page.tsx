"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  FileText,
  Zap,
  Phone,
  CheckCircle,
  Radio,
  Headphones,
  Globe,
  Clock,
  Volume2,
  ChevronRight,
} from "lucide-react";

function WaveformVisual() {
  const t = useTranslations("platform.voiceAi.waveform");
  const bars = [
    20, 35, 25, 45, 30, 55, 40, 65, 50, 70, 45, 60, 35, 50, 25, 40, 55, 30, 45,
    65, 35, 50, 40, 55, 30, 45, 25, 40, 20, 35,
  ];

  return (
    <div className=" border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 bg-red-500" />
        <span className="text-sm font-medium text-foreground">
          {t("liveTranscription")}
        </span>
        <span className="ml-auto text-xs text-foreground-muted">00:03:42</span>
      </div>
      <div className="flex items-end gap-[2px] h-20 mb-4">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`flex-1  transition-all duration-300 ${
              i > bars.length - 5
                ? "bg-accent-primary"
                : "bg-foreground-muted/30"
            }`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="bg-background-tertiary  p-4">
        <div className="text-xs text-foreground-muted mb-2">
          {t("realtimeTranscript")}
        </div>
        <div className="text-sm text-foreground space-y-1">
          <p>
            <span className="text-foreground-muted">[Alice]</span> {t("speakerAlice")}
          </p>
          <p>
            <span className="text-foreground-muted">[Bob]</span> {t("speakerBob")}
          </p>
          <p className="text-accent-primary">
            <span className="text-foreground-muted">{t("aiSummaryLabel")}</span> {t("aiSummaryText")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VoiceAIPage() {
  const t = useTranslations("platform.voiceAi");

  const features = [
    { key: "transcription", icon: Mic, color: "text-accent-primary" },
    { key: "summarization", icon: FileText, color: "text-accent-secondary" },
    { key: "meetingSummaries", icon: Zap, color: "text-accent-success" },
    { key: "telephony", icon: Phone, color: "text-accent-warning" },
  ] as const;

  const languages = ["english", "spanish", "arabic", "mandarin"] as const;

  const useCases = [
    { key: "sales", icon: Headphones },
    { key: "meetings", icon: Radio },
    { key: "interviews", icon: Volume2 },
  ] as const;

  return (
    <PageLayout
      badge={t("badge")}
      badgeVariant="info"
      title={t("title")}
      subtitle={t("subtitle")}
      hero={<WaveformVisual />}
    >
      <p className="text-sm text-foreground-muted border border-border bg-background-tertiary px-4 py-3">
        {t("roadmapNotice")}
      </p>
      {/* Features */}
      <PageSection
        title={t("capabilitiesSection.title")}
        subtitle={t("capabilitiesSection.subtitle")}
      >
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
                <p className="mt-2 text-sm text-foreground-secondary mb-4">
                  {t(`features.${f.key}.desc`)}
                </p>
                <ul className="space-y-2">
                  {details.map((d, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-foreground-muted"
                    >
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

      {/* Languages */}
      <PageSection
        title={t("languagesSection.title")}
        subtitle={t("languagesSection.subtitle")}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          {languages.map((lang) => (
            <Badge key={lang} variant="default" className="px-4 py-2 text-sm">
              {t(`languages.${lang}`)}
            </Badge>
          ))}
        </div>
      </PageSection>

      {/* Use cases */}
      <PageSection
        title={t("useCasesSection.title")}
        subtitle={t("useCasesSection.subtitle")}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {useCases.map((u) => {
            const Icon = u.icon;
            return (
              <Card key={u.key} variant="bordered" className="p-6">
                <Icon className="w-6 h-6 text-foreground-muted mb-3" />
                <h3 className="font-semibold text-foreground">{t(`useCases.${u.key}.title`)}</h3>
                <p className="mt-2 text-sm text-foreground-secondary">
                  {t(`useCases.${u.key}.desc`)}
                </p>
              </Card>
            );
          })}
        </div>
      </PageSection>

      {/* CTA */}
      <div className="mt-20 p-8  bg-card border border-border text-center">
        <h3 className="text-2xl font-semibold text-foreground mb-2">
          {t("cta.title")}
        </h3>
        <p className="text-foreground-secondary mb-6">
          {t("cta.subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/signup">
            <Button size="lg">{t("cta.startTrial")}</Button>
          </Link>
          <Link href="/company/contact">
            <Button variant="outline" size="lg">
              {t("cta.talkToSales")}
            </Button>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}

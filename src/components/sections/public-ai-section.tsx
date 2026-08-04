import { Button } from "@/components/ui/button";
import { IconFeature } from "@/components/ui/icon-feature";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeader } from "./section-header";
import {
  MessageSquare,
  FileText,
  Search,
  Code,
  Image,
  Globe,
} from "lucide-react";

const features = [
  { key: "chat", icon: MessageSquare, tone: "primary" },
  { key: "write", icon: FileText, tone: "secondary" },
  { key: "research", icon: Search, tone: "success" },
  { key: "code", icon: Code, tone: "warning" },
  { key: "images", icon: Image, tone: "orange" },
  { key: "multilingual", icon: Globe, tone: "primary" },
] as const;

export async function PublicAISection() {
  const t = await getTranslations("home.publicAi");

  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <SectionHeader
            align="center"
            title={
              <>
                {t("titlePrefix")}{" "}
                <span className="bg-accent-primary px-1 text-background">
                  {t("titleHighlight")}
                </span>
              </>
            }
            subtitle={t("subtitle")}
          />
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <IconFeature
              key={feature.key}
              icon={feature.icon}
              tone={feature.tone}
              title={t(`features.${feature.key}.title`)}
              description={t(`features.${feature.key}.desc`)}
            />
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/signup">
            <Button size="lg">{t("cta")}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

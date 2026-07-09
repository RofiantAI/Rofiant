import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  MessageSquare,
  FileText,
  Search,
  Code,
  Image,
  Globe,
} from "lucide-react";

const features = [
  { key: "chat", icon: MessageSquare, color: "accent-primary" },
  { key: "write", icon: FileText, color: "accent-secondary" },
  { key: "research", icon: Search, color: "accent-success" },
  { key: "code", icon: Code, color: "accent-warning" },
  { key: "images", icon: Image, color: "accent-orange" },
  { key: "multilingual", icon: Globe, color: "red-500" },
] as const;

export async function PublicAISection() {
  const t = await getTranslations("home.publicAi");

  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-normal tracking-tight text-foreground sm:text-5xl">
            {t("titlePrefix")}{" "}
            <span className="bg-accent-primary px-1 text-background">
              {t("titleHighlight")}
            </span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-foreground-secondary">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.key} variant="bordered" className="p-6 h-full">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground">
                  {t(`features.${feature.key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-foreground-secondary">
                  {t(`features.${feature.key}.desc`)}
                </p>
              </Card>
            );
          })}
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

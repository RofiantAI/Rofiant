import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Globe, Zap, DollarSign, Database } from "lucide-react";

const features = [
  { key: "multiRegion", icon: Globe },
  { key: "autoScaling", icon: Zap },
  { key: "pricing", icon: DollarSign },
  { key: "sovereignty", icon: Database },
] as const;

export async function ScaleSection() {
  const t = await getTranslations("home.scale");

  return (
    <section className="py-24 bg-background border-t border-border">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <Badge variant="info" dot className="mb-6">
              {t("badge")}
            </Badge>
            <h2 className="text-3xl font-normal tracking-tight text-foreground sm:text-5xl leading-tight">
              {t("titlePrefix")}{" "}
              <span className="bg-accent-primary/30 text-foreground px-1">
                {t("titleHighlight")}
              </span>
            </h2>
          </div>
          <div className="flex flex-col justify-end">
            <p className="text-lg text-foreground-secondary leading-relaxed max-w-md">
              {t("subtitle")}
            </p>
            <div className="mt-6">
              <Link href="/resources/documentation">
                <Button variant="primary" size="md">
                  {t("readDocs")}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className="p-6 border border-border bg-card"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {t(`features.${feature.key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  {t(`features.${feature.key}.desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

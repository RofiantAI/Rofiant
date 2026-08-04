import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeader } from "./section-header";
import { HeroTintOverlay } from "./hero-tint-overlay";

export async function HeroSection() {
  const t = await getTranslations("home.hero");

  return (
    <section className="relative overflow-hidden -mt-16 min-h-[calc(100vh+4rem)] flex items-end">
      <div className="absolute inset-0">
        <Image
          src="/hero-nature.png"
          alt="Hero background"
          fill
          className="object-cover"
          priority
        />
        <HeroTintOverlay />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 w-full flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 sm:gap-8">
        <SectionHeader
          as="h1"
          title={
            <>
              {t("titleLine1")}
              <br />
              {t("titleLine2")}{" "}
              <span className="inline-block rounded-2xl bg-accent-primary px-4 py-1 text-background shadow-clay">
                {t("titleHighlight")}
              </span>
            </>
          }
          subtitle={t("subtitle")}
          subtitleClassName="max-w-2xl"
        />
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <Link href="/download">
            <Button size="lg">{t("startFree")}</Button>
          </Link>
          <Link href="/pricing">
            <Button
              variant="outline"
              size="lg"
              className="!bg-background/30 !text-foreground !border-white/25 backdrop-blur-sm hover:!bg-background/45"
            >
              {t("talkToSales")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

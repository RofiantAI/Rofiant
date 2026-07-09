import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function HeroSection() {
  const t = await getTranslations("home.hero");

  return (
    <section className="relative overflow-hidden min-h-[85vh] flex items-end">
      <div className="absolute inset-0">
        <Image
          src="/hero.png"
          alt="Hero background"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 w-full flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 sm:gap-8">
        <div>
          <h1 className="text-4xl font-normal tracking-tight text-foreground sm:text-7xl lg:text-[5.5rem] leading-[1.1]">
            {t("titleLine1")}
            <br />
            {t("titleLine2")}{" "}
            <span className="bg-accent-primary px-2 text-background">
              {t("titleHighlight")}
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-foreground-secondary">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <Link href="/auth/signup">
            <Button size="lg">{t("startFree")}</Button>
          </Link>
          <Link href="/company/contact">
            <Button variant="outline" size="lg">
              {t("talkToSales")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

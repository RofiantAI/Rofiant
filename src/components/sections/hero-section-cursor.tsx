import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HeroDemo } from "./hero-demo";

export async function HeroSectionCursor() {
  const t = await getTranslations("home.hero");

  return (
    <section className="border-b border-border pt-24 pb-20 sm:pt-32 sm:pb-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <h1 className="text-4xl font-normal tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-[1.1]">
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

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/auth/signup">
            <Button size="lg">{t("startFree")}</Button>
          </Link>
          <Link href="/download">
            <Button variant="outline" size="lg">
              {t("download")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center rounded-2xl bg-accent-primary p-8 sm:p-14">
          <HeroDemo />
        </div>
      </div>
    </section>
  );
}

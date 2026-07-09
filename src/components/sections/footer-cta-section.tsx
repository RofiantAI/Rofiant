import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function FooterCtaSection() {
  const t = await getTranslations("home.footerCta");

  return (
    <section className="border-t border-border bg-background-secondary">
      <div className="mx-auto max-w-[1600px] px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-widest text-foreground-muted mb-6">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl font-normal tracking-tight text-foreground sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-lg text-xl text-foreground-secondary">
            {t("subtitle")}
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg">{t("startFree")}</Button>
            </Link>
            <Link href="/company/contact">
              <Button variant="outline" size="lg">
                {t("talkToSales")}
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-foreground-muted">
            {t("fineprint")}
          </p>
        </div>
      </div>
    </section>
  );
}

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-console";

const helpfulLinks = [
  { key: "platform", href: "/platform/chat-ai" },
  { key: "pricing", href: "/pricing" },
  { key: "docs", href: "/resources/documentation" },
  { key: "company", href: "/company/about" },
] as const;

export default async function NotFound() {
  const t = await getTranslations("error.notFound");
  const nav = await getTranslations("nav");

  return (
    <ErrorState
      code="404"
      title={t("title")}
      subtitle={t("subtitle")}
      actions={
        <Link href="/">
          <Button size="lg">{t("cta")}</Button>
        </Link>
      }
      links={helpfulLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm text-foreground-secondary transition-colors hover:text-foreground"
        >
          {nav(link.key)}
        </Link>
      ))}
    />
  );
}

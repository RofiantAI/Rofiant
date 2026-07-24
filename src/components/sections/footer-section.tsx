import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const footerColumns = [
  {
    key: "platform",
    links: [
      { key: "pricing", href: "/pricing" },
      { key: "chatAi", href: "/platform/chat-ai" },
      { key: "agents", href: "/platform/agents" },
    ],
  },
  {
    key: "resources",
    links: [
      { key: "documentation", href: "/resources/documentation" },
      { key: "apiReference", href: "/resources/api-reference" },
      { key: "changelog", href: "/resources/changelog" },
      { key: "status", href: "/status" },
    ],
  },
  {
    key: "company",
    links: [
      { key: "about", href: "/company/about" },
      { key: "careers", href: "/company/careers" },
      { key: "security", href: "/company/security" },
      { key: "contact", href: "/company/contact" },
    ],
  },
  {
    key: "legal",
    links: [
      { key: "termsOfService", href: "/legal/terms-of-service" },
      { key: "privacyPolicy", href: "/legal/privacy-policy" },
    ],
  },
] as const;

export async function FooterSection() {
  const t = await getTranslations("footer");
  const locale = await getLocale();
  const logoSrc = locale === "de" ? "/logo-de-light.svg" : "/logo-light.svg";

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-6">
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-xl font-normal text-foreground">
                <img src={logoSrc} alt="Rofiant" className="h-6 w-auto" />
              </span>
            </Link>

            <p className="mt-4 text-sm text-foreground-secondary">
              {t("tagline")}
            </p>

            <p className="mt-2 text-sm text-foreground-muted">
              {t("copyright", { year: new Date().getFullYear() })}
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.key}>
              <h3 className="text-sm font-semibold text-foreground">
                {t(`columns.${column.key}.title`)}
              </h3>

              <ul className="mt-4 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground-secondary transition-colors hover:text-foreground"
                    >
                      {t(`columns.${column.key}.links.${link.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-border pt-8">
          <a
            href="https://startupfa.me/s/rofiant?utm_source=rofiant.ca"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://startupfa.me/badges/featured-badge.webp"
              alt="Rofiant - Featured on Startup Fame"
              width="171"
              height="54"
              className="h-9 w-auto"
            />
          </a>

          <a href="https://dang.ai" target="_blank" rel="dofollow noopener">
            <img
              src="https://assets.dang.ai/badges/dang-verified-dark.png"
              alt="Verified on DANG!"
              width="260"
              height="94"
              className="h-9 w-auto"
            />
          </a>

          <a href="https://twelve.tools" target="_blank" rel="noopener noreferrer">
            <img
              src="https://twelve.tools/badge0-dark.svg"
              alt="Featured on Twelve Tools"
              width="200"
              height="54"
              className="h-9 w-auto"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}

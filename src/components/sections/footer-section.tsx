import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const footerColumns = [
  {
    key: "platform",
    links: [
      { key: "pricing", href: "/pricing" },
      { key: "chatAi", href: "/platform/chat-ai" },
      { key: "voiceAi", href: "/platform/voice-ai" },
      { key: "documentIntelligence", href: "/platform/document-intelligence" },
      { key: "agents", href: "/platform/agents" },
      { key: "api", href: "/platform/api" },
    ],
  },
  {
    key: "solutions",
    links: [
      { key: "services", href: "/services" },
      { key: "federalAgencies", href: "/solutions/federal-agencies" },
      { key: "defenseIntelligence", href: "/solutions/defense-intelligence" },
      { key: "lawEnforcement", href: "/solutions/law-enforcement" },
      { key: "enterprise", href: "/solutions/enterprise" },
    ],
  },
  {
    key: "resources",
    links: [
      { key: "documentation", href: "/resources/documentation" },
      { key: "apiReference", href: "/resources/api-reference" },
      { key: "complianceGuides", href: "/resources/compliance-guides" },
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
      { key: "fedramp", href: "/legal/fedramp" },
      { key: "soc2", href: "/legal/soc2" },
      { key: "itarPolicy", href: "/legal/itar-policy" },
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

          <div className="col-span-2 flex items-end justify-end sm:col-span-5">
            <img
              src="/footer.svg"
              alt=""
              className="h-auto w-full max-w-3xl"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}

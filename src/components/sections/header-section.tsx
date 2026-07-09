import { createClient } from "@/lib/supabase/server";
import { ChevronDown } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { appUrl } from "@/lib/app-url";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";

export async function HeaderSection() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("nav");
  const locale = await getLocale();
  const logoSrc = locale === "de" ? "/logo-de.svg" : "/logo.svg";

  const linkBase =
    "inline-flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors";

  const linkIdle = "text-black hover:text-black";

  const mobileLinks = [
    { href: "/platform/chat-ai", label: t("platform") },
    { href: "/company/about", label: t("company") },
    { href: "/services", label: t("services") },
    { href: "/solutions", label: t("solutions") },
    { href: "/pricing", label: t("pricing") },
    { href: "/resources/documentation", label: t("docs") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full pt-4">
      <div className="mx-auto max-w-8xl px-2 sm:px-3 lg:px-4">
        <div className="flex items-center justify-between gap-4 md:gap-20">
          {/* Nav bar */}
          <div className="relative flex-1 flex h-12 items-center justify-between md:justify-start border border-border bg-foreground px-4 sm:px-6">
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center">
                <img src={logoSrc} alt="Rofiant" className="h-6 w-auto" />
              </Link>

              <nav className="hidden md:flex items-center gap-7">
                {/* Resources dropdown */}
                <div className="relative group">
                  <button className={`${linkBase} ${linkIdle} inline-flex items-center gap-1`}>
                    {t("resources")}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <div className="absolute left-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible z-50">
                    <div className="bg-foreground border border-border shadow-lg py-1 min-w-[180px]">
                      <Link href="/platform/chat-ai" className="block px-4 py-2 text-sm text-black hover:bg-black/5">
                        {t("platform")}
                      </Link>
                      <Link href="/company/about" className="block px-4 py-2 text-sm text-black hover:bg-black/5">
                        {t("company")}
                      </Link>
                    </div>
                  </div>
                </div>

                <Link
                  href="/services"
                  className={`${linkBase} ${linkIdle}`}
                >
                  {t("services")}
                </Link>
                <Link
                  href="/solutions"
                  className={`${linkBase} ${linkIdle}`}
                >
                  {t("solutions")}
                </Link>
                <Link
                  href="/pricing"
                  className={`${linkBase} ${linkIdle}`}
                >
                  {t("pricing")}
                </Link>
                <Link
                  href="/resources/documentation"
                  className={`${linkBase} ${linkIdle}`}
                >
                  {t("docs")}
                </Link>
              </nav>
            </div>

            <MobileNav links={mobileLinks} />
          </div>

          {/* Auth buttons - separate element */}
          <div className="flex items-center gap-1">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            {user ? (
              <a
                href={appUrl("/dashboard")}
                className="inline-flex items-center justify-center h-12 px-3 sm:px-4 text-sm font-medium bg-white text-black transition-colors whitespace-nowrap"
              >
                {t("dashboard")}
              </a>
            ) : (
              <>
                <a
                  href={appUrl("/auth/login")}
                  className="inline-flex items-center justify-center h-12 px-3 sm:px-4 text-sm font-medium bg-background text-foreground border border-white transition-colors hover:bg-[#1c1e22] whitespace-nowrap"
                >
                  {t("login")}
                </a>

                <a
                  href={appUrl("/auth/signup")}
                  className="inline-flex items-center justify-center h-12 px-3 sm:px-4 text-sm font-medium bg-white text-black transition-colors whitespace-nowrap"
                >
                  {t("signup")}
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

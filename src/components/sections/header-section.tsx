import { createClient } from "@/lib/supabase/server";
import { getLocale, getTranslations } from "next-intl/server";
import { appUrl } from "@/lib/app-url";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";
import { HeaderNavBar } from "./header-nav-bar";

export async function HeaderSection() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("nav");
  const locale = await getLocale();
  const logoSrc = locale === "de" ? "/logo-de-light.svg" : "/logo-light.svg";

  const linkBase =
    "inline-flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors [text-shadow:0_1px_3px_rgb(0_0_0_/_0.5)]";

  const linkIdle = "text-white/80 hover:text-white";

  const mobileLinks = [
    { href: "/company/about", label: t("company") },
    { href: "/pricing", label: t("pricing") },
    { href: "/download", label: t("download") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full pt-4">
      <div className="mx-auto max-w-8xl px-2 sm:px-3 lg:px-4">
        <div className="flex items-center justify-between gap-4 md:gap-20">
          {/* Nav bar */}
          <HeaderNavBar>
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center">
                <img src={logoSrc} alt="Rofiant" className="h-6 w-auto" />
              </Link>

              <nav className="hidden md:flex items-center gap-7">
                <Link href="/company/about" className={`${linkBase} ${linkIdle}`}>
                  {t("company")}
                </Link>

                <Link href="/pricing" className={`${linkBase} ${linkIdle}`}>
                  {t("pricing")}
                </Link>
                <Link href="/download" className={`${linkBase} ${linkIdle}`}>
                  {t("download")}
                </Link>
              </nav>
            </div>

            <MobileNav links={mobileLinks} />
          </HeaderNavBar>

          {/* Auth buttons - separate element */}
          <div className="flex items-center gap-1">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            {user ? (
              <a
                href={appUrl("/dashboard")}
                className="btn-clay-primary inline-flex items-center justify-center h-12 rounded-2xl px-3 sm:px-4 text-sm font-medium whitespace-nowrap"
              >
                {t("dashboard")}
              </a>
            ) : (
              <>
                <a
                  href={appUrl("/auth/login")}
                  className="btn-clay-secondary inline-flex items-center justify-center gap-2 h-12 rounded-2xl px-3 sm:px-4 text-sm font-medium whitespace-nowrap"
                >
                  {t("login")}
                </a>

                <a
                  href={appUrl("/auth/signup")}
                  className="btn-clay-primary inline-flex items-center justify-center h-12 rounded-2xl px-3 sm:px-4 text-sm font-medium whitespace-nowrap"
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

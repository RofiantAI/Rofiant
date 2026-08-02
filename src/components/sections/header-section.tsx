import { createClient } from "@/lib/supabase/server";
import { LogIn } from "lucide-react";
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
    { href: "/company/about", label: t("company") },
    { href: "/pricing", label: t("pricing") },
    { href: "/download", label: t("download") },
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
                  className="inline-flex items-center justify-center gap-2 h-12 px-3 sm:px-4 text-sm font-medium bg-background text-foreground border border-white transition-colors hover:bg-[#1c1e22] whitespace-nowrap"
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

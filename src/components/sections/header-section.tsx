import { createClient } from "@/lib/supabase/server";
import { ChevronDown } from "lucide-react";
import { appUrl } from "@/lib/app-url";

export async function HeaderSection() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const linkBase =
    "inline-flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors";

  const linkIdle = "text-black hover:text-black";

  return (
    <header className="sticky top-0 z-50 w-full pt-4">
      <div className="mx-auto max-w-8xl px-2 sm:px-3 lg:px-4">
        <div className="flex items-center gap-20">
          {/* Nav bar */}
          <div className="flex-1 flex h-12 items-center border border-border bg-foreground px-6">
            <div className="flex items-center gap-10">
              <a href="/" className="flex items-center">
                <img src="/logo.svg" alt="Rofiant" className="h-6 w-auto" />
              </a>

              <nav className="hidden md:flex items-center gap-7">
                {/* Resources dropdown */}
                <div className="relative group">
                  <button className={`${linkBase} ${linkIdle} inline-flex items-center gap-1`}>
                    Resources
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <div className="absolute left-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out z-50 -translate-y-1 group-hover:translate-y-0">
                    <div className="bg-foreground border border-border shadow-lg py-1 min-w-[180px]">
                      <a href="/platform/chat-ai" className="block px-4 py-2 text-sm text-black hover:bg-black/5">
                        Platform
                      </a>
                      <a href="/company/about" className="block px-4 py-2 text-sm text-black hover:bg-black/5">
                        Company
                      </a>
                    </div>
                  </div>
                </div>

                <a
                  href="/solutions"
                  className={`${linkBase} ${linkIdle}`}
                >
                  Solutions
                </a>
                <a
                  href="/pricing"
                  className={`${linkBase} ${linkIdle}`}
                >
                  Pricing
                </a>
                <a
                  href="/resources/documentation"
                  className={`${linkBase} ${linkIdle}`}
                >
                  Docs
                </a>
              </nav>
            </div>
          </div>

          {/* Auth buttons - separate element */}
          <div className="flex items-center gap-1">
            {user ? (
              <a
                href={appUrl("/dashboard")}
                className="inline-flex items-center justify-center h-12 px-4 text-sm font-medium bg-white text-black transition-colors"
              >
                Dashboard
              </a>
            ) : (
              <>
                <a
                  href={appUrl("/auth/login")}
                  className="inline-flex items-center justify-center h-12 px-4 text-sm font-medium bg-background text-foreground border border-white transition-colors hover:bg-[#1c1e22]"
                >
                  Login
                </a>

                <a
                  href={appUrl("/auth/signup")}
                  className="inline-flex items-center justify-center h-12 px-4 text-sm font-medium bg-white text-black transition-colors"
                >
                  Sign Up
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

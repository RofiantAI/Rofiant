import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Top-level segments that live under (app)/[locale] — used to decide whether
// a given pathname should go through locale routing.
const PUBLIC_APP_SEGMENTS = [
  "",
  "auth",
  "company",
  "legal",
  "platform",
  "pricing",
  "resources",
  "solutions",
  "services",
  "_preview",
];

function stripLocalePrefix(pathname: string) {
  const localePattern = routing.locales.join("|");
  return pathname.replace(new RegExp(`^/(${localePattern})(?=/|$)`), "") || "/";
}

function isPublicAppPath(pathname: string) {
  const stripped = stripLocalePrefix(pathname);
  const seg = stripped.split("/").filter(Boolean)[0] ?? "";
  return PUBLIC_APP_SEGMENTS.includes(seg);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // api.rofiant.ca → /api/v1/* (no auth cookie check, Bearer handled in routes)
  const isApiHost =
    host.startsWith("api.") ||
    (process.env.NODE_ENV === "development" && host === "api.localhost:3000");

  if (isApiHost) {
    if (pathname === "/" || pathname === "") {
      return Response.json({
        name: "Rofiant API",
        version: "v1",
        docs: "https://rofiant.ca/resources/api-reference",
      });
    }
    // Rewrite /v1/... → /api/v1/... if not already prefixed
    if (!pathname.startsWith("/api/")) {
      const url = request.nextUrl.clone();
      url.pathname = `/api${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Route chat.rofiant.ca (and chat.localhost in dev) → /chat/* internally
  const isChatHost =
    host.startsWith("chat.") ||
    (process.env.NODE_ENV === "development" && host === "chat.localhost:3000");

  if (
    isChatHost &&
    !pathname.startsWith("/chat") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/chat${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Locale routing for public marketing/legal pages only. /dashboard, /chat,
  // and /api never match isPublicAppPath, so they fall through unaffected.
  if (isPublicAppPath(pathname) && !pathname.startsWith("/api")) {
    const intlResponse = intlMiddleware(request);
    if (intlResponse) return intlResponse;
  }

  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/chat");

  if (!user && isProtected) {
    // /auth/login now lives under (app)/[locale]/auth/login; (dashboard)/(chat)
    // carry no locale context, so default to routing.defaultLocale.
    const loginUrl = new URL(`/${routing.defaultLocale}/auth/login`, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

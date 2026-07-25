import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Knowledge base / document routes are also called cross-origin by the
// desktop app (Bearer-token auth, no cookies — see getAuthedUser in
// src/lib/api-auth.ts), so they need CORS headers the browser dashboard's
// same-origin requests never required.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

function isKbOrDocsApiPath(pathname: string) {
  return /^\/api\/(knowledge-bases|documents)(\/|$)/.test(pathname);
}

// Top-level segments that live under (app)/[locale] — used to decide whether
// a given pathname should go through locale routing.
const PUBLIC_APP_SEGMENTS = [
  "",
  "auth",
  "company",
  "download",
  "legal",
  "pages",
  "platform",
  "pricing",
  "resources",
  "solutions",
  "services",
  "status",
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

function isAuthPath(pathname: string) {
  const stripped = stripLocalePrefix(pathname);
  return stripped === "/auth" || stripped.startsWith("/auth/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  if (isKbOrDocsApiPath(pathname) && request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  // Dashboard/chat are locale-free. /en/dashboard/... is a common footgun from
  // marketing pages — strip the locale and redirect so links don't 404.
  const localePrefixedApp = pathname.match(
    new RegExp(`^/(${routing.locales.join("|")})/(dashboard|chat)(/.*)?$`),
  );
  if (localePrefixedApp) {
    const url = request.nextUrl.clone();
    url.pathname = `/${localePrefixedApp[2]}${localePrefixedApp[3] ?? ""}`;
    return NextResponse.redirect(url);
  }

  // api.rofiant.ca → /api/v1/* (no auth cookie check, Bearer handled in routes)
  const isApiHost =
    host.startsWith("api.") ||
    (process.env.NODE_ENV === "development" && host === "api.localhost:3000");

  if (isApiHost) {
    if (pathname === "/" || pathname === "") {
      return Response.json({
        name: "Rofiant API",
        version: "v1",
        docs: "https://www.rofiant.ca/resources/api-reference",
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

  // app.rofiant.ca (and app.localhost in dev) is the authenticated product
  // surface: dashboard + auth, mirroring chat./api. Marketing pages don't
  // live here — anything else bounces back to the marketing domain.
  const isAppHost =
    host.startsWith("app.") ||
    (process.env.NODE_ENV === "development" && host === "app.localhost:3000");

  let effectivePathname = pathname;
  let rewriteUrl: URL | undefined;

  if (isAppHost) {
    if (pathname === "/") {
      effectivePathname = "/chat";
      rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = "/chat";
    } else if (
      !pathname.startsWith("/dashboard") &&
      !pathname.startsWith("/chat") &&
      !isAuthPath(pathname) &&
      !pathname.startsWith("/_next") &&
      !pathname.startsWith("/api")
    ) {
      const marketingUrl = request.nextUrl.clone();
      marketingUrl.hostname =
        process.env.NODE_ENV === "development" ? "localhost" : "www.rofiant.ca";
      return NextResponse.redirect(marketingUrl);
    }
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
    effectivePathname = `/chat${pathname === "/" ? "" : pathname}`;
    rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = effectivePathname;
  }

  // Locale routing for public marketing/legal pages only. /dashboard, /chat,
  // and /api never match isPublicAppPath, so they fall through unaffected.
  if (!rewriteUrl && isPublicAppPath(pathname) && !pathname.startsWith("/api")) {
    const intlResponse = intlMiddleware(request);
    if (intlResponse) return intlResponse;
  }

  const response = rewriteUrl
    ? NextResponse.rewrite(rewriteUrl, { request: { headers: request.headers } })
    : NextResponse.next({ request: { headers: request.headers } });

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
    effectivePathname.startsWith("/dashboard") ||
    effectivePathname.startsWith("/chat");

  if (!user && isProtected) {
    // /auth/login now lives under (app)/[locale]/auth/login; (dashboard)/(chat)
    // carry no locale context, so default to routing.defaultLocale.
    const loginUrl = new URL(`/${routing.defaultLocale}/auth/login`, request.url);
    loginUrl.searchParams.set("next", effectivePathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed-in users land on /chat instead of the marketing homepage. Done here
  // (not in page.tsx) so the home page itself has no blocking async work —
  // page.tsx previously awaited its own getUser() call, which made Next wrap
  // the page segment's Suspense boundary (from the sibling loading.tsx) around
  // real content, delaying it behind the footer in the streamed HTML and
  // hiding the H1/hero copy from crawlers that don't execute JS.
  if (user && !isAppHost && !isChatHost && !isApiHost && stripLocalePrefix(effectivePathname) === "/") {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  if (isKbOrDocsApiPath(pathname)) {
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

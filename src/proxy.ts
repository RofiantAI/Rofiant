import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Document routes are also called cross-origin by the desktop app
// (Bearer-token auth, no cookies — see getAuthedUser in src/lib/api-auth.ts),
// so they need CORS headers the browser dashboard's same-origin requests
// never required.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

function isDocsApiPath(pathname: string) {
  return /^\/api\/documents(\/|$)/.test(pathname);
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

  if (isDocsApiPath(pathname) && request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  // Dashboard is locale-free. /en/dashboard/... is a common footgun from
  // marketing pages — strip the locale and redirect so links don't 404.
  const localePrefixedApp = pathname.match(
    new RegExp(`^/(${routing.locales.join("|")})/(dashboard)(/.*)?$`),
  );
  if (localePrefixedApp) {
    const url = request.nextUrl.clone();
    url.pathname = `/${localePrefixedApp[2]}${localePrefixedApp[3] ?? ""}`;
    return NextResponse.redirect(url);
  }

  // api.rofiant.ca used to serve the public v1 API; that product has been
  // removed. Any traffic still hitting this host gets a plain 404 instead of
  // falling through into the marketing/dashboard app.
  const isApiHost =
    host.startsWith("api.") ||
    (process.env.NODE_ENV === "development" && host === "api.localhost:3000");

  if (isApiHost) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // chat.rofiant.ca used to serve the web chat client; that product has been
  // removed. Bounce any lingering links/bookmarks to the app dashboard.
  const isChatHost =
    host.startsWith("chat.") ||
    (process.env.NODE_ENV === "development" && host === "chat.localhost:3000");

  if (isChatHost) {
    const appUrl = request.nextUrl.clone();
    appUrl.hostname =
      process.env.NODE_ENV === "development" ? "app.localhost" : "app.rofiant.ca";
    appUrl.pathname = "/";
    return NextResponse.redirect(appUrl);
  }

  // app.rofiant.ca (and app.localhost in dev) is the authenticated product
  // surface: dashboard + auth. Marketing pages don't live here — anything
  // else bounces back to the marketing domain.
  const isAppHost =
    host.startsWith("app.") ||
    (process.env.NODE_ENV === "development" && host === "app.localhost:3000");

  let effectivePathname = pathname;
  let rewriteUrl: URL | undefined;

  if (isAppHost) {
    if (pathname === "/") {
      effectivePathname = "/dashboard";
      rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = "/dashboard";
    } else if (
      !pathname.startsWith("/dashboard") &&
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

  // status.rofiant.ca (and status.localhost in dev) → /en/status internally.
  // No locale negotiation here, same as app./chat. — status page is English-only for now.
  const isStatusHost =
    host.startsWith("status.") ||
    (process.env.NODE_ENV === "development" && host === "status.localhost:3000");

  if (isStatusHost && !pathname.startsWith("/_next") && !pathname.startsWith("/api")) {
    if (pathname !== "/") {
      // Header/footer links (logo, Pricing, Docs, ...) are same-origin relative
      // links. Without this, clicking them just re-requests status.rofiant.ca/<path>,
      // which would fall through to the rewrite below and re-render the status
      // page instead of leaving the subdomain.
      const marketingUrl = request.nextUrl.clone();
      marketingUrl.hostname =
        process.env.NODE_ENV === "development" ? "localhost" : "www.rofiant.ca";
      return NextResponse.redirect(marketingUrl);
    }
    effectivePathname = `/${routing.defaultLocale}/status`;
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

  let user: User | null = null;
  try {
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch (err) {
    // Stale/rotated refresh token left over in the browser (e.g. after a
    // password reset or a Supabase project switch). Not a real error —
    // treat the visitor as signed out and drop the dead cookies so they
    // stop being resent on every request.
    if ((err as { code?: string })?.code === "refresh_token_not_found") {
      for (const cookie of request.cookies.getAll()) {
        if (cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")) {
          response.cookies.delete(cookie.name);
        }
      }
    } else {
      throw err;
    }
  }

  const isProtected = effectivePathname.startsWith("/dashboard");

  if (!user && isProtected) {
    // /auth/login now lives under (app)/[locale]/auth/login; (dashboard)
    // carries no locale context, so default to routing.defaultLocale.
    const loginUrl = new URL(`/${routing.defaultLocale}/auth/login`, request.url);
    loginUrl.searchParams.set("next", effectivePathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed-in users land on /dashboard instead of the marketing homepage.
  // Done here (not in page.tsx) so the home page itself has no blocking
  // async work — page.tsx previously awaited its own getUser() call, which
  // made Next wrap the page segment's Suspense boundary (from the sibling
  // loading.tsx) around real content, delaying it behind the footer in the
  // streamed HTML and hiding the H1/hero copy from crawlers that don't
  // execute JS.
  if (user && !isAppHost && stripLocalePrefix(effectivePathname) === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isDocsApiPath(pathname)) {
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
  }

  // Referral attribution: a shared invite link is /<locale>/auth/signup?ref=<referrer-user-id>.
  // Stash it in a cookie so /auth/callback can credit the referral once the
  // new account actually gets a session (works for both email and OAuth signup).
  const refParam = request.nextUrl.searchParams.get("ref");
  if (refParam && stripLocalePrefix(effectivePathname) === "/auth/signup") {
    response.cookies.set("rf_ref", refParam, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
    const loginUrl = new URL("/auth/login", request.url);
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

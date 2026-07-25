import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore if called from Server Component
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const refFrom = cookieStore.get("rf_ref")?.value;
      if (refFrom && data.user && refFrom !== data.user.id) {
        // Best-effort, error ignored: RLS lets a user insert only their own
        // referred_id row, and the UNIQUE constraint makes this a no-op on
        // repeat logins/OAuth re-auth (already-attributed users just conflict).
        await supabase
          .from("referrals")
          .insert({ referrer_id: refFrom, referred_id: data.user.id });
        cookieStore.delete("rf_ref");
      }

      // Desktop app: hand the session back via the custom URL scheme instead
      // of the cookie session above (that cookie is set on this domain and
      // is useless to the native app). Tokens ride in the fragment, not the
      // query string, so they never hit server logs on the receiving end.
      if (next.startsWith("rofiant://") && data.session) {
        const desktopUrl = new URL(next);
        desktopUrl.hash = new URLSearchParams({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }).toString();
        return NextResponse.redirect(desktopUrl.toString());
      }

      const destination = next.startsWith("http") ? next : `${origin}${next}`;
      return NextResponse.redirect(destination);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate`);
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAuthActionEmail } from "@/lib/email";
import { authRatelimit, enforceRatelimit } from "@/lib/ratelimit";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limited = await enforceRatelimit(authRatelimit, ip);
  if (limited) return limited;

  const { email, turnstileToken, redirectTo } = await req.json();

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const verified = await verifyTurnstileToken(turnstileToken, ip);
  if (!verified) {
    return NextResponse.json({ error: "Captcha verification failed" }, { status: 400 });
  }

  if (!redirectTo || typeof redirectTo !== "string") {
    return NextResponse.json({ error: "Missing redirect URL" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: email.trim(),
    options: { redirectTo },
  });

  if (error) {
    console.error("[auth/reset-password] generateLink failed:", error);
  }

  const actionUrl = data?.properties?.action_link;
  if (actionUrl) {
    try {
      await sendAuthActionEmail({
        to: email.trim(),
        actionType: "recovery",
        actionUrl,
        otp: data.properties?.email_otp,
      });
    } catch (err) {
      console.error("[auth/reset-password] email send failed:", err);
      return NextResponse.json({ error: "Could not send reset email" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

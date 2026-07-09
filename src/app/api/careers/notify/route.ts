import { NextRequest, NextResponse } from "next/server";
import { sendCareersNotifyEmail } from "@/lib/email";
import { authRatelimit, enforceRatelimit } from "@/lib/ratelimit";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstileToken } from "@/lib/turnstile";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limited = await enforceRatelimit(authRatelimit, ip);
  if (limited) return limited;

  const { email, turnstileToken } = await req.json();
  const trimmedEmail = email?.trim();

  if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const verified = await verifyTurnstileToken(turnstileToken, ip);
  if (!verified) {
    return NextResponse.json({ error: "Captcha verification failed" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error: dbError } = await admin
    .from("careers_notify_signups")
    .upsert({ email: trimmedEmail }, { onConflict: "email", ignoreDuplicates: true });

  if (dbError) {
    console.error("[careers/notify] db insert failed:", dbError);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }

  try {
    await sendCareersNotifyEmail({ email: trimmedEmail });
  } catch (err) {
    console.error("[careers/notify] send failed:", err);
  }

  return NextResponse.json({ ok: true });
}

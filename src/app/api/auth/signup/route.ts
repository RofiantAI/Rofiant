import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAuthActionEmail } from "@/lib/email";
import {
  buildAdultSignupMetadata,
  buildMinorSignupMetadata,
  MINOR_AGE_THRESHOLD,
} from "@/lib/minor-account";
import { authRatelimit, enforceRatelimit } from "@/lib/ratelimit";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limited = await enforceRatelimit(authRatelimit, ip);
  if (limited) return limited;

  const { email, password, name, age, turnstileToken, redirectTo } = await req.json();

  if (!email?.trim() || !password || age === undefined || age === null) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const parsedAge = Number.parseInt(String(age), 10);
  if (!Number.isFinite(parsedAge) || parsedAge < 1 || parsedAge > 120) {
    return NextResponse.json({ error: "Enter a valid age" }, { status: 400 });
  }

  const isMinor = parsedAge < MINOR_AGE_THRESHOLD;
  if (!isMinor && !name?.trim()) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
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
    type: "signup",
    email: email.trim(),
    password,
    options: {
      data: isMinor
        ? buildMinorSignupMetadata()
        : buildAdultSignupMetadata(name, parsedAge),
      redirectTo,
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }
    console.error("[auth/signup] generateLink failed:", error);
    return NextResponse.json({ error: "Could not create account" }, { status: 500 });
  }

  const actionUrl = data.properties?.action_link;
  if (!actionUrl) {
    console.error("[auth/signup] missing action_link");
    return NextResponse.json({ error: "Could not create account" }, { status: 500 });
  }

  try {
    await sendAuthActionEmail({
      to: email.trim(),
      actionType: "signup",
      actionUrl,
      otp: data.properties.email_otp,
    });
  } catch (err) {
    console.error("[auth/signup] email send failed:", err);
    return NextResponse.json({ error: "Could not send confirmation email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";
import { authRatelimit, enforceRatelimit } from "@/lib/ratelimit";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limited = await enforceRatelimit(authRatelimit, ip);
  if (limited) return limited;

  const { name, email, subject, message, category, turnstileToken } = await req.json();

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const verified = await verifyTurnstileToken(turnstileToken, ip);
  if (!verified) {
    return NextResponse.json({ error: "Captcha verification failed" }, { status: 400 });
  }

  try {
    await sendContactEmail({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      category: category?.trim() || "General",
    });
  } catch (err) {
    console.error("[contact] send failed:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

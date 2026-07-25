const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(token: string | undefined | null, ip: string): Promise<boolean> {
  if (!token) {
    console.error("[turnstile] no token provided by client");
    return false;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("[turnstile] TURNSTILE_SECRET_KEY not configured");
    return false;
  }

  const res = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: token, remoteip: ip }),
  });

  const data = await res.json();
  if (data.success !== true) {
    console.error("[turnstile] siteverify rejected:", data["error-codes"]);
  }
  return data.success === true;
}

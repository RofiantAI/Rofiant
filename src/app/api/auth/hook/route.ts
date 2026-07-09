import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { buildAuthVerifyUrl } from "@/lib/auth-email-url";
import { sendAuthActionEmail } from "@/lib/email";

type HookPayload = {
  user: {
    email: string;
    new_email?: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    token_new: string;
    token_hash_new: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
};

function getHookSecret() {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET;
  if (!secret) return null;
  return secret.replace(/^v1,whsec_/, "");
}

async function sendVerifiedActionEmail({
  to,
  actionType,
  tokenHash,
  redirectTo,
  otp,
}: {
  to: string;
  actionType: string;
  tokenHash: string;
  redirectTo: string;
  otp?: string;
}) {
  const actionUrl = buildAuthVerifyUrl({
    tokenHash,
    actionType,
    redirectTo,
  });
  await sendAuthActionEmail({ to, actionType, actionUrl, otp });
}

export async function POST(req: Request) {
  const hookSecret = getHookSecret();
  if (!hookSecret) {
    console.error("[auth/hook] SEND_EMAIL_HOOK_SECRET not configured");
    return NextResponse.json({ error: "Hook not configured" }, { status: 500 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  let event: HookPayload;
  try {
    event = new Webhook(hookSecret).verify(payload, headers) as HookPayload;
  } catch (err) {
    console.error("[auth/hook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { user, email_data } = event;
  const { email_action_type, redirect_to, token, token_hash, token_new, token_hash_new } =
    email_data;

  try {
    if (email_action_type.endsWith("_notification")) {
      await sendAuthActionEmail({
        to: user.email,
        actionType: email_action_type,
      });
      return NextResponse.json({});
    }

    if (email_action_type === "email_change" && token_hash_new && user.new_email) {
      await Promise.all([
        sendVerifiedActionEmail({
          to: user.email,
          actionType: email_action_type,
          tokenHash: token_hash_new,
          redirectTo: redirect_to,
          otp: token,
        }),
        sendVerifiedActionEmail({
          to: user.new_email,
          actionType: email_action_type,
          tokenHash: token_hash,
          redirectTo: redirect_to,
          otp: token_new,
        }),
      ]);
      return NextResponse.json({});
    }

    await sendVerifiedActionEmail({
      to: user.email,
      actionType: email_action_type,
      tokenHash: token_hash,
      redirectTo: redirect_to,
      otp: token,
    });
    return NextResponse.json({});
  } catch (err) {
    console.error("[auth/hook] send failed:", err);
    return NextResponse.json(
      {
        error: {
          message: err instanceof Error ? err.message : "Failed to send email",
        },
      },
      { status: 500 },
    );
  }
}

import { Resend } from "resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const FROM = process.env.RESEND_FROM ?? "Rofiant <noreply@rofiant.ca>";
const TEST_TO = process.env.RESEND_TEST_TO ?? null;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set");
  return new Resend(apiKey);
}

export async function sendInviteEmail({
  to,
  agencyName,
  invitedByEmail,
  role,
}: {
  to: string;
  agencyName: string;
  invitedByEmail: string;
  role: string;
}) {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: FROM,
    to: TEST_TO ?? to,
    subject: `You've been invited to join ${agencyName} on Rofiant`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0a0a;color:#fff">
        <img src="${APP_URL}/logo-light.svg" alt="Rofiant" style="height:20px;margin-bottom:32px" />
        <h1 style="font-size:20px;font-weight:400;margin:0 0 12px">You&apos;ve been invited</h1>
        <p style="font-size:14px;color:#a1a1aa;margin:0 0 24px">
          <strong style="color:#fff">${invitedByEmail}</strong> has invited you to join
          <strong style="color:#fff">${agencyName}</strong> as <strong style="color:#fff;text-transform:capitalize">${role}</strong>.
        </p>
        <a href="${APP_URL}/dashboard"
          style="display:inline-block;background:#fff;color:#000;font-size:13px;font-weight:500;padding:10px 24px;text-decoration:none">
          Accept invitation
        </a>
        <p style="font-size:12px;color:#52525b;margin:32px 0 0">
          Log in to your Rofiant account to accept or decline this invitation.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[email] Resend error:", error);
    throw new Error(`Resend error: ${error.message}`);
  }
}

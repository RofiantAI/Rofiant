import { Resend } from "resend";
import {
  type AuthEmailActionType,
  isAuthNotificationOnly,
} from "@/lib/auth-email-url";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const FROM = process.env.RESEND_FROM ?? "Rofiant <noreply@rofiant.ca>";
const TEST_TO = process.env.RESEND_TEST_TO ?? null;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set");
  return new Resend(apiKey);
}

function authEmailHtml({
  heading,
  body,
  ctaLabel,
  ctaHref,
  otp,
}: {
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  otp?: string;
}) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0a0a;color:#fff">
      <img src="${APP_URL}/logo-light.svg" alt="Rofiant" style="height:20px;margin-bottom:32px" />
      <h1 style="font-size:20px;font-weight:400;margin:0 0 12px">${heading}</h1>
      <p style="font-size:14px;color:#a1a1aa;margin:0 0 24px;white-space:pre-line">${body}</p>
      ${
        ctaLabel && ctaHref
          ? `<a href="${ctaHref}" style="display:inline-block;background:#fff;color:#000;font-size:13px;font-weight:500;padding:10px 24px;text-decoration:none;margin-bottom:16px">${ctaLabel}</a>`
          : ""
      }
      ${
        otp
          ? `<p style="font-size:12px;color:#71717a;margin:0 0 8px">Or use this code:</p>
             <p style="font-size:24px;letter-spacing:0.2em;color:#fff;margin:0 0 24px;font-family:monospace">${otp}</p>`
          : ""
      }
      <p style="font-size:12px;color:#52525b;margin:32px 0 0">
        If you did not request this email, you can safely ignore it.
      </p>
    </div>
  `;
}

const AUTH_EMAIL_COPY: Record<
  AuthEmailActionType | string,
  { subject: string; heading: string; body: string; ctaLabel?: string }
> = {
  signup: {
    subject: "Confirm your Rofiant account",
    heading: "Confirm your email",
    body: "Thanks for signing up. Confirm your email to finish creating your account.",
    ctaLabel: "Confirm email",
  },
  invite: {
    subject: "You're invited to Rofiant",
    heading: "Accept your invitation",
    body: "You've been invited to join Rofiant. Use the button below to accept.",
    ctaLabel: "Accept invitation",
  },
  magiclink: {
    subject: "Your Rofiant sign-in link",
    heading: "Sign in to Rofiant",
    body: "Use the button below to sign in. This link expires soon.",
    ctaLabel: "Sign in",
  },
  recovery: {
    subject: "Reset your Rofiant password",
    heading: "Reset your password",
    body: "We received a request to reset your password. Use the button below to choose a new one.",
    ctaLabel: "Reset password",
  },
  email_change: {
    subject: "Confirm your new Rofiant email",
    heading: "Confirm email change",
    body: "Confirm this email change to update your account.",
    ctaLabel: "Confirm email change",
  },
  email: {
    subject: "Confirm your Rofiant email",
    heading: "Confirm your email",
    body: "Confirm your email address to continue.",
    ctaLabel: "Confirm email",
  },
  reauthentication: {
    subject: "Confirm your identity",
    heading: "Re-authentication required",
    body: "Confirm your identity to continue this sensitive action.",
    ctaLabel: "Continue",
  },
  password_changed_notification: {
    subject: "Your Rofiant password was changed",
    heading: "Password changed",
    body: "Your account password was just changed. If this wasn't you, contact support immediately.",
  },
  email_changed_notification: {
    subject: "Your Rofiant email was changed",
    heading: "Email changed",
    body: "The email address on your account was just updated. If this wasn't you, contact support immediately.",
  },
  phone_changed_notification: {
    subject: "Your Rofiant phone number was changed",
    heading: "Phone number changed",
    body: "The phone number on your account was just updated. If this wasn't you, contact support immediately.",
  },
  identity_linked_notification: {
    subject: "A sign-in method was linked",
    heading: "Sign-in method linked",
    body: "A new sign-in method was linked to your Rofiant account.",
  },
  identity_unlinked_notification: {
    subject: "A sign-in method was removed",
    heading: "Sign-in method removed",
    body: "A sign-in method was removed from your Rofiant account.",
  },
  mfa_factor_enrolled_notification: {
    subject: "Multi-factor authentication enabled",
    heading: "MFA enabled",
    body: "A new multi-factor authentication method was added to your account.",
  },
  mfa_factor_unenrolled_notification: {
    subject: "Multi-factor authentication removed",
    heading: "MFA removed",
    body: "A multi-factor authentication method was removed from your account.",
  },
};

export async function sendAuthActionEmail({
  to,
  actionType,
  actionUrl,
  otp,
}: {
  to: string;
  actionType: string;
  actionUrl?: string;
  otp?: string;
}) {
  const copy = AUTH_EMAIL_COPY[actionType] ?? {
    subject: "Rofiant account notification",
    heading: "Account notification",
    body: "An action was requested on your Rofiant account.",
    ctaLabel: "Open Rofiant",
  };

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: FROM,
    to: TEST_TO ?? to,
    subject: copy.subject,
    html: authEmailHtml({
      heading: copy.heading,
      body: copy.body,
      ctaLabel: isAuthNotificationOnly(actionType) ? undefined : copy.ctaLabel,
      ctaHref: isAuthNotificationOnly(actionType) ? undefined : actionUrl ?? `${APP_URL}/auth/login`,
      otp: isAuthNotificationOnly(actionType) ? undefined : otp,
    }),
  });

  if (error) {
    console.error("[email] Resend auth error:", error);
    throw new Error(`Resend error: ${error.message}`);
  }
}

async function sendNotificationEmail({
  to,
  subject,
  heading,
  body,
  ctaLabel,
  ctaHref,
}: {
  to: string;
  subject: string;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: FROM,
    to: TEST_TO ?? to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0a0a;color:#fff">
        <img src="${APP_URL}/logo-light.svg" alt="Rofiant" style="height:20px;margin-bottom:32px" />
        <h1 style="font-size:20px;font-weight:400;margin:0 0 12px">${heading}</h1>
        <p style="font-size:14px;color:#a1a1aa;margin:0 0 24px;white-space:pre-line">${body}</p>
        ${
          ctaLabel && ctaHref
            ? `<a href="${ctaHref}" style="display:inline-block;background:#fff;color:#000;font-size:13px;font-weight:500;padding:10px 24px;text-decoration:none">${ctaLabel}</a>`
            : ""
        }
        <p style="font-size:12px;color:#52525b;margin:32px 0 0">
          You're receiving this because you have this alert enabled in
          <a href="${APP_URL}/dashboard/settings" style="color:#71717a">Notification settings</a>.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[email] Resend error:", error);
    throw new Error(`Resend error: ${error.message}`);
  }
}

const CONTACT_TO = process.env.CONTACT_TO_EMAIL ?? "contact@rofiant.ca";

export async function sendContactEmail({
  name,
  email,
  subject,
  message,
  category,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
}) {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: FROM,
    to: TEST_TO ?? CONTACT_TO,
    replyTo: email,
    subject: `[${category}] ${subject}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0a0a;color:#fff">
        <h1 style="font-size:20px;font-weight:400;margin:0 0 12px">New contact form submission</h1>
        <p style="font-size:14px;color:#a1a1aa;margin:0 0 4px"><strong style="color:#fff">From:</strong> ${name} (${email})</p>
        <p style="font-size:14px;color:#a1a1aa;margin:0 0 4px"><strong style="color:#fff">Category:</strong> ${category}</p>
        <p style="font-size:14px;color:#a1a1aa;margin:0 0 20px"><strong style="color:#fff">Subject:</strong> ${subject}</p>
        <p style="font-size:14px;color:#fff;white-space:pre-line;border-top:1px solid #27272a;padding-top:16px">${message}</p>
      </div>
    `,
  });

  if (error) {
    console.error("[email] Resend error:", error);
    throw new Error(`Resend error: ${error.message}`);
  }
}

export async function sendCareersNotifyEmail({ email }: { email: string }) {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: FROM,
    to: TEST_TO ?? CONTACT_TO,
    replyTo: email,
    subject: "[Careers] New notify-me signup",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0a0a;color:#fff">
        <h1 style="font-size:20px;font-weight:400;margin:0 0 12px">New careers notify signup</h1>
        <p style="font-size:14px;color:#a1a1aa;margin:0"><strong style="color:#fff">Email:</strong> ${email}</p>
      </div>
    `,
  });

  if (error) {
    console.error("[email] Resend error:", error);
    throw new Error(`Resend error: ${error.message}`);
  }
}

export async function sendSecurityAlertEmail({
  to,
  event,
  detail,
}: {
  to: string;
  event: "new_login" | "api_key_created";
  detail: string;
}) {
  const heading = event === "new_login" ? "New login detected" : "New API key created";
  await sendNotificationEmail({
    to,
    subject: `Security alert: ${heading}`,
    heading,
    body: detail,
    ctaLabel: "Review security settings",
    ctaHref: `${APP_URL}/dashboard/settings`,
  });
}

export async function sendBillingAlertEmail({
  to,
  type,
  detail,
}: {
  to: string;
  type: "renewal_upcoming" | "payment_failed" | "subscription_canceled";
  detail: string;
}) {
  const heading =
    type === "renewal_upcoming"
      ? "Upcoming renewal"
      : type === "payment_failed"
        ? "Payment failed"
        : "Subscription canceled";
  await sendNotificationEmail({
    to,
    subject: `Billing alert: ${heading}`,
    heading,
    body: detail,
    ctaLabel: "View billing",
    ctaHref: `${APP_URL}/dashboard/agency/billing`,
  });
}

export async function sendUsageAlertEmail({
  to,
  detail,
}: {
  to: string;
  detail: string;
}) {
  await sendNotificationEmail({
    to,
    subject: "Usage alert: approaching plan limit",
    heading: "You're approaching your plan limit",
    body: detail,
    ctaLabel: "View usage",
    ctaHref: `${APP_URL}/dashboard/usage`,
  });
}

export async function sendApiFailureAlertEmail({
  to,
  detail,
}: {
  to: string;
  detail: string;
}) {
  await sendNotificationEmail({
    to,
    subject: "API alert: repeated request failures",
    heading: "Your API requests are failing repeatedly",
    body: detail,
    ctaLabel: "View API keys",
    ctaHref: `${APP_URL}/dashboard/api-keys`,
  });
}

export async function sendProductUpdateEmail({
  to,
  subject,
  detail,
}: {
  to: string;
  subject: string;
  detail: string;
}) {
  await sendNotificationEmail({
    to,
    subject: `Rofiant update: ${subject}`,
    heading: subject,
    body: detail,
    ctaLabel: "See what's new",
    ctaHref: `${APP_URL}/dashboard`,
  });
}

export async function sendWeeklyDigestEmail({
  to,
  detail,
}: {
  to: string;
  detail: string;
}) {
  await sendNotificationEmail({
    to,
    subject: "Your weekly Rofiant digest",
    heading: "Your week in review",
    body: detail,
    ctaLabel: "Open dashboard",
    ctaHref: `${APP_URL}/dashboard`,
  });
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

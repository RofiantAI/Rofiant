import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEventEntity } from "creem/webhooks";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBillingAlertEmail } from "@/lib/email";
import { isNotifEnabled } from "@/lib/notification-prefs";

async function notifyBilling(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  type: "renewal_upcoming" | "payment_failed" | "subscription_canceled",
  detail: string,
) {
  try {
    const enabled = await isNotifEnabled(supabase, userId, "billing_alerts");
    if (!enabled) return;
    const { data } = await supabase.auth.admin.getUserById(userId);
    const email = data?.user?.email;
    if (!email) return;
    await sendBillingAlertEmail({ to: email, type, detail });
  } catch (err) {
    console.error("[creem webhook] billing alert email failed:", err);
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let event: Awaited<ReturnType<typeof constructWebhookEventEntity>>;
  try {
    event = await constructWebhookEventEntity(rawBody, req.headers, {
      secret: process.env.CREEM_WEBHOOK_SECRET!,
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.eventType) {
    case "checkout.completed": {
      const checkout = event.object;
      const userId: string | undefined = checkout.metadata?.userId;
      const plan: string | undefined = checkout.metadata?.plan;
      if (userId && plan) {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { plan, ...(plan === "pro" ? { trial_used: true } : {}) },
        });
      }
      break;
    }

    case "subscription.active":
    case "subscription.paid": {
      const sub = event.object;
      const userId: string | undefined = sub.metadata?.userId;
      const plan: string | undefined = sub.metadata?.plan;
      if (userId && plan) {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { plan },
        });
      }
      break;
    }

    case "subscription.canceled":
    case "subscription.expired":
    case "subscription.past_due": {
      const sub = event.object;
      const userId: string | undefined = sub.metadata?.userId;
      if (userId) {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { plan: "free" },
        });
        const detail =
          event.eventType === "subscription.past_due"
            ? "We couldn't process your latest payment. Update your billing details to avoid losing access."
            : "Your subscription has ended and your plan has been downgraded to Free.";
        await notifyBilling(
          supabase,
          userId,
          event.eventType === "subscription.past_due" ? "payment_failed" : "subscription_canceled",
          detail,
        );
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

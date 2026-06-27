import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEventEntity } from "creem/webhooks";
import { createAdminClient } from "@/lib/supabase/admin";

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
          user_metadata: { plan },
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
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

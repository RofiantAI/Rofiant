import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type WebhookEvent = "document.processed" | "voice.processed";

export async function dispatchWebhook(
  userId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
) {
  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("webhook_subscriptions")
    .select("id, url, secret, events")
    .eq("user_id", userId)
    .eq("active", true)
    .contains("events", [event]);

  if (!subs?.length) return;

  const body = JSON.stringify({ event, created: Math.floor(Date.now() / 1000), data: payload });

  await Promise.allSettled(
    subs.map((sub) => {
      const signature = createHmac("sha256", sub.secret).update(body).digest("hex");
      return fetch(sub.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Rofiant-Signature": signature,
        },
        body,
      }).catch((err) => console.error(`[webhooks] delivery to ${sub.url} failed:`, err));
    }),
  );
}

import type { SupabaseClient } from "@supabase/supabase-js";

export type NotifKey =
  | "usage_alerts"
  | "security_alerts"
  | "product_updates"
  | "weekly_digest"
  | "api_failures"
  | "billing_alerts";

const DEFAULT_NOTIFS: Record<NotifKey, boolean> = {
  usage_alerts: true,
  security_alerts: true,
  product_updates: false,
  weekly_digest: false,
  api_failures: true,
  billing_alerts: true,
};

export async function isNotifEnabled(
  admin: SupabaseClient,
  userId: string,
  key: NotifKey,
): Promise<boolean> {
  const { data } = await admin
    .from("user_settings")
    .select("notification_prefs")
    .eq("user_id", userId)
    .maybeSingle();

  const prefs = { ...DEFAULT_NOTIFS, ...(data?.notification_prefs ?? {}) };
  return prefs[key];
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { getActiveAnnouncements, getUserAgencyIds } from "@/lib/agency-broadcast";
import { getActiveSiteAnnouncements } from "@/lib/site-broadcast";

export type UserNotification = {
  id: string;
  source_key: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

type NotificationInsert = {
  user_id: string;
  source_key: string;
  title: string;
  body: string;
  href?: string | null;
  created_at?: string;
};

const MAX_DISMISSED_KEYS = 200;

export function getDismissedNotificationKeys(
  metadata: Record<string, unknown> | undefined,
): Set<string> {
  const raw = metadata?.dismissed_notifications;
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.filter((key): key is string => typeof key === "string"));
}

export function mergeDismissedNotificationKeys(
  existing: Set<string>,
  sourceKeys: string[],
): string[] {
  const merged = [...existing, ...sourceKeys];
  return [...new Set(merged)].slice(-MAX_DISMISSED_KEYS);
}

export async function syncUserNotifications(
  supabase: SupabaseClient,
  userId: string,
  admin?: SupabaseClient,
  dismissedKeys: Set<string> = new Set(),
) {
  const rows: NotificationInsert[] = [];

  const inviteClient = admin ?? supabase;
  const { data: pendingInvites } = await inviteClient
    .from("agency_members")
    .select("id, role, agency_id, invited_at")
    .eq("user_id", userId)
    .eq("status", "pending");

  if (pendingInvites?.length) {
    const agencyIds = pendingInvites.map((r) => r.agency_id);
    const { data: agencies } = await inviteClient
      .from("agencies")
      .select("id, name")
      .in("id", agencyIds);

    const agencyMap = Object.fromEntries(
      (agencies ?? []).map((a: { id: string; name: string }) => [a.id, a.name]),
    );

    for (const invite of pendingInvites) {
      const agencyName = agencyMap[invite.agency_id] ?? "An organization";
      rows.push({
        user_id: userId,
        source_key: `invite:${invite.id}`,
        title: "Organization invite",
        body: `You've been invited to join ${agencyName} as ${invite.role}.`,
        href: "/dashboard/agency/members",
        created_at: invite.invited_at,
      });
    }
  }

  const siteAnnouncements = await getActiveSiteAnnouncements(supabase);
  for (const item of siteAnnouncements) {
    rows.push({
      user_id: userId,
      source_key: `site-announcement:${item.id}`,
      title: item.title,
      body: item.body,
      href: "/dashboard",
      created_at: item.created_at,
    });
  }

  const agencyIds = await getUserAgencyIds(supabase, userId);
  const agencyAnnouncements = await getActiveAnnouncements(supabase, agencyIds);
  for (const item of agencyAnnouncements) {
    rows.push({
      user_id: userId,
      source_key: `agency-announcement:${item.id}`,
      title: item.title,
      body: item.body,
      href: "/dashboard/agency",
      created_at: item.created_at,
    });
  }

  if (rows.length === 0) return;

  const activeRows = rows.filter((row) => !dismissedKeys.has(row.source_key));
  if (activeRows.length === 0) return;

  await supabase.from("user_notifications").upsert(activeRows, {
    onConflict: "user_id,source_key",
    ignoreDuplicates: true,
  });
}

export async function listUserNotifications(
  supabase: SupabaseClient,
  userId: string,
  admin?: SupabaseClient,
  dismissedKeys: Set<string> = new Set(),
) {
  await syncUserNotifications(supabase, userId, admin, dismissedKeys);

  const { data, error } = await supabase
    .from("user_notifications")
    .select("id, source_key, title, body, href, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as UserNotification[];
}

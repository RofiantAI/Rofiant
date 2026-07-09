import type { SupabaseClient } from "@supabase/supabase-js";

export type AgencyAnnouncement = {
  id: string;
  agency_id: string;
  title: string;
  body: string;
  variant: "info" | "warning" | "critical";
  active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
};

export type AgencyScreen = {
  id: string;
  agency_id: string;
  slug: string;
  title: string;
  content: string;
  published: boolean;
  show_in_nav: boolean;
  nav_label: string | null;
};

export async function getOwnedAgency(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data } = await supabase
    .from("agencies")
    .select("id, name, owner_id")
    .eq("owner_id", userId)
    .maybeSingle();
  return data;
}

export async function getUserAgencyIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const owned = await getOwnedAgency(supabase, userId);
  const { data: memberships } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", userId)
    .eq("status", "active");

  const ids = new Set<string>();
  if (owned?.id) ids.add(owned.id);
  for (const row of memberships ?? []) {
    ids.add(row.agency_id);
  }
  return [...ids];
}

export async function getActiveAnnouncements(
  supabase: SupabaseClient,
  agencyIds: string[],
): Promise<AgencyAnnouncement[]> {
  if (agencyIds.length === 0) return [];

  const now = new Date().toISOString();
  const { data } = await supabase
    .from("agency_announcements")
    .select("*")
    .in("agency_id", agencyIds)
    .eq("active", true)
    .lte("starts_at", now)
    .order("created_at", { ascending: false });

  return ((data ?? []) as AgencyAnnouncement[]).filter(
    (row) => !row.expires_at || row.expires_at > now,
  );
}

export async function getNavScreens(
  supabase: SupabaseClient,
  agencyIds: string[],
): Promise<AgencyScreen[]> {
  if (agencyIds.length === 0) return [];

  const { data } = await supabase
    .from("agency_screens")
    .select("*")
    .in("agency_id", agencyIds)
    .eq("published", true)
    .eq("show_in_nav", true)
    .order("title", { ascending: true });

  return (data ?? []) as AgencyScreen[];
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

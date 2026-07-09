import { unstable_noStore as noStore } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SiteAnnouncement = {
  id: string;
  title: string;
  body: string;
  variant: "info" | "warning" | "critical";
  active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
};

export type SiteScreen = {
  id: string;
  slug: string;
  title: string;
  content: string;
  published: boolean;
  show_in_nav: boolean;
  nav_label: string | null;
  updated_at: string;
};

export async function getActiveSiteAnnouncements(
  supabase: SupabaseClient,
): Promise<SiteAnnouncement[]> {
  noStore();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("site_announcements")
    .select("*")
    .eq("active", true)
    .lte("starts_at", now)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[site-broadcast] getActiveSiteAnnouncements:", error.message);
    return [];
  }

  return ((data ?? []) as SiteAnnouncement[]).filter(
    (row) => !row.expires_at || row.expires_at > now,
  );
}

export async function getSiteNavScreens(
  supabase: SupabaseClient,
): Promise<SiteScreen[]> {
  const { data } = await supabase
    .from("site_screens")
    .select("*")
    .eq("published", true)
    .eq("show_in_nav", true)
    .order("title", { ascending: true });

  return (data ?? []) as SiteScreen[];
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

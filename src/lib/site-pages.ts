import type { SupabaseClient } from "@supabase/supabase-js";

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

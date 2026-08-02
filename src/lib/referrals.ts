import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type Referral = {
  id: string;
  createdAt: string;
  email: string | null;
};

// Referrer's own auth.users row is only visible to itself via RLS, and the
// referred users' emails aren't exposed through the anon client at all
// (auth.users isn't queryable via PostgREST) — so once we know which ids
// belong to this referrer, resolve their emails with the admin client.
export async function getReferrals(supabase: SupabaseClient, userId: string): Promise<Referral[]> {
  const { data: rows } = await supabase
    .from("referrals")
    .select("id, referred_id, created_at")
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false });

  if (!rows || rows.length === 0) return [];

  const admin = createAdminClient();
  const emails = await Promise.all(
    rows.map(async (row) => {
      const { data } = await admin.auth.admin.getUserById(row.referred_id);
      return data.user?.email ?? null;
    }),
  );

  return rows.map((row, i) => ({
    id: row.id,
    createdAt: row.created_at,
    email: emails[i],
  }));
}

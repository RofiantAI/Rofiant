import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

/** Find or create an auth user for agency member / SCIM provisioning. */
export async function findOrCreateAuthUser(
  admin: SupabaseClient,
  email: string,
): Promise<{ user: User | null; error?: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { user: null, error: "Email required" };

  const { data: listed, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) return { user: null, error: listError.message };

  const existing = listed.users.find((u) => u.email?.toLowerCase() === normalized);
  if (existing) return { user: existing };

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: normalized,
    email_confirm: true,
  });
  if (createError) return { user: null, error: createError.message };
  return { user: created.user };
}

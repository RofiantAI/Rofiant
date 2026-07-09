import { createAdminClient } from "@/lib/supabase/admin";

export async function logAudit({
  userId,
  agencyId,
  action,
  detail = {},
  ip,
}: {
  userId: string | null;
  agencyId?: string | null;
  action: string;
  detail?: Record<string, unknown>;
  ip?: string | null;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    user_id: userId,
    agency_id: agencyId ?? null,
    action,
    detail,
    ip: ip ?? null,
  });
  if (error) console.error("[audit] failed to write log:", error);
}

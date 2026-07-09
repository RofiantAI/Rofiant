import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { getOrgAgencyForUser, isOrgPlan, toCsv } from "@/lib/agency-org";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  if (!isOrgPlan(plan)) {
    return new Response("Access review requires Agency or Enterprise plan", { status: 403 });
  }

  const agency = await getOrgAgencyForUser(supabase, user.id);
  if (!agency) return new Response("Organization not found", { status: 404 });

  const type = new URL(req.url).searchParams.get("type") ?? "roster";
  const admin = createAdminClient();
  const date = new Date().toISOString().slice(0, 10);

  if (type === "audit") {
    const { data: members } = await admin
      .from("agency_members")
      .select("user_id")
      .eq("agency_id", agency.id);

    const userIds = (members ?? [])
      .map((m) => m.user_id)
      .filter((id): id is string => typeof id === "string");

    const [{ data: agencyLogs }, { data: memberLogs }] = await Promise.all([
      admin
        .from("audit_logs")
        .select("id, created_at, user_id, action, detail, ip")
        .eq("agency_id", agency.id)
        .order("created_at", { ascending: false })
        .limit(5000),
      userIds.length > 0
        ? admin
            .from("audit_logs")
            .select("id, created_at, user_id, action, detail, ip")
            .in("user_id", userIds)
            .order("created_at", { ascending: false })
            .limit(5000)
        : Promise.resolve({ data: [] as { id: string; created_at: string; user_id: string | null; action: string; detail: unknown; ip: string | null }[] }),
    ]);

    const seen = new Set<string>();
    const logs = [...(agencyLogs ?? []), ...(memberLogs ?? [])]
      .filter((log) => {
        if (seen.has(log.id)) return false;
        seen.add(log.id);
        return true;
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5000);

    const csv = toCsv(
      ["timestamp", "user_id", "action", "detail", "ip"],
      (logs ?? []).map((log) => [
        log.created_at,
        log.user_id ?? "",
        log.action,
        JSON.stringify(log.detail ?? {}),
        log.ip ?? "",
      ]),
    );

    const ip = req.headers.get("x-forwarded-for");
    await logAudit({
      userId: user.id,
      agencyId: agency.id,
      action: "access_review.audit_exported",
      detail: { rows: logs?.length ?? 0 },
      ip,
    });

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="org-audit-log-${date}.csv"`,
      },
    });
  }

  const { data: members } = await admin
    .from("agency_members")
    .select("email, role, status, invited_at, joined_at")
    .eq("agency_id", agency.id)
    .order("email", { ascending: true });

  const csv = toCsv(
    ["email", "role", "status", "invited_at", "joined_at"],
    (members ?? []).map((m) => [
      m.email,
      m.role,
      m.status,
      m.invited_at,
      m.joined_at ?? "",
    ]),
  );

  const ip = req.headers.get("x-forwarded-for");
  await logAudit({
    userId: user.id,
    agencyId: agency.id,
    action: "access_review.roster_exported",
    detail: { rows: members?.length ?? 0 },
    ip,
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="org-member-roster-${date}.csv"`,
    },
  });
}

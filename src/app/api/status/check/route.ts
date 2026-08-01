import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// One representative table per public-facing service — a fast, real query
// against each is a reasonable proxy for "is this subsystem reachable."
const SERVICE_TABLES: Record<string, string> = {
  chatAi: "conversations",
  dashboard: "agencies",
};

async function checkService(admin: ReturnType<typeof createAdminClient>, table: string) {
  const start = Date.now();
  try {
    const { error } = await admin.from(table).select("id").limit(1);
    return { healthy: !error, latency_ms: Date.now() - start };
  } catch {
    return { healthy: false, latency_ms: Date.now() - start };
  }
}

// Invoked once daily by the Vercel Cron defined in vercel.json (Hobby plan
// caps cron frequency at once/day). Vercel automatically sends
// `Authorization: Bearer ${CRON_SECRET}` on cron requests when that env var
// is set, so we verify it the same way here.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();

  const results = await Promise.all(
    Object.entries(SERVICE_TABLES).map(async ([service, table]) => {
      const { healthy, latency_ms } = await checkService(admin, table);
      return { service, healthy, latency_ms };
    })
  );

  const { error } = await admin.from("status_checks").insert(results);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, checked_at: new Date().toISOString(), results });
}

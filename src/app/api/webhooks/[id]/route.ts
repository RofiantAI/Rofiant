import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const { error } = await supabase
    .from("webhook_subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return new NextResponse(error.message, { status: 500 });

  logAudit({
    userId: user.id,
    action: "webhook.deleted",
    detail: { webhookId: id },
    ip: req.headers.get("x-forwarded-for"),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}

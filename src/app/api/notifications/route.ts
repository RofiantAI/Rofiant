import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getDismissedNotificationKeys,
  listUserNotifications,
  mergeDismissedNotificationKeys,
} from "@/lib/user-notifications";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const dismissedKeys = getDismissedNotificationKeys(user.user_metadata);
    const notifications = await listUserNotifications(
      supabase,
      user.id,
      createAdminClient(),
      dismissedKeys,
    );
    const unreadCount = notifications.filter((n) => !n.read_at).length;
    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load notifications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = body.action as string | undefined;

  if (action === "read_all") {
    const { error } = await supabase
      .from("user_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "clear_all") {
    const { data: existing, error: fetchError } = await supabase
      .from("user_notifications")
      .select("source_key")
      .eq("user_id", user.id);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const dismissed = mergeDismissedNotificationKeys(
      getDismissedNotificationKeys(user.user_metadata),
      (existing ?? []).map((row) => row.source_key),
    );

    const { error: deleteError } = await supabase
      .from("user_notifications")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: { dismissed_notifications: dismissed },
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

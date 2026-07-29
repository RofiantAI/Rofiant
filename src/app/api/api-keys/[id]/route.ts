import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return new NextResponse(error.message, { status: 500 });

  return NextResponse.json({ ok: true });
}

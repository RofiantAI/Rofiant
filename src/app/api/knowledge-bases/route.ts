import { NextRequest, NextResponse } from "next/server";
import { kbLimitForPlan } from "@/lib/service-plan-access";
import { getAuthedUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { supabase, user } = await getAuthedUser(req);
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data, error } = await supabase
    .from("knowledge_bases")
    .select("*, knowledge_base_documents(count)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await getAuthedUser(req);
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  const limit = kbLimitForPlan(plan);

  if (limit === 0) {
    return NextResponse.json({ error: "Knowledge bases require a paid plan" }, { status: 403 });
  }

  if (isFinite(limit)) {
    const { count } = await supabase
      .from("knowledge_bases")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id);
    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        { error: `Your plan allows up to ${limit} knowledge base${limit === 1 ? "" : "s"}. Upgrade to create more.` },
        { status: 403 },
      );
    }
  }

  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data, error } = await supabase
    .from("knowledge_bases")
    .insert({ owner_id: user.id, name: name.trim(), description: description?.trim() ?? "" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

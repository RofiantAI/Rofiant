import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { creem } from "@/lib/creem";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const customer = await creem.customers.retrieve(undefined, user.email);
    const { customerPortalLink } = await creem.customers.generateBillingLinks({
      customerId: customer.id,
    });
    return NextResponse.json({ url: customerPortalLink });
  } catch {
    return NextResponse.json(
      { error: "No billing account found yet. Upgrade to a paid plan to manage billing." },
      { status: 404 },
    );
  }
}

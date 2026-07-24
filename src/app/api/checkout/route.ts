import { NextRequest, NextResponse } from "next/server";
import { creem, PLAN_PRODUCT_IDS } from "@/lib/creem";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get("plan");
  const productId = plan ? PLAN_PRODUCT_IDS[plan] : undefined;
  if (!plan || !productId) {
    return NextResponse.json({ error: "Invalid or unavailable plan" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    const next = encodeURIComponent(`/api/checkout?plan=${plan}`);
    return NextResponse.redirect(new URL(`/auth/login?next=${next}`, req.url));
  }

  try {
    const checkout = await creem.checkouts.create({
      productId,
      successUrl: new URL(`/pricing/success?plan=${plan}`, req.url).toString(),
      customer: { email: user.email },
      metadata: { userId: user.id, plan },
    });

    if (!checkout.checkoutUrl) {
      throw new Error("Creem did not return a checkout URL");
    }

    return NextResponse.redirect(checkout.checkoutUrl);
  } catch (err) {
    console.error("[checkout] failed to create Creem checkout session:", err);
    return NextResponse.redirect(new URL("/pricing?error=checkout_failed", req.url));
  }
}

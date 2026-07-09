import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { creem, PLAN_PRODUCT_IDS } from "@/lib/creem";
import { routing } from "@/i18n/routing";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get("plan");
  if (!plan || !PLAN_PRODUCT_IDS[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL(`/${routing.defaultLocale}/auth/login?next=/pricing`, req.url));
  }

  const productId = PLAN_PRODUCT_IDS[plan];
  if (!productId) {
    return NextResponse.json({ error: "Product not configured" }, { status: 500 });
  }

  const checkout = await creem.checkouts.create({
    productId,
    successUrl: `${APP_URL}/pricing/success?plan=${plan}`,
    customer: { email: user.email },
    metadata: { userId: user.id, plan },
  });

  if (!checkout.checkoutUrl) {
    return NextResponse.json({ error: "No checkout URL returned" }, { status: 500 });
  }

  return NextResponse.redirect(checkout.checkoutUrl);
}

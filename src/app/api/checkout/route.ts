import { NextRequest, NextResponse } from "next/server";
import { creem, PLAN_PRODUCT_IDS, PRO_PRODUCT_ID_NO_TRIAL } from "@/lib/creem";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildTrialClaimFilter,
  getClientIp,
  getOrCreateDeviceId,
  hashIp,
  setDeviceCookie,
} from "@/lib/trial-fingerprint";

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get("plan");
  const annual = req.nextUrl.searchParams.get("interval") === "annual";
  const planKey = annual ? `${plan}_annual` : plan;
  if (!plan || !planKey || !PLAN_PRODUCT_IDS[planKey]) {
    return NextResponse.json({ error: "Invalid or unavailable plan" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    const next = encodeURIComponent(`/api/checkout?plan=${plan}${annual ? "&interval=annual" : ""}`);
    return NextResponse.redirect(new URL(`/auth/login?next=${next}`, req.url));
  }

  const { deviceId, isNew: isNewDevice } = getOrCreateDeviceId(req);
  const ipHash = hashIp(getClientIp(req));

  // Pro ships a 7-day free trial, but only for a user's first Pro checkout.
  // Annual Pro has no separate no-trial product yet, so trial status only affects monthly.
  let trialUsed = Boolean(user.user_metadata?.trial_used);
  if (!trialUsed && plan === "pro" && !annual) {
    const filter = buildTrialClaimFilter(deviceId, ipHash);
    if (filter) {
      const admin = createAdminClient();
      const { data: existingClaim } = await admin
        .from("trial_claims")
        .select("user_id")
        .or(filter)
        .neq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (existingClaim) trialUsed = true;
    }
  }

  const isTrial = plan === "pro" && !annual && !trialUsed;
  const productId =
    plan === "pro" && !annual && trialUsed ? PRO_PRODUCT_ID_NO_TRIAL : PLAN_PRODUCT_IDS[planKey];
  if (!productId) {
    return NextResponse.json({ error: "Invalid or unavailable plan" }, { status: 400 });
  }

  try {
    const checkout = await creem.checkouts.create({
      productId,
      successUrl: new URL(`/pricing/success?plan=${plan}`, req.url).toString(),
      customer: { email: user.email },
      metadata: {
        userId: user.id,
        plan,
        isTrial: String(isTrial),
        deviceId: deviceId ?? "",
        ipHash: ipHash ?? "",
      },
    });

    if (!checkout.checkoutUrl) {
      throw new Error("Creem did not return a checkout URL");
    }

    const res = NextResponse.redirect(checkout.checkoutUrl);
    if (isNewDevice) setDeviceCookie(res, deviceId);
    return res;
  } catch (err) {
    console.error("[checkout] failed to create Creem checkout session:", err);
    return NextResponse.redirect(new URL("/pricing?error=checkout_failed", req.url));
  }
}

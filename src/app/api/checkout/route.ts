import { NextRequest, NextResponse } from "next/server";
import { PLAN_PRODUCT_IDS } from "@/lib/creem";

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get("plan");
  if (!plan || !PLAN_PRODUCT_IDS[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // Paid plans are not on sale yet; block purchases even if this URL is hit directly.
  return NextResponse.json({ error: "This plan is not available yet" }, { status: 403 });
}

import { NextResponse } from "next/server";
import {
  canAccessTool,
  type ProductTool,
  upgradeTargetForTool,
} from "@/lib/service-plan-access";

export function planToolDeniedResponse(
  plan: string,
  tool: ProductTool,
  message?: string,
): NextResponse | null {
  if (canAccessTool(plan, tool)) return null;
  const target = upgradeTargetForTool(tool);
  return NextResponse.json(
    {
      error:
        message ??
        `This feature requires the ${target.plan.charAt(0).toUpperCase()}${target.plan.slice(1)} plan or higher.`,
      requiredPlan: target.plan,
      upgradeHref: target.href,
    },
    { status: 403 },
  );
}

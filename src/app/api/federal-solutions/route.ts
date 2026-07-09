import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { FEDERAL_SOLUTION_IDS, canDeployFederalSolutions } from "@/lib/federal-solutions";
import { WORKFLOW_INPUTS } from "@/lib/federal-workflows/prompts";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  const allowed = canDeployFederalSolutions(plan);

  return NextResponse.json({
    allowed,
    plan,
    solutions: FEDERAL_SOLUTION_IDS.map((id) => ({
      id,
      workflowPath: `/dashboard/agency/solutions/${id}`,
      inputs: WORKFLOW_INPUTS[id],
    })),
  });
}

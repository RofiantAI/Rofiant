import { notFound } from "next/navigation";
import { isFederalSolutionId } from "@/lib/federal-solutions";
import { FederalWorkflowClient } from "./workflow-client";

export default async function FederalWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isFederalSolutionId(id)) notFound();
  return <FederalWorkflowClient solutionId={id} />;
}

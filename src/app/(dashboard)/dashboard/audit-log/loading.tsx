import { DashboardPage } from "@/components/dashboard/ui/page-shell";
import { SkeletonPageHeader, SkeletonTable } from "@/components/ui/skeleton";

export default function AuditLogLoading() {
  return (
    <DashboardPage>
      <SkeletonPageHeader />
      <SkeletonTable rows={8} cols={4} />
    </DashboardPage>
  );
}

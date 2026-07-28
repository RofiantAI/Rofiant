import { DashboardPage } from "@/components/dashboard/ui/page-shell";
import { SkeletonCard, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function SiteScreenLoading() {
  return (
    <DashboardPage>
      <SkeletonPageHeader />
      <SkeletonCard className="min-h-96" />
    </DashboardPage>
  );
}

import { DashboardPage } from "@/components/dashboard/ui/page-shell";
import { SkeletonCard, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function SitePagesLoading() {
  return (
    <DashboardPage>
      <SkeletonPageHeader action />
      <SkeletonCard className="min-h-48" />
    </DashboardPage>
  );
}

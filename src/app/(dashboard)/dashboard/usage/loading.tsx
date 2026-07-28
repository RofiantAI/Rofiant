import { DashboardPage } from "@/components/dashboard/ui/page-shell";
import { SkeletonCard, SkeletonMetric, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function UsageLoading() {
  return (
    <DashboardPage>
      <SkeletonPageHeader />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonMetric />
        <SkeletonMetric />
        <SkeletonMetric />
        <SkeletonMetric />
      </div>
      <SkeletonCard className="min-h-64" />
    </DashboardPage>
  );
}

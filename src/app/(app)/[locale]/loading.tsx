import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-24 space-y-12">
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

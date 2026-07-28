import { Skeleton, SkeletonCard, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function ChatSettingsLoading() {
  return (
    <div className="h-full min-h-0 p-4 sm:p-6 md:p-8 space-y-6">
      <SkeletonPageHeader />
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 max-w-4xl">
        <div className="flex md:flex-col gap-2 md:w-44">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 md:w-full shrink-0 rounded-md" />
          ))}
        </div>
        <SkeletonCard className="flex-1 min-h-80" />
      </div>
    </div>
  );
}

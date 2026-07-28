import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export default function ConversationLoading() {
  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full px-4 py-8 gap-6">
      <div className="flex justify-end">
        <Skeleton className="h-9 w-2/3 max-w-sm rounded-2xl" />
      </div>
      <div className="max-w-lg">
        <SkeletonText lines={3} />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-9 w-1/2 max-w-xs rounded-2xl" />
      </div>
    </div>
  );
}

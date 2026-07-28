"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-console";

export default function ChatError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      code="500"
      title="Something went wrong"
      subtitle="An unexpected error occurred. You can try again or head back to your chats."
      digest={error.digest}
      actions={
        <>
          <Button size="lg" onClick={() => unstable_retry()}>
            Try again
          </Button>
          <Link href="/chat">
            <Button variant="outline" size="lg">
              Back to chat
            </Button>
          </Link>
        </>
      }
    />
  );
}

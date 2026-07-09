"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-console";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations("error.boundary");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      code="500"
      title={t("title")}
      subtitle={t("subtitle")}
      digest={error.digest}
      actions={
        <>
          <Button size="lg" onClick={() => unstable_retry()}>
            {t("retry")}
          </Button>
          <Link href="/">
            <Button variant="outline" size="lg">
              {t("home")}
            </Button>
          </Link>
        </>
      }
    />
  );
}

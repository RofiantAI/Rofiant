import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-console";
import { getDashboardLocale, getDashboardMessages } from "@/i18n/dashboard-locale";

export default async function ChatNotFound() {
  const locale = await getDashboardLocale();
  const { dashboard } = await getDashboardMessages(locale);
  const t = dashboard.chatNotFound;

  return (
    <ErrorState
      code=""
      title={t.title}
      subtitle={t.subtitle}
      actions={
        <Link href="/chat">
          <Button size="lg">{t.cta}</Button>
        </Link>
      }
    />
  );
}

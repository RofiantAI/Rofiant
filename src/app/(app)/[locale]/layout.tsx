import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { HeaderSection } from "@/components/sections/header-section";
import { FooterSection } from "@/components/sections/footer-section";
import { AnnouncementBanner } from "@/components/dashboard/announcement-banner";
import { createClient } from "@/lib/supabase/server";
import { getActiveSiteAnnouncements } from "@/lib/site-broadcast";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const supabase = await createClient();
  const announcements = await getActiveSiteAnnouncements(supabase);

  return (
    <NextIntlClientProvider>
      <AnnouncementBanner
        announcements={announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          variant: a.variant,
        }))}
      />
      <HeaderSection />
      {children}
      <FooterSection />
    </NextIntlClientProvider>
  );
}

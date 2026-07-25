import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "Pricing";
  const description =
    "Simple, honest pricing for Rofiant. Start free, upgrade when you're ready. No hidden fees.";
  return {
    title,
    description,
    openGraph: { title: `${title} — Rofiant`, description },
    alternates: localeAlternates(locale, "/pricing"),
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

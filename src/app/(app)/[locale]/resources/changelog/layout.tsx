import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: "Changelog",
  description: "Latest updates, new features, and improvements to the Rofiant platform.",
  openGraph: { title: "Changelog — Rofiant", description: "Latest updates, new features, and improvements to the Rofiant platform." },
  alternates: localeAlternates(locale, "/resources/changelog"),
  };
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

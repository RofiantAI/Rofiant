import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: "Terms of Service",
  description: "Rofiant's terms of service governing use of the platform.",
  openGraph: { title: "Terms of Service — Rofiant", description: "Rofiant's terms of service governing use of the platform." },
  alternates: localeAlternates(locale, "/legal/terms-of-service"),
  };
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

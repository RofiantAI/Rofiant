import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: "Privacy Policy",
  description: "Rofiant's privacy policy. How we collect, use, and protect your data.",
  openGraph: { title: "Privacy Policy — Rofiant", description: "Rofiant's privacy policy. How we collect, use, and protect your data." },
  alternates: localeAlternates(locale, "/legal/privacy-policy"),
  };
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

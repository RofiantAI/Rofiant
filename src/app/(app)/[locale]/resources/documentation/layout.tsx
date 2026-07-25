import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: "Documentation",
  description: "Rofiant developer documentation. Quick start guides, API reference, SDKs, and integration tutorials.",
  openGraph: { title: "Documentation — Rofiant", description: "Rofiant developer documentation. Quick start guides, API reference, SDKs, and integration tutorials." },
  alternates: localeAlternates(locale, "/resources/documentation"),
  };
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

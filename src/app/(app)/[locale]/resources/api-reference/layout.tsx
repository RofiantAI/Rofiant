import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: "API Reference",
  description: "Complete Rofiant API reference. Endpoints, parameters, authentication, rate limits, and response schemas.",
  openGraph: { title: "API Reference — Rofiant", description: "Complete Rofiant API reference. Endpoints, parameters, authentication, rate limits, and response schemas." },
  alternates: localeAlternates(locale, "/resources/api-reference"),
  };
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

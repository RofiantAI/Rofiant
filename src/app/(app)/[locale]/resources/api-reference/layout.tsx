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
  description: "Rofiant API reference: available endpoints, HTTP methods, and what each one does.",
  openGraph: { title: "API Reference — Rofiant", description: "Rofiant API reference: available endpoints, HTTP methods, and what each one does." },
  alternates: localeAlternates(locale, "/resources/api-reference"),
  };
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

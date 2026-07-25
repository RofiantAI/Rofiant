import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: "About",
  description: "Rofiant is an AI agent for your files and desktop, with optional cloud features for power users. Learn about our team and mission.",
  openGraph: { title: "About — Rofiant", description: "Rofiant is an AI agent for your files and desktop, with optional cloud features for power users. Learn about our team and mission." },
  alternates: localeAlternates(locale, "/company/about"),
  };
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

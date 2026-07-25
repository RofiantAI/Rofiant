import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: "Security",
  description: "Rofiant's security architecture: encryption in transit, permission gates, and cloud audit logging for Agents and API usage.",
  openGraph: { title: "Security — Rofiant", description: "Rofiant's security architecture: encryption in transit, permission gates, and cloud audit logging for Agents and API usage." },
  alternates: localeAlternates(locale, "/company/security"),
  };
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

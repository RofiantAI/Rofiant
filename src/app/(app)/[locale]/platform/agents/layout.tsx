import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: "Agents",
  description: "Build AI agents with multi-step reasoning, local tool use, and an approval gate before anything risky runs.",
  openGraph: { title: "Agents — Rofiant", description: "Build AI agents with multi-step reasoning, local tool use, and an approval gate before anything risky runs." },
  alternates: localeAlternates(locale, "/platform/agents"),
  };
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

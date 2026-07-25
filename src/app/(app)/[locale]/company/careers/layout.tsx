import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: "Careers",
  description:
    "Join Rofiant. We're hiring engineers, ML researchers, and operators building an AI agent for your desktop.",
  openGraph: {
    title: "Careers — Rofiant",
    description:
      "Join Rofiant. We're hiring engineers, ML researchers, and operators building an AI agent for your desktop.",
  },
  alternates: localeAlternates(locale, "/company/careers"),
  };
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

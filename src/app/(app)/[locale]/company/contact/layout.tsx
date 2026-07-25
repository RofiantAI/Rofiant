import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: "Contact",
  description: "Get in touch with Rofiant. Talk to sales, request a demo, or reach our support team.",
  openGraph: { title: "Contact — Rofiant", description: "Get in touch with Rofiant. Talk to sales, request a demo, or reach our support team." },
  alternates: localeAlternates(locale, "/company/contact"),
  };
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: "Chat AI",
  description: "Conversational AI for your files, with document search and permission gates.",
  openGraph: { title: "Chat AI — Rofiant", description: "Conversational AI for your files, with document search and permission gates." },
  alternates: localeAlternates(locale, "/platform/chat-ai"),
  };
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

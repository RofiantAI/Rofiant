import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: "Sign In",
  description: "Sign in to your Rofiant account.",
  openGraph: { title: "Sign In — Rofiant", description: "Sign in to your Rofiant account." },
  alternates: localeAlternates(locale, "/auth/login"),
  };
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

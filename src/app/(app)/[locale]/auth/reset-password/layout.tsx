import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: "Reset Password",
  description: "Choose a new password for your Rofiant account.",
  openGraph: { title: "Reset Password — Rofiant", description: "Choose a new password for your Rofiant account." },
  alternates: localeAlternates(locale, "/auth/reset-password"),
  };
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

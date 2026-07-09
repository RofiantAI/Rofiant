import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "SOC 2 Type II",
  description: "Rofiant's SOC 2 Type II compliance status, trust service criteria, and audit report access.",
  openGraph: { title: "SOC 2 Type II — Rofiant", description: "Rofiant's SOC 2 Type II compliance status, trust service criteria, and audit report access." },
  alternates: { canonical: "https://rofiant.ca/legal/soc2" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

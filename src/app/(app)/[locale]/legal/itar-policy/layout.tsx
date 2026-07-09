import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "ITAR Policy",
  description: "Rofiant's ITAR compliance policy for defense and controlled technology workloads.",
  openGraph: { title: "ITAR Policy — Rofiant", description: "Rofiant's ITAR compliance policy for defense and controlled technology workloads." },
  alternates: { canonical: "https://rofiant.ca/legal/itar-policy" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

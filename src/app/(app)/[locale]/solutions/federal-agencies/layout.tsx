import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Federal Agencies",
  description: "AI for federal agencies with FedRAMP-ready architecture, and compliance for mission-critical operations.",
  openGraph: { title: "Federal Agencies — Rofiant", description: "AI for federal agencies with FedRAMP-ready architecture, and compliance for mission-critical operations." },
  alternates: { canonical: "https://rofiant.ca/solutions/federal-agencies" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

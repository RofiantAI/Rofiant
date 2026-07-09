import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Pricing",
  description: "Agency and enterprise pricing for Rofiant. Pilot, Agency, and Enterprise plans with custom quotes. US-only data residency, FedRAMP-ready, air-gapped deployment available.",
  openGraph: { title: "Pricing — Rofiant", description: "Agency and enterprise pricing for Rofiant. Custom quotes for pilots, full agency deployments, and air-gapped enterprise programs." },
  alternates: { canonical: "https://rofiant.ca/solutions" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Compliance Guides",
  description: "FedRAMP, SOC 2, ITAR, GDPR, and CCPA compliance guides for using Rofiant in regulated environments.",
  openGraph: { title: "Compliance Guides — Rofiant", description: "FedRAMP, SOC 2, ITAR, GDPR, and CCPA compliance guides for using Rofiant in regulated environments." },
  alternates: { canonical: "https://rofiant.ca/resources/compliance-guides" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

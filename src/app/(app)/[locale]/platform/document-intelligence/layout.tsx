import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Document Intelligence",
  description: "Automated document extraction, classification, and analysis. Process PDFs, contracts, reports, and forms at scale.",
  openGraph: { title: "Document Intelligence — Rofiant", description: "Automated document extraction, classification, and analysis. Process PDFs, contracts, reports, and forms at scale." },
  alternates: { canonical: "https://rofiant.ca/platform/document-intelligence" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

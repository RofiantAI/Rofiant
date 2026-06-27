import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Documentation",
  description: "Rofiant developer documentation. Quick start guides, API reference, SDKs, and integration tutorials.",
  openGraph: { title: "Documentation — Rofiant", description: "Rofiant developer documentation. Quick start guides, API reference, SDKs, and integration tutorials." },
  alternates: { canonical: "https://rofiant.ca/resources/documentation" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "FedRAMP",
  description: "Rofiant's FedRAMP compliance documentation, authorization status, and security controls.",
  openGraph: { title: "FedRAMP — Rofiant", description: "Rofiant's FedRAMP compliance documentation, authorization status, and security controls." },
  alternates: { canonical: "https://rofiant.ca/legal/fedramp" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

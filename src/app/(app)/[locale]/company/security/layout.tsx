import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Security",
  description: "Rofiant's security architecture. Encryption, access control, audit logging, and compliance for sensitive workloads.",
  openGraph: { title: "Security — Rofiant", description: "Rofiant's security architecture. Encryption, access control, audit logging, and compliance for sensitive workloads." },
  alternates: { canonical: "https://www.rofiant.ca/company/security" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

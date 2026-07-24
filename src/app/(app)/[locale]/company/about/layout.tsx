import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "About",
  description: "Rofiant is built for organizations where AI must be secure, auditable, and mission-ready. Learn about our team and mission.",
  openGraph: { title: "About — Rofiant", description: "Rofiant is built for organizations where AI must be secure, auditable, and mission-ready. Learn about our team and mission." },
  alternates: { canonical: "https://www.rofiant.ca/company/about" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

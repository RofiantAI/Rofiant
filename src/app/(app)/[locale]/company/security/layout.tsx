import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Security",
  description: "Rofiant's security architecture: encryption in transit, permission gates, and cloud audit logging for Agents and API usage.",
  openGraph: { title: "Security — Rofiant", description: "Rofiant's security architecture: encryption in transit, permission gates, and cloud audit logging for Agents and API usage." },
  alternates: { canonical: "https://www.rofiant.ca/company/security" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

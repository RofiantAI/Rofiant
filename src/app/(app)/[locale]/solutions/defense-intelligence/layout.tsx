import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Defense Intelligence",
  description: "Air-gapped AI deployments for defense and intelligence. Secure document analysis, threat assessment, and classified data handling.",
  openGraph: { title: "Defense Intelligence — Rofiant", description: "Air-gapped AI deployments for defense and intelligence. Secure document analysis, threat assessment, and classified data handling." },
  alternates: { canonical: "https://rofiant.ca/solutions/defense-intelligence" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

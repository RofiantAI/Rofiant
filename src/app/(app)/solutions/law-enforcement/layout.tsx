import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Law Enforcement",
  description: "AI tools for law enforcement including case file analysis, transcript review, and evidence search with full audit trails.",
  openGraph: { title: "Law Enforcement — Rofiant", description: "AI tools for law enforcement including case file analysis, transcript review, and evidence search with full audit trails." },
  alternates: { canonical: "https://rofiant.ca/solutions/law-enforcement" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

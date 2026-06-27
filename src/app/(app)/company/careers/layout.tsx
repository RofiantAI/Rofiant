import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Careers",
  description: "Join Rofiant. We're hiring engineers, ML researchers, and operators building AI for government and enterprise.",
  openGraph: { title: "Careers — Rofiant", description: "Join Rofiant. We're hiring engineers, ML researchers, and operators building AI for government and enterprise." },
  alternates: { canonical: "https://rofiant.ca/company/careers" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join Rofiant. We're hiring engineers, ML researchers, and operators building an AI agent for your desktop.",
  openGraph: {
    title: "Careers — Rofiant",
    description:
      "Join Rofiant. We're hiring engineers, ML researchers, and operators building an AI agent for your desktop.",
  },
  alternates: { canonical: "https://www.rofiant.ca/company/careers" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

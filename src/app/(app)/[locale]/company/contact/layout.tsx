import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Rofiant. Talk to sales, request a demo, or reach our support team.",
  openGraph: { title: "Contact — Rofiant", description: "Get in touch with Rofiant. Talk to sales, request a demo, or reach our support team." },
  alternates: { canonical: "https://rofiant.ca/company/contact" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

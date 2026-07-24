import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Rofiant's terms of service governing use of the platform.",
  openGraph: { title: "Terms of Service — Rofiant", description: "Rofiant's terms of service governing use of the platform." },
  alternates: { canonical: "https://www.rofiant.ca/legal/terms-of-service" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

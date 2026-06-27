import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Rofiant's privacy policy. How we collect, use, and protect your data.",
  openGraph: { title: "Privacy Policy — Rofiant", description: "Rofiant's privacy policy. How we collect, use, and protect your data." },
  alternates: { canonical: "https://rofiant.ca/legal/privacy-policy" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

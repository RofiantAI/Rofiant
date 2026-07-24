import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "About",
  description: "Rofiant is an AI agent for your files and desktop, with optional cloud features for power users. Learn about our team and mission.",
  openGraph: { title: "About — Rofiant", description: "Rofiant is an AI agent for your files and desktop, with optional cloud features for power users. Learn about our team and mission." },
  alternates: { canonical: "https://www.rofiant.ca/company/about" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

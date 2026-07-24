import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Changelog",
  description: "Latest updates, new features, and improvements to the Rofiant platform.",
  openGraph: { title: "Changelog — Rofiant", description: "Latest updates, new features, and improvements to the Rofiant platform." },
  alternates: { canonical: "https://www.rofiant.ca/resources/changelog" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

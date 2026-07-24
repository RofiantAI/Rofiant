import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "API Reference",
  description: "Complete Rofiant API reference. Endpoints, parameters, authentication, rate limits, and response schemas.",
  openGraph: { title: "API Reference — Rofiant", description: "Complete Rofiant API reference. Endpoints, parameters, authentication, rate limits, and response schemas." },
  alternates: { canonical: "https://www.rofiant.ca/resources/api-reference" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

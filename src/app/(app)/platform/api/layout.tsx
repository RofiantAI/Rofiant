import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "API",
  description: "REST API and webhooks for integrating Rofiant AI into your existing systems. SDKs, authentication, and full API reference.",
  openGraph: { title: "API — Rofiant", description: "REST API and webhooks for integrating Rofiant AI into your existing systems. SDKs, authentication, and full API reference." },
  alternates: { canonical: "https://rofiant.ca/platform/api" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

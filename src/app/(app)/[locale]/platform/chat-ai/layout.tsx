import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Chat AI",
  description: "Conversational AI for your files, with document search, permission gates, and custom knowledge bases on Pro and Ultra.",
  openGraph: { title: "Chat AI — Rofiant", description: "Conversational AI for your files, with document search, permission gates, and custom knowledge bases on Pro and Ultra." },
  alternates: { canonical: "https://www.rofiant.ca/platform/chat-ai" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

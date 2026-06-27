import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Chat AI",
  description: "Conversational AI trained on your documents. Grounded answers with source citations, role-based access, and custom knowledge bases.",
  openGraph: { title: "Chat AI — Rofiant", description: "Conversational AI trained on your documents. Grounded answers with source citations, role-based access, and custom knowledge bases." },
  alternates: { canonical: "https://rofiant.ca/platform/chat-ai" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

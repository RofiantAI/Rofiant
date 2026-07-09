import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Agents",
  description: "Build AI workflow agents with multi-step reasoning, tool use, and approval gates. Automate complex tasks across your organization.",
  openGraph: { title: "Agents — Rofiant", description: "Build AI workflow agents with multi-step reasoning, tool use, and approval gates. Automate complex tasks across your organization." },
  alternates: { canonical: "https://rofiant.ca/platform/agents" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

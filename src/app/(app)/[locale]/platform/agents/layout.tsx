import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Agents",
  description: "Build AI agents with multi-step reasoning, local tool use, and an approval gate before anything risky runs.",
  openGraph: { title: "Agents — Rofiant", description: "Build AI agents with multi-step reasoning, local tool use, and an approval gate before anything risky runs." },
  alternates: { canonical: "https://www.rofiant.ca/platform/agents" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

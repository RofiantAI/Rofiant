import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Enterprise",
  description: "Enterprise AI platform with knowledge assistants, workflow automation, and deep integrations. SOC 2 Type II in progress.",
  openGraph: { title: "Enterprise — Rofiant", description: "Enterprise AI platform with knowledge assistants, workflow automation, and deep integrations. SOC 2 Type II in progress." },
  alternates: { canonical: "https://rofiant.ca/solutions/enterprise" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

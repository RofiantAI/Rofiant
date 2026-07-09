import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Agents, documents, voice, workflows, and security — standard AI tools on one platform.",
  openGraph: {
    title: "Tools — Rofiant",
    description:
      "Agents, documents, voice, workflows, and security — standard AI tools on one platform.",
  },
  alternates: { canonical: "https://rofiant.ca/services" },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

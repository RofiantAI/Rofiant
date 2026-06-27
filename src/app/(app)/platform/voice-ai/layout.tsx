import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Voice AI",
  description: "Real-time speech transcription, live meeting summaries, and voice-powered search built for enterprise and government workflows.",
  openGraph: { title: "Voice AI — Rofiant", description: "Real-time speech transcription, live meeting summaries, and voice-powered search built for enterprise and government workflows." },
  alternates: { canonical: "https://rofiant.ca/platform/voice-ai" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

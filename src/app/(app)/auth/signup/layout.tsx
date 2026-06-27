import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Rofiant account to get started with secure enterprise AI.",
  openGraph: { title: "Create Account — Rofiant", description: "Create a Rofiant account to get started with secure enterprise AI." },
  alternates: { canonical: "https://rofiant.ca/auth/signup" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

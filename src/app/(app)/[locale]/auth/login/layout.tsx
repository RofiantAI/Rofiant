import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Rofiant account.",
  openGraph: { title: "Sign In — Rofiant", description: "Sign in to your Rofiant account." },
  alternates: { canonical: "https://rofiant.ca/auth/login" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

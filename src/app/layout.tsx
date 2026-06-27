import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./(app)/globals.css";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { PostHogProvider } from "@/components/posthog-provider";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rofiant.ca"),
  title: {
    default: "Rofiant — AI for Government & Enterprise",
    template: "%s — Rofiant",
  },
  description:
    "Rofiant is the AI platform built for government agencies and enterprises. Secure, compliant, and ready for mission-critical workloads.",
  keywords: ["AI platform", "government AI", "enterprise AI", "secure AI", "FedRAMP", "ITAR", "document intelligence", "voice AI"],
  authors: [{ name: "Rofiant", url: "https://rofiant.ca" }],
  creator: "Rofiant",
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: "https://rofiant.ca",
    siteName: "Rofiant",
    title: "Rofiant — AI for Government & Enterprise",
    description:
      "Rofiant is the AI platform built for government agencies and enterprises. Secure, compliant, and ready for mission-critical workloads.",
    images: [{ url: "/hero.png", width: 1200, height: 630, alt: "Rofiant" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rofiant — AI for Government & Enterprise",
    description:
      "Rofiant is the AI platform built for government agencies and enterprises. Secure, compliant, and ready for mission-critical workloads.",
    images: ["/hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://rofiant.ca",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Rofiant",
    url: "https://rofiant.ca",
    logo: "https://rofiant.ca/logo.svg",
    description: "AI platform built for government agencies and enterprises. Secure, compliant, and ready for mission-critical workloads.",
    sameAs: [],
  };

  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <PostHogProvider>
          {children}
        </PostHogProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
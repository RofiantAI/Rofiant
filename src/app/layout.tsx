import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { getLocale } from "next-intl/server";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./(app)/globals.css";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { OfflineToast } from "@/components/ui/offline-toast";
import { UpdateToast } from "@/components/ui/update-toast";
import { PostHogProvider } from "@/components/posthog-provider";
import { MinorDataGuard } from "@/components/minor-data-guard";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site-metadata";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.rofiant.ca"),
  title: {
    default: SITE_TITLE,
    template: "%s | Rofiant",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "AI desktop agent",
    "AI file assistant",
    "document intelligence",
    "AI automation",
    "secure AI",
  ],
  authors: [{ name: "Rofiant", url: "https://www.rofiant.ca" }],
  creator: "Rofiant",
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: "https://www.rofiant.ca",
    siteName: "Rofiant",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/hero.png", width: 1200, height: 630, alt: "Rofiant" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://www.rofiant.ca",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale().catch(() => "en");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Rofiant",
    url: "https://www.rofiant.ca",
    logo: "https://www.rofiant.ca/logo.svg",
    description: SITE_DESCRIPTION,
    sameAs: [],
  };

  return (
    <html
      lang={locale}
      className={`${geist.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            <MinorDataGuard />
            {children}
          </PostHogProvider>
          <CookieBanner />
          <OfflineToast />
          <UpdateToast />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { HeroSection } from "@/components/sections/hero-section";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site-metadata";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: { absolute: SITE_TITLE },
    description: SITE_DESCRIPTION,
    alternates: localeAlternates(locale),
    openGraph: {
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
    twitter: {
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
  };
}
import { DmcAdSection } from "@/components/sections/dmc-ad-section";
import { UnifySection } from "@/components/sections/unify-section";
import { DeploySection } from "@/components/sections/deploy-section";
import { ProtectSection } from "@/components/sections/protect-section";
import { DeveloperSection } from "@/components/sections/developer-section";
import { PublicAISection } from "@/components/sections/public-ai-section";
import { FooterCtaSection } from "@/components/sections/footer-cta-section";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export default function Home() {
  return (
    <>
      <HeroSection />
      <DmcAdSection />
      <ScrollReveal>
        <UnifySection />
      </ScrollReveal>
      <ScrollReveal>
        <DeploySection />
      </ScrollReveal>
      <ScrollReveal>
        <ProtectSection />
      </ScrollReveal>
      <ScrollReveal>
        <DeveloperSection />
      </ScrollReveal>
      <ScrollReveal>
        <PublicAISection />
      </ScrollReveal>
      <ScrollReveal>
        <FooterCtaSection />
      </ScrollReveal>
    </>
  );
}

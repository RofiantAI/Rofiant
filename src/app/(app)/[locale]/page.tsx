import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/sections/hero-section";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "https://rofiant.ca" },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};
import { UnifySection } from "@/components/sections/unify-section";
import { DeploySection } from "@/components/sections/deploy-section";
import { ProtectSection } from "@/components/sections/protect-section";
import { DeveloperSection } from "@/components/sections/developer-section";
import { PublicAISection } from "@/components/sections/public-ai-section";
import { FooterCtaSection } from "@/components/sections/footer-cta-section";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/chat");

  return (
    <>
      <HeroSection />
      <ScrollReveal>
        <PublicAISection />
      </ScrollReveal>
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
        <FooterCtaSection />
      </ScrollReveal>
    </>
  );
}

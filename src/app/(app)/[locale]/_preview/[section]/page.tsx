"use client";

import { useParams } from "next/navigation";
import { HeaderSection } from "@/components/sections/header-section";
import { HeroSection } from "@/components/sections/hero-section";
import { HeroSectionCursor } from "@/components/sections/hero-section-cursor";
import { StatsSection } from "@/components/sections/stats-section";
import { LogoCloudSection } from "@/components/sections/logo-cloud-section";
import { UnifySection } from "@/components/sections/unify-section";
import { DeploySection } from "@/components/sections/deploy-section";
import { ProtectSection } from "@/components/sections/protect-section";
import { DeveloperSection } from "@/components/sections/developer-section";
import { FooterCtaSection } from "@/components/sections/footer-cta-section";
import { FooterSection } from "@/components/sections/footer-section";

const sections: Record<string, React.ComponentType> = {
  header: HeaderSection,
  hero: HeroSection,
  "hero-cursor": HeroSectionCursor,
  stats: StatsSection,
  "logo-cloud": LogoCloudSection,
  unify: UnifySection,
  deploy: DeploySection,
  protect: ProtectSection,
  developer: DeveloperSection,
  "footer-cta": FooterCtaSection,
  footer: FooterSection,
};

export default function PreviewPage() {
  const params = useParams();
  const section = params.section as string;
  const SectionComponent = sections[section];

  if (!SectionComponent) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-normal">Section not found</h1>
          <p className="mt-2 text-foreground-secondary">
            Available sections: {Object.keys(sections).join(", ")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SectionComponent />
    </div>
  );
}

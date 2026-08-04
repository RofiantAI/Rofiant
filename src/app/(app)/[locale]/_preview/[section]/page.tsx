"use client";

import { useParams } from "next/navigation";
import { HeaderSection } from "@/components/sections/header-section";
import { HeroSection } from "@/components/sections/hero-section";
import { UnifySection } from "@/components/sections/unify-section";
import { DeploySection } from "@/components/sections/deploy-section";
import { ProtectSection } from "@/components/sections/protect-section";
import { FooterCtaSection } from "@/components/sections/footer-cta-section";
import { FooterSection } from "@/components/sections/footer-section";

const sections: Record<string, React.ComponentType> = {
  header: HeaderSection,
  hero: HeroSection,
  unify: UnifySection,
  deploy: DeploySection,
  protect: ProtectSection,
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

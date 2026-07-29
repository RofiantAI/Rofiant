import type { Metadata } from "next";
import Image from "next/image";
import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "DMC — Partner Spotlight";
  const description =
    "DMC is a unified API gateway for a vast range of AI models — one standard protocol to power AI apps and manage digital assets.";
  return {
    title,
    description,
    openGraph: { title, description },
    alternates: localeAlternates(locale, "/dmc"),
  };
}

const areas = [
  {
    title: "Vast model access",
    desc: "One standard, unified API protocol to reach a wide range of AI models.",
  },
  {
    title: "Power AI apps",
    desc: "Build and run AI-powered applications on a single consistent gateway.",
  },
  {
    title: "Digital assets",
    desc: "Manage digital assets and connect to the future of AI infrastructure.",
  },
];

export default function DmcPage() {
  return (
    <PageLayout
      badge="Partner spotlight"
      badgeVariant="info"
      title="One API. Every model."
      subtitle="DMC is a unified API gateway for a vast range of AI models. Access a vast selection of models via a standard, unified API protocol — power AI applications, manage digital assets, and connect the future."
      hero={
        <Card variant="bordered" className="p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 shrink-0 overflow-hidden rounded-lg border border-border bg-background-tertiary">
                <Image
                  src="/dmc.jpg"
                  alt="DMC logo"
                  width={640}
                  height={640}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">DMC</p>
                <p className="text-sm text-foreground-secondary">dmc.cc</p>
              </div>
            </div>
            <a href="https://dmc.cc" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="whitespace-nowrap">
                Visit dmc.cc
              </Button>
            </a>
          </div>
        </Card>
      }
    >
      <PageSection>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {areas.map((a) => (
            <Card key={a.title} variant="bordered" className="p-6">
              <h3 className="font-semibold text-foreground">{a.title}</h3>
              <p className="mt-2 text-sm text-foreground-secondary">{a.desc}</p>
            </Card>
          ))}
        </div>
      </PageSection>
    </PageLayout>
  );
}

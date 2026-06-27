"use client";

import { PageLayout } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Target, Code, Eye, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function AboutPage() {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  const values = [
    {
      icon: Target,
      title: "Mission-first",
      desc: "We build for the work that matters. Security and reliability are not optional.",
      color: "text-accent-primary",
    },
    {
      icon: Code,
      title: "Developer-first",
      desc: "Simple APIs, clear docs, SDKs that just work. We obsess over developer experience.",
      color: "text-accent-secondary",
    },
    {
      icon: Eye,
      title: "Transparent",
      desc: "Open pricing, clear SLAs, and honest communication. No surprises.",
      color: "text-accent-success",
    },
  ];

  return (
    <PageLayout
      badge="COMPANY"
      title="About Rofiant"
      subtitle="We build AI that works for the teams that need it most."
    >
      <div className="space-y-8 text-foreground-secondary leading-relaxed">
        <p className="text-lg">
          Rofiant was founded on a simple idea: AI should be accessible, secure, and
          ready for real work. Not just demos and prototypes — production-grade
          systems that teams can rely on every day.
        </p>
        <p>
          We build for organizations that take security seriously. Government
          agencies, enterprises, and teams that need AI they can deploy in their
          own environment, with full control over their data.
        </p>
        <p>
          Our platform unifies chat, voice, document intelligence, and workflow
          agents into a single, auditable system. One API. One control plane. One
          compliance story.
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 pt-8">
          {values.map((v, index) => {
            const Icon = v.icon;
            const isHovered = hoveredValue === index;

            return (
              <div
                key={v.title}
                className="group"
                onMouseEnter={() => setHoveredValue(index)}
                onMouseLeave={() => setHoveredValue(null)}
              >
                <Card
                  variant="bordered"
                  className={`p-6 h-full transition-all duration-300 ${
                    isHovered ? "border-border-light shadow-lg -translate-y-1" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 text-foreground-muted transition-all duration-300 ${
                        isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                      }`}
                    />
                  </div>
                  <h3 className="font-semibold text-foreground">{v.title}</h3>
                  <p className="mt-2 text-sm text-foreground-secondary">{v.desc}</p>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}

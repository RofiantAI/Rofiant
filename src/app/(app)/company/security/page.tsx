"use client";

import { PageLayout } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Lock, Key, FileText, Server, Globe, Bell, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function SecurityPage() {
  const [hoveredArea, setHoveredArea] = useState<number | null>(null);

  const areas = [
    { 
      icon: Lock, 
      title: "Encryption", 
      desc: "All data encrypted at rest (AES-256) and in transit (TLS 1.3). Customer-managed keys available.",
      color: "text-accent-primary",
    },
    { 
      icon: Key, 
      title: "Access control", 
      desc: "SAML SSO, OAuth 2.0, and API key authentication. Granular role-based access control.",
      color: "text-accent-secondary",
    },
    { 
      icon: FileText, 
      title: "Audit logging", 
      desc: "Every API call, every user action, every admin change — logged immutably and exportable.",
      color: "text-accent-success",
    },
    { 
      icon: Server, 
      title: "Infrastructure", 
      desc: "Hosted on SOC 2 compliant infrastructure. Regular penetration testing and vulnerability scanning.",
      color: "text-accent-warning",
    },
    { 
      icon: Globe, 
      title: "Data residency", 
      desc: "Choose where your data lives. US or EU cloud regions, with GovCloud available for agencies.",
      color: "text-accent-orange",
    },
    { 
      icon: Bell, 
      title: "Incident response", 
      desc: "24/7 monitoring with defined SLAs for detection, response, and customer notification.",
      color: "text-red-400",
    },
  ];

  return (
    <PageLayout
      badge="COMPANY"
      title="Security"
      subtitle="Security is foundational to everything we build, not an afterthought."
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {areas.map((a, index) => {
          const Icon = a.icon;
          const isHovered = hoveredArea === index;

          return (
            <div
              key={a.title}
              className="group"
              onMouseEnter={() => setHoveredArea(index)}
              onMouseLeave={() => setHoveredArea(null)}
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
                <h3 className="font-semibold text-foreground">{a.title}</h3>
                <p className="mt-2 text-sm text-foreground-secondary">{a.desc}</p>
              </Card>
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
}

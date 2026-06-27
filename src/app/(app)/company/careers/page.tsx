"use client";

import { PageLayout } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, ArrowRight, Briefcase } from "lucide-react";
import { useState } from "react";

export default function CareersPage() {
  const [hoveredRole, setHoveredRole] = useState<number | null>(null);

  const roles = [
    { title: "Senior Backend Engineer", team: "Platform", location: "Remote", type: "Full-time" },
    { title: "ML Engineer", team: "AI", location: "Remote", type: "Full-time" },
    { title: "Frontend Engineer", team: "Product", location: "Remote", type: "Full-time" },
    { title: "Security Engineer", team: "Security", location: "Remote", type: "Full-time" },
    { title: "Solutions Engineer", team: "Sales", location: "Washington, DC", type: "Full-time" },
  ];

  return (
    <PageLayout
      badge="COMPANY"
      title="Careers"
      subtitle="Help us build AI that works for the teams that need it most."
    >
      <p className="text-foreground-secondary mb-8 text-lg">
        We are a remote-first team building the future of secure, compliant AI. If you
        care about developer experience, security, and building tools that matter —
        we want to hear from you.
      </p>
      <div className="space-y-3">
        {roles.map((r, index) => {
          const isHovered = hoveredRole === index;

          return (
            <div
              key={r.title}
              className="group"
              onMouseEnter={() => setHoveredRole(index)}
              onMouseLeave={() => setHoveredRole(null)}
            >
              <Card
                variant="bordered"
                className={`p-5 flex items-center justify-between transition-all duration-300 cursor-pointer ${
                  isHovered ? "border-border-light shadow-lg -translate-y-1" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-accent-primary transition-colors">
                      {r.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-sm text-foreground-muted">
                        <Users className="w-3 h-3" />
                        {r.team}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-foreground-muted">
                        <MapPin className="w-3 h-3" />
                        {r.location}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">{r.type}</Badge>
                  <ArrowRight
                    className={`w-4 h-4 text-foreground-muted transition-all duration-300 ${
                      isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                    }`}
                  />
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
}

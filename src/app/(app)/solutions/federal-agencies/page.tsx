"use client";

import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Server, ShieldCheck, KeyRound, ClipboardList, ArrowRight, CheckCircle,
  Lock, FileText, Radio, Building2, Globe, Clock, Users, AlertTriangle, ChevronRight
} from "lucide-react";
import { useState } from "react";

export default function FederalAgenciesPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: ShieldCheck,
      title: "Compliance-ready",
      desc: "Built to support SOC 2, FedRAMP, and other compliance frameworks. Documentation and evidence packages available.",
      color: "text-accent-success",
      details: [
        "FedRAMP authorization in progress",
        "NIST 800-53 control mappings available",
        "FISMA-ready documentation and evidence",
        "Continuous compliance monitoring and reporting",
      ],
    },
    {
      icon: KeyRound,
      title: "Identity integration",
      desc: "Connect to your existing identity provider. SAML SSO, OAuth, and role-based access control.",
      color: "text-accent-secondary",
      details: [
        "SAML 2.0, OAuth 2.0, OIDC, and CAC/PIV card support",
        "Granular role-based access at document and feature level",
        "Auto-provisioning via SCIM",
        "Session management with agency timeout policies",
      ],
    },
    {
      icon: ClipboardList,
      title: "Procurement",
      desc: "Available through standard government procurement vehicles. Flexible licensing for agencies of any size.",
      color: "text-accent-warning",
      details: [
        "GSA Schedule (in progress)",
        "SEWP and NETCENTS vehicle eligible",
        "Flexible licensing: per-user, per-transaction, or unlimited",
        "Sole-source justification support",
      ],
    },
  ];

  const useCases = [
    {
      dept: "Policy & Legal",
      icon: FileText,
      items: [
        "Search across regulations, case law, and agency policies with source citations",
        "Draft policy language with AI assistance, reviewed by legal before publish",
        "Track regulatory changes and auto-flag impacts to existing policies",
        "Freedom of Information Act (FOIA) request processing and redaction support",
      ],
    },
    {
      dept: "Field Operations",
      icon: Radio,
      items: [
        "Real-time voice transcription for meetings and communications",
        "Auto-generate incident reports from notes, body cam transcripts, and CAD data",
        "Query operational procedures and safety protocols hands-free in the field",
        "Multi-language translation for international operations and border security",
      ],
    },
    {
      dept: "Acquisition & Contracts",
      icon: ClipboardList,
      items: [
        "Analyze RFPs and contracts against clause libraries and compliance checklists",
        "Auto-generate contract amendments and modifications from change requests",
        "Track contract milestones, deliverables, and payment schedules",
        "Search across procurement history for similar awards and pricing benchmarks",
      ],
    },
    {
      dept: "IT & Cybersecurity",
      icon: Lock,
      items: [
        "Automated log analysis and anomaly detection across agency systems",
        "Generate incident response playbooks from NIST 800-61 guidelines",
        "Search across IT policies, network diagrams, and system documentation",
        "AI-assisted vulnerability assessment reporting and remediation tracking",
      ],
    },
  ];

  const complianceFrameworks = [
    "FedRAMP (in progress)",
    "NIST 800-53",
    "FISMA",
    "FIPS 140-2",
    "CJIS Security Policy",
    "ITAR / EAR",
    "Section 508 Accessibility",
  ];

  return (
    <PageLayout
      badge="SOLUTIONS"
      badgeVariant="success"
      title="AI for Federal Agencies"
      subtitle="Secure, compliant AI built for the unique needs of federal government. Deploy on your infrastructure or ours with full audit trails and agency-grade security controls."
      hero={
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: "GovCloud", label: "Deployment", sub: "AWS/Azure" },
            { value: "SOC 2", label: "Compliance", sub: "Type II in progress" },
            { value: "US-only", label: "Data residency", sub: "No offshore" },
            { value: "24/7", label: "Support", sub: "Dedicated team" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border  p-5 text-center">
              <div className="text-xl font-normal text-foreground">{stat.value}</div>
              <div className="text-sm text-foreground mt-1">{stat.label}</div>
              <div className="text-xs text-foreground-muted">{stat.sub}</div>
            </div>
          ))}
        </div>
      }
    >
      {/* Mission statement */}
      <div className="bg-card border border-border  p-8">
        <h3 className="text-xl font-semibold text-foreground mb-4">Built for the mission</h3>
        <p className="text-foreground-secondary leading-relaxed mb-4">
          Federal agencies face unique challenges: strict compliance requirements, classified environments, legacy systems,
          and the need for absolute data sovereignty. Rofiant is built from the ground up to operate in these environments.
        </p>
        <p className="text-foreground-secondary leading-relaxed">
          Whether you need AI for policy research, field operations, acquisition, or cybersecurity — Rofiant deploys
          securely in your environment with full audit trails, agency identity integration, and compliance documentation
          ready for your ATO process.
        </p>
      </div>

      {/* Use cases */}
      <PageSection title="By department" subtitle="AI tailored for agency missions.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {useCases.map((u) => {
            const Icon = u.icon;
            return (
              <Card key={u.dept} variant="bordered" className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-foreground">{u.dept}</h3>
                </div>
                <ul className="space-y-3">
                  {u.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground-secondary">
                      <CheckCircle className="w-4 h-4 text-accent-success shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </PageSection>

      {/* Features */}
      <PageSection title="Platform capabilities" subtitle="Everything agencies need, nothing they do not.">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-8">
          {features.map((f, index) => {
            const Icon = f.icon;
            const isHovered = hoveredFeature === index;

            return (
              <div
                key={f.title}
                className="group"
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <Card
                  variant="bordered"
                  className={`p-6 h-full transition-all duration-300 ${isHovered ? "border-border-light shadow-lg -translate-y-1" : ""}`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{f.title}</h3>
                      <p className="mt-1 text-sm text-foreground-secondary">{f.desc}</p>
                    </div>
                  </div>
                  <ul className="space-y-2 ml-14">
                    {f.details.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground-muted">
                        <ChevronRight className="w-3 h-3 text-foreground-muted/50 shrink-0 mt-1" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            );
          })}
        </div>
      </PageSection>

      {/* Compliance */}
      <PageSection title="Compliance frameworks" subtitle="Aligned with federal standards.">
        <div className="flex flex-wrap gap-3 mt-8">
          {complianceFrameworks.map((fw) => (
            <Badge key={fw} variant="success" className="px-4 py-2 text-sm">
              {fw}
            </Badge>
          ))}
        </div>
      </PageSection>

      {/* Security */}
      <PageSection title="Security & data sovereignty" subtitle="Your data never leaves your control.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          {[
            "All data stays within US borders",
            "AES-256 encryption at rest, TLS 1.3 in transit",
            "Customer-managed encryption keys (BYOK)",
            "Immutable audit logs with tamper detection",
            "Role-based access with CAC/PIV support",
            "Air-gapped deployment with no internet required",
            "FedRAMP Moderate authorization (in progress)",
            "Continuous vulnerability scanning and pen testing",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 p-4  bg-background-tertiary">
              <CheckCircle className="w-4 h-4 text-accent-success shrink-0" />
              <span className="text-sm text-foreground-secondary">{item}</span>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Deployment */}
      <PageSection title="Deployment options" subtitle="Run where your mission requires.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {[
            { name: "Cloud (GovCloud)", desc: "AWS GovCloud or Azure Government. We manage infrastructure, you manage data.", icon: Server },
            { name: "On-premises", desc: "Run in your data center or classified facility. Full control, full isolation.", icon: Building2 },
            { name: "Air-gapped", desc: "No internet connection required. Standalone deployment with manual update capability.", icon: Lock },
          ].map((d) => {
            const Icon = d.icon;
            return (
              <Card key={d.name} variant="bordered" className="p-6">
                <Icon className="w-6 h-6 text-foreground-muted mb-3" />
                <h3 className="font-semibold text-foreground">{d.name}</h3>
                <p className="mt-1 text-sm text-foreground-secondary">{d.desc}</p>
              </Card>
            );
          })}
        </div>
      </PageSection>

      {/* CTA */}
      <div className="mt-20 p-8  bg-card border border-border text-center">
        <h3 className="text-2xl font-semibold text-foreground mb-2">Ready to bring AI to your agency?</h3>
        <p className="text-foreground-secondary mb-6">Our government team will walk you through security, compliance, and deployment options.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="group">
            Talk to our government team
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button variant="outline" size="lg">Request compliance docs</Button>
        </div>
        <p className="mt-4 text-xs text-foreground-muted">FedRAMP package and NIST mappings available under NDA.</p>
      </div>
    </PageLayout>
  );
}

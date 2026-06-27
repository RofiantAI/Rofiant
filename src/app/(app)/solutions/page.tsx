"use client";

import { PageLayout } from "@/components/page-layout";
import { CheckCircle, ArrowRight, Shield, Building2, Lock } from "lucide-react";

const tiers = [
  {
    name: "Pilot",
    icon: Shield,
    tagline: "Evaluate Rofiant in your environment",
    description: "A time-limited deployment for agencies assessing AI capabilities before full procurement.",
    features: [
      "Up to 25 users",
      "Cloud-hosted (US region)",
      "3 knowledge bases",
      "Chat AI + Document Intelligence",
      "Standard SSO (SAML / OIDC)",
      "Email support",
      "30- or 90-day term",
    ],
    cta: "Request a pilot",
    highlighted: false,
  },
  {
    name: "Agency",
    icon: Building2,
    tagline: "Full deployment for a single agency",
    description: "Production-ready deployment with GovCloud hosting, compliance documentation, and a dedicated onboarding team.",
    features: [
      "Unlimited users",
      "AWS GovCloud or Azure Government",
      "Unlimited knowledge bases",
      "Full platform — Chat AI, Voice AI, Agents, Document Intelligence, API",
      "CAC / PIV + SCIM provisioning",
      "FedRAMP and NIST 800-53 documentation",
      "Dedicated customer success manager",
      "SLA: 99.9% uptime",
    ],
    cta: "Talk to sales",
    highlighted: true,
  },
  {
    name: "Enterprise",
    icon: Lock,
    tagline: "Multi-department or air-gapped deployment",
    description: "For classified environments, multi-agency programs, or organizations that require complete infrastructure ownership.",
    features: [
      "Everything in Agency",
      "On-premises or air-gapped deployment",
      "Customer-managed encryption keys (BYOK)",
      "Custom contract and procurement vehicle (GSA, SEWP)",
      "Dedicated infrastructure — no shared tenancy",
      "24/7 dedicated support team",
      "Custom SLA",
      "White-glove onboarding and training",
    ],
    cta: "Contact us",
    highlighted: false,
  },
];

const faqs = [
  {
    q: "Is Rofiant FedRAMP authorized?",
    a: "FedRAMP Moderate authorization is in progress. NIST 800-53 control mappings and a FedRAMP package are available under NDA for agencies running their own ATO process.",
  },
  {
    q: "What procurement vehicles are available?",
    a: "Rofiant is available through GSA Schedule (in progress), SEWP, and direct contract. Sole-source justification support is available for agencies on tight timelines.",
  },
  {
    q: "How does data residency work?",
    a: "All data stays within US borders. Agency and Enterprise tiers run in GovCloud regions. No data is ever processed offshore.",
  },
  {
    q: "How is Rofiant priced?",
    a: "Pricing is custom based on deployment type, user count, and contract term. We work within your agency's budget cycle and can structure annual or multi-year agreements.",
  },
];

export default function PricingPage() {
  return (
    <PageLayout
      badge="PRICING"
      title="Plans for every agency"
      subtitle="All plans include US-only data residency, full audit trails, and agency-grade security. Pricing is custom — contact us for a quote."
    >
      {/* Tiers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-4">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <div
              key={tier.name}
              className={`flex flex-col border p-8 ${
                tier.highlighted
                  ? "border-foreground bg-card"
                  : "border-border bg-card"
              }`}
            >
              {tier.highlighted && (
                <div className="text-xs font-medium uppercase tracking-widest text-foreground mb-6 pb-4 border-b border-border">
                  Most common
                </div>
              )}
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5 text-foreground-muted" />
                <h2 className="text-xl font-normal text-foreground">{tier.name}</h2>
              </div>
              <p className="text-sm font-medium text-foreground mb-2">{tier.tagline}</p>
              <p className="text-sm text-foreground-secondary mb-8">{tier.description}</p>

              <div className="text-sm font-medium text-foreground-muted uppercase tracking-wider mb-4">
                Custom pricing
              </div>

              <ul className="space-y-3 mb-10 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground-secondary">
                    <CheckCircle className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="/company/contact"
                className={`inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-medium transition-colors ${
                  tier.highlighted
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "border border-border text-foreground hover:bg-background-tertiary"
                }`}
              >
                {tier.cta}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          );
        })}
      </div>

      {/* Baseline inclusions */}
      <div className="mt-16 border border-border p-8">
        <h2 className="text-sm font-medium text-foreground-muted uppercase tracking-wider mb-6">
          Included in every plan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            "US-only data residency",
            "AES-256 encryption at rest",
            "TLS 1.3 in transit",
            "Immutable audit logs",
            "Role-based access control",
            "SOC 2 Type II report available",
            "99.9% uptime SLA",
            "Quarterly security reviews",
            "No data used for model training",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-foreground-secondary">
              <CheckCircle className="w-4 h-4 text-foreground shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-20">
        <h2 className="text-2xl font-normal text-foreground mb-8">Common questions</h2>
        <div className="divide-y divide-border border border-border">
          {faqs.map((faq) => (
            <div key={faq.q} className="p-6">
              <h3 className="text-sm font-medium text-foreground mb-2">{faq.q}</h3>
              <p className="text-sm text-foreground-secondary">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-20 border border-border p-10 text-center">
        <h2 className="text-2xl font-normal text-foreground mb-3">Ready to get started?</h2>
        <p className="text-foreground-secondary mb-8 max-w-xl mx-auto">
          Our government team will walk you through deployment options, compliance documentation, and procurement.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/company/contact"
            className="inline-flex items-center gap-2 h-11 px-6 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            Talk to sales
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="/resources/documentation"
            className="inline-flex items-center gap-2 h-11 px-6 text-sm font-medium border border-border text-foreground hover:bg-background-tertiary transition-colors"
          >
            Read the docs
          </a>
        </div>
      </div>
    </PageLayout>
  );
}

"use client";

import { PageLayout } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Zap, Users, Sparkles, Shield, Building2, Lock } from "lucide-react";
import { useState } from "react";

const consumerTiers = [
  {
    name: "Free",
    icon: Sparkles,
    tagline: "Start using AI today",
    description: "Everything you need to get started. No credit card required.",
    price: { monthly: 0, annual: 0 },
    cta: "Get started free",
    href: "/auth/signup",
    highlighted: false,
    features: [
      "100 messages per day",
      "Chat with AI",
      "Write & edit documents",
      "Code assistance",
      "Standard response speed",
      "Web access",
    ],
  },
  {
    name: "Pro",
    icon: Zap,
    tagline: "For power users",
    description: "Unlimited AI with file uploads, voice, and document analysis.",
    price: { monthly: 15, annual: 12 },
    cta: "Start Pro",
    href: "/api/checkout?plan=pro",
    highlighted: true,
    features: [
      "Unlimited messages",
      "Everything in Free",
      "File & image uploads",
      "Document intelligence",
      "Voice AI (transcription & summaries)",
      "Priority response speed",
      "Conversation history (unlimited)",
      "Early access to new features",
    ],
  },
  {
    name: "Team",
    icon: Users,
    tagline: "For small teams",
    description: "Shared workspace, admin controls, and usage insights for your whole team.",
    price: { monthly: 25, annual: 20 },
    cta: "Start Team trial",
    href: "/api/checkout?plan=team",
    highlighted: false,
    perUser: true,
    features: [
      "Everything in Pro",
      "Shared team workspace",
      "Centralized billing",
      "Admin dashboard",
      "Usage analytics per user",
      "SSO (SAML / Google)",
      "Priority support",
      "5-seat minimum",
    ],
  },
];

const govTiers = [
  {
    name: "Pilot",
    icon: Zap,
    tagline: "Evaluate Rofiant in your environment",
    description: "A time-limited deployment for agencies assessing AI capabilities before full procurement.",
    badge: null,
    cta: "Request a pilot",
    href: "/company/contact?subject=pilot",
    highlighted: false,
    features: [
      "Up to 25 users",
      "Cloud-hosted (US region)",
      "3 knowledge bases",
      "Chat AI + Document Intelligence",
      "Standard SSO (SAML / OIDC)",
      "Email support",
      "30- or 90-day term",
    ],
  },
  {
    name: "Agency",
    icon: Building2,
    tagline: "Full deployment for a single agency",
    description: "Production-ready deployment with GovCloud hosting, compliance documentation, and a dedicated onboarding team.",
    badge: "Most common",
    cta: "Talk to sales",
    href: "/company/contact?subject=agency",
    highlighted: true,
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
  },
  {
    name: "Enterprise",
    icon: Lock,
    tagline: "Multi-department or air-gapped deployment",
    description: "For classified environments, multi-agency programs, or organizations that require complete infrastructure ownership.",
    badge: null,
    cta: "Talk to sales",
    href: "/company/contact?subject=enterprise",
    highlighted: false,
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
  },
];

const faqs = [
  {
    q: "Is the free plan really free?",
    a: "Yes. The Free plan has no credit card requirement and no trial period — it stays free as long as you use it. You get 100 messages per day, which is plenty for everyday use.",
  },
  {
    q: "What counts as a message?",
    a: "Each time you send a prompt and receive a response, that counts as one message. File uploads and voice sessions each count as one message per use.",
  },
  {
    q: "Can I switch plans at any time?",
    a: "Yes. You can upgrade, downgrade, or cancel at any time from your account settings. Downgrades take effect at the end of your current billing period.",
  },
  {
    q: "What's the difference between monthly and annual billing?",
    a: "Annual billing saves you roughly 20% compared to monthly. You're billed once per year upfront.",
  },
  {
    q: "Is my data used to train your models?",
    a: "No. Your conversations are never used to train AI models. See our Privacy Policy for full details.",
  },
  {
    q: "How does government procurement work?",
    a: "We support GSA Schedule, SEWP V, and direct procurement. Contact our sales team to discuss your vehicle and timeline.",
  },
  {
    q: "Do you offer discounts for students or nonprofits?",
    a: "Yes. Contact us at pricing@rofiant.ca with verification and we'll sort you out.",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <PageLayout
      badge="PRICING"
      title="Simple, honest pricing"
      subtitle="Start free. Upgrade when you're ready. No hidden fees."
    >
      {/* Billing toggle */}
      <div className="flex items-center gap-4 mt-2">
        <span className={`text-sm font-medium ${!annual ? "text-foreground" : "text-foreground-muted"}`}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            annual ? "bg-accent-primary" : "bg-background-tertiary border border-border"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              annual ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${annual ? "text-foreground" : "text-foreground-muted"}`}>
          Annual
        </span>
        {annual && (
          <Badge variant="success" className="text-xs">
            Save ~20%
          </Badge>
        )}
      </div>

      {/* Consumer tiers */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {consumerTiers.map((tier) => {
          const Icon = tier.icon;
          const price = annual ? tier.price.annual : tier.price.monthly;
          return (
            <div
              key={tier.name}
              className={`flex flex-col p-8 border transition-all duration-200 ${
                tier.highlighted
                  ? "border-foreground bg-card shadow-lg"
                  : "border-border bg-card hover:border-border-light"
              }`}
            >
              {tier.highlighted && (
                <div className="text-xs font-medium uppercase tracking-widest text-foreground mb-6 pb-4 border-b border-border">
                  Most popular
                </div>
              )}
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5 text-foreground-muted" />
                <h2 className="text-xl font-normal text-foreground">{tier.name}</h2>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">{tier.tagline}</p>
              <p className="text-sm text-foreground-secondary mb-6">{tier.description}</p>
              <div className="mb-8">
                {price === 0 ? (
                  <div className="text-4xl font-normal text-foreground">Free</div>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-normal text-foreground">${price}</span>
                    <span className="text-sm text-foreground-muted mb-1.5">
                      / mo{tier.perUser ? " / user" : ""}
                    </span>
                  </div>
                )}
                {annual && price > 0 && (
                  <p className="text-xs text-foreground-muted mt-1">
                    Billed annually (${price * 12}{tier.perUser ? " / user" : ""}/yr)
                  </p>
                )}
              </div>
              <ul className="space-y-3 mb-10 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground-secondary">
                    <Check className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={tier.href}
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

      {/* Included on every plan */}
      <div className="mt-12 border border-border p-8">
        <h2 className="text-sm font-medium text-foreground-muted uppercase tracking-wider mb-6">
          Included on every plan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            "No data used for model training",
            "AES-256 encryption at rest",
            "TLS 1.3 in transit",
            "99.9% uptime SLA",
            "GDPR compliant",
            "Cancel any time",
            "Export your data",
            "Email support",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-foreground-secondary">
              <Check className="w-4 h-4 text-foreground shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Government & Agency section */}
      <div className="mt-24">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-4 h-4 text-foreground-muted" />
          <span className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
            Government & Agency
          </span>
        </div>
        <h2 className="text-3xl font-normal text-foreground mb-2">
          Built for government procurement
        </h2>
        <p className="text-foreground-secondary mb-10 max-w-2xl">
          FedRAMP-ready architecture, GovCloud hosting, CAC/PIV authentication, and compliance documentation.
          All plans include a dedicated onboarding team and support for standard procurement vehicles.
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {govTiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.name}
                className={`flex flex-col p-8 border transition-all duration-200 ${
                  tier.highlighted
                    ? "border-foreground bg-card shadow-lg"
                    : "border-border bg-card hover:border-border-light"
                }`}
              >
                {tier.badge && (
                  <div className="text-xs font-medium uppercase tracking-widest text-foreground mb-6 pb-4 border-b border-border">
                    {tier.badge}
                  </div>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-5 h-5 text-foreground-muted" />
                  <h3 className="text-xl font-normal text-foreground">{tier.name}</h3>
                </div>
                <p className="text-sm font-medium text-foreground mb-1">{tier.tagline}</p>
                <p className="text-sm text-foreground-secondary mb-6">{tier.description}</p>
                <div className="mb-8">
                  <div className="text-4xl font-normal text-foreground">Custom</div>
                  <p className="text-xs text-foreground-muted mt-1">Contact us for pricing</p>
                </div>
                <ul className="space-y-3 mb-10 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-foreground-secondary">
                      <Check className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={tier.href}
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

        {/* Gov compliance strip */}
        <div className="mt-10 border border-border p-8">
          <h3 className="text-sm font-medium text-foreground-muted uppercase tracking-wider mb-6">
            Compliance & certifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "FedRAMP Ready",
              "NIST 800-53",
              "FIPS 140-2 encryption",
              "IL4 / IL5 capable",
              "ITAR compliant",
              "SOC 2 Type II",
              "CAC / PIV / SCIM",
              "GSA / SEWP procurement",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-foreground-secondary">
                <Check className="w-4 h-4 text-foreground shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-20">
        <h2 className="text-2xl font-normal text-foreground mb-8">Common questions</h2>
        <div className="divide-y divide-border border border-border">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-background-tertiary/50 transition-colors"
              >
                <span className="font-medium text-foreground text-sm">{faq.q}</span>
                <span className={`ml-4 shrink-0 text-foreground-muted transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 text-sm text-foreground-secondary leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

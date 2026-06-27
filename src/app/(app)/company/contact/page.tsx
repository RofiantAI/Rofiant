"use client";

import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Briefcase,
  Headphones,
  Handshake,
  ArrowRight,
  Send,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const [hoveredContact, setHoveredContact] = useState<number | null>(null);
  const [formFocused, setFormFocused] = useState<string | null>(null);

  const contacts = [
    {
      icon: Briefcase,
      title: "Sales",
      desc: "Interested in Rofiant for your organization? Talk to our sales team about pricing, deployment options, and custom requirements.",
      action: "Talk to sales",
      color: "text-accent-primary",
    },
    {
      icon: Headphones,
      title: "Support",
      desc: "Existing customer? Reach out to our support team for help with integration, troubleshooting, or account questions.",
      action: "Contact support",
      color: "text-accent-secondary",
    },
    {
      icon: Handshake,
      title: "Partnerships",
      desc: "Interested in partnering with Rofiant? We work with system integrators, resellers, and technology partners.",
      action: "Partner with us",
      color: "text-accent-success",
    },
  ];

  return (
    <PageLayout
      badge="COMPANY"
      title="Contact"
      subtitle="Get in touch with our team. We will respond within one business day."
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="space-y-6">
          {contacts.map((c, index) => {
            const Icon = c.icon;
            const isHovered = hoveredContact === index;

            return (
              <div
                key={c.title}
                className="group"
                onMouseEnter={() => setHoveredContact(index)}
                onMouseLeave={() => setHoveredContact(null)}
              >
                <Card
                  variant="bordered"
                  className={`p-6 transition-all duration-300 ${
                    isHovered
                      ? "border-border-light shadow-lg -translate-y-1"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {c.title}
                      </h3>
                      <p className="mt-2 text-sm text-foreground-secondary">
                        {c.desc}
                      </p>
                      <Button variant="outline" className="mt-4 group/btn">
                        {c.action}
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-0.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}

          <div className="mt-8 p-6  bg-background-tertiary">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Other ways to reach us
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-foreground-secondary">
                <Mail className="w-4 h-4 text-foreground-muted" />
                contact@rofiant.ca
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground-secondary">
                <Phone className="w-4 h-4 text-foreground-muted" />
                +1 (555) 123-4567
              </div>
            </div>
          </div>
        </div>

        <div className=" border border-border bg-card p-8 hover:border-border-light transition-colors">
          <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
            <Send className="w-4 h-4" />
            Send us a message
          </h3>
          <form className="space-y-4">
            <div>
              <label className="text-sm text-foreground-secondary block mb-1">
                Name
              </label>
              <input
                type="text"
                className={`w-full  border bg-background-tertiary px-4 py-2.5 text-sm text-foreground outline-none transition-colors ${
                  formFocused === "name"
                    ? "border-accent-secondary"
                    : "border-border"
                }`}
                onFocus={() => setFormFocused("name")}
                onBlur={() => setFormFocused(null)}
              />
            </div>
            <div>
              <label className="text-sm text-foreground-secondary block mb-1">
                Email
              </label>
              <input
                type="email"
                className={`w-full  border bg-background-tertiary px-4 py-2.5 text-sm text-foreground outline-none transition-colors ${
                  formFocused === "email"
                    ? "border-accent-secondary"
                    : "border-border"
                }`}
                onFocus={() => setFormFocused("email")}
                onBlur={() => setFormFocused(null)}
              />
            </div>
            <div>
              <label className="text-sm text-foreground-secondary block mb-1">
                Subject
              </label>
              <input
                type="text"
                className={`w-full  border bg-background-tertiary px-4 py-2.5 text-sm text-foreground outline-none transition-colors ${
                  formFocused === "subject"
                    ? "border-accent-secondary"
                    : "border-border"
                }`}
                onFocus={() => setFormFocused("subject")}
                onBlur={() => setFormFocused(null)}
              />
            </div>
            <div>
              <label className="text-sm text-foreground-secondary block mb-1">
                Message
              </label>
              <textarea
                rows={4}
                className={`w-full  border bg-background-tertiary px-4 py-2.5 text-sm text-foreground outline-none resize-none transition-colors ${
                  formFocused === "message"
                    ? "border-accent-secondary"
                    : "border-border"
                }`}
                onFocus={() => setFormFocused("message")}
                onBlur={() => setFormFocused(null)}
              />
            </div>
            <Button className="w-full group">
              Send message
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}

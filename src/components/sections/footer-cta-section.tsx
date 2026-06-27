"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";

export function FooterCtaSection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative overflow-hidden border-t border-border">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2  transition-transform duration-700"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(234,179,8,0.06) 40%, transparent 70%)",
            transform: `translate(-50%, -50%) scale(${isHovered ? 1.1 : 1})`,
          }}
        />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1  bg-accent-primary/10 text-accent-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Get started today
          </div>
          <h2 className="text-3xl font-normal tracking-tight text-foreground sm:text-5xl">
            Ready to deploy AI for your mission?
          </h2>
          <p className="mt-4 max-w-lg text-xl text-foreground-secondary">
            Start for free. Deploy in minutes. Scale to agency-wide when you are
            ready.
          </p>
          <div 
            className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <a href="/auth/signup">
              <Button size="lg" className="group">
                Start for free
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
            <a href="/company/contact">
              <Button variant="outline" size="lg">
                Talk to sales
              </Button>
            </a>
          </div>
          <p className="mt-4 text-sm text-foreground-muted">
            No credit card required · Free tier available
          </p>
        </div>
      </div>
    </section>
  );
}

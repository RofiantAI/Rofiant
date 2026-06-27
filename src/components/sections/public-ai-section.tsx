import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MessageSquare,
  FileText,
  Search,
  Code,
  Image,
  Globe,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Chat with AI",
    desc: "Ask questions, get answers, brainstorm ideas. Rofiant understands context and keeps up with long conversations.",
    color: "accent-primary",
  },
  {
    icon: FileText,
    title: "Write & edit",
    desc: "Draft emails, essays, reports, and code. Rofiant helps you write faster and polish your work.",
    color: "accent-secondary",
  },
  {
    icon: Search,
    title: "Research",
    desc: "Summarize articles, compare sources, explore topics. Get reliable answers with citations.",
    color: "accent-success",
  },
  {
    icon: Code,
    title: "Code",
    desc: "Write, debug, and explain code in any language. From snippets to full projects.",
    color: "accent-warning",
  },
  {
    icon: Image,
    title: "Analyze images",
    desc: "Upload photos, screenshots, or diagrams. Rofiant reads text, understands charts, and describes what it sees.",
    color: "accent-orange",
  },
  {
    icon: Globe,
    title: "Multilingual",
    desc: "Chat in multiple languages. Translate, summarize, and write across supported languages.",
    color: "red-500",
  },
];

export function PublicAISection() {
  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-normal tracking-tight text-foreground sm:text-5xl">
            AI for{" "}
            <span className="bg-accent-primary px-1 text-background">
              everyone.
            </span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-foreground-secondary">
            Rofiant is not just for enterprises and agencies. Anyone can use our
            AI to write, research, analyze, and create — for free.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title} variant="bordered" className="p-6 h-full">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-foreground-secondary">
                  {feature.desc}
                </p>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/auth/signup">
            <Button size="lg" className="group">
              Try Rofiant for free
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

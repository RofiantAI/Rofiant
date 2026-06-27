"use client";

import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  FileText,
  Zap,
  Phone,
  ArrowRight,
  CheckCircle,
  Radio,
  Headphones,
  Globe,
  Clock,
  Volume2,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

function WaveformVisual() {
  const bars = [
    20, 35, 25, 45, 30, 55, 40, 65, 50, 70, 45, 60, 35, 50, 25, 40, 55, 30, 45,
    65, 35, 50, 40, 55, 30, 45, 25, 40, 20, 35,
  ];

  return (
    <div className=" border border-border bg-card p-6 hover:border-border-light transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3  bg-red-500 animate-pulse" />
        <span className="text-sm font-medium text-foreground">
          Live transcription
        </span>
        <span className="ml-auto text-xs text-foreground-muted">00:03:42</span>
      </div>
      <div className="flex items-end gap-[2px] h-20 mb-4">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`flex-1  transition-all duration-300 ${
              i > bars.length - 5
                ? "bg-accent-primary"
                : "bg-foreground-muted/30"
            }`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="bg-background-tertiary  p-4">
        <div className="text-xs text-foreground-muted mb-2">
          Real-time transcript
        </div>
        <div className="text-sm text-foreground space-y-1">
          <p>
            <span className="text-foreground-muted">[Alice]</span> Can we review
            the Q3 numbers before next week? I think we missed the marketing
            spend in the analysis.
          </p>
          <p>
            <span className="text-foreground-muted">[Bob]</span> Good catch. I
            will pull the updated breakdown and send it by Friday.
          </p>
          <p className="text-accent-primary">
            <span className="text-foreground-muted">[AI Summary]</span> Action
            item: Bob to send updated Q3 numbers with marketing spend by Friday.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VoiceAIPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: Mic,
      title: "Real-time transcription",
      desc: "Speech-to-text with high accuracy, even in noisy environments. Supports major languages.",
      color: "text-accent-primary",
      details: [
        "Word error rate < 5% in clear audio",
        "Speaker diarization: identify who said what",
        "Works with noisy audio, accents, and jargon",
        "Custom vocabulary for industry terms",
      ],
    },
    {
      icon: FileText,
      title: "Live summarization",
      desc: "Get instant summaries of calls and meetings as they happen. No more manual note-taking.",
      color: "text-accent-secondary",
      details: [
        "Auto-generate meeting minutes with action items",
        "Extract key decisions and commitments",
        "Identify unresolved questions and follow-ups",
        "Export to email, CRM, or task manager",
      ],
    },
    {
      icon: Zap,
      title: "Meeting summaries",
      desc: "Generate structured summaries with action items, decisions, and key topics after each call or meeting.",
      color: "text-accent-success",
      details: [
        "Auto-generate meeting minutes with action items",
        "Extract key decisions and commitments",
        "Identify unresolved questions and follow-ups",
        "Export to email, CRM, or task manager",
      ],
    },
    {
      icon: Phone,
      title: "Telephony integration",
      desc: "Connect to existing phone systems and VoIP platforms via SIP or WebRTC.",
      color: "text-accent-warning",
      details: [
        "SIP trunk support for PBX systems",
        "WebRTC for browser-based calls",
        "Import pre-recorded audio files",
        "Export transcripts in multiple formats",
      ],
    },
  ];

  const languages = [
    "English",
    "Spanish",
    "Mandarin",
    "Arabic",
    "French",
    "German",
    "Japanese",
    "Korean",
    "Portuguese",
    "Russian",
    "Hindi",
    "Italian",
    "Dutch",
    "Turkish",
  ];

  return (
    <PageLayout
      badge="PLATFORM"
      badgeVariant="info"
      title="Voice AI"
      subtitle="Real-time voice transcription and summarization for meetings, calls, and interviews. Supports 14 languages with speaker identification and meeting minutes export."
      hero={<WaveformVisual />}
    >
      {/* Features */}
      <PageSection
        title="Capabilities"
        subtitle="Everything you need for voice-powered operations."
      >
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
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 text-foreground-muted transition-all duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
                    />
                  </div>
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm text-foreground-secondary mb-4">
                    {f.desc}
                  </p>
                  <ul className="space-y-2">
                    {f.details.map((d, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-foreground-muted"
                      >
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

      {/* Languages */}
      <PageSection
        title="Languages"
        subtitle="Real-time transcription and translation."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          {languages.map((lang) => (
            <Badge key={lang} variant="default" className="px-4 py-2 text-sm">
              {lang}
            </Badge>
          ))}
        </div>
      </PageSection>

      {/* Use cases */}
      <PageSection
        title="Use cases"
        subtitle="Voice AI for mission-critical operations."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[
            {
              title: "Sales Calls",
              desc: "Transcribe sales calls, extract action items, and sync notes to your CRM automatically.",
              icon: Headphones,
            },
            {
              title: "Team Meetings",
              desc: "Real-time transcription with speaker labels and auto-generated meeting minutes.",
              icon: Radio,
            },
            {
              title: "Interviews",
              desc: "Transcribe candidate or witness interviews with accurate speaker identification and timestamps.",
              icon: Volume2,
            },
          ].map((u) => {
            const Icon = u.icon;
            return (
              <Card key={u.title} variant="bordered" className="p-6">
                <Icon className="w-6 h-6 text-foreground-muted mb-3" />
                <h3 className="font-semibold text-foreground">{u.title}</h3>
                <p className="mt-2 text-sm text-foreground-secondary">
                  {u.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </PageSection>

      {/* CTA */}
      <div className="mt-20 p-8  bg-card border border-border text-center">
        <h3 className="text-2xl font-semibold text-foreground mb-2">
          Ready to transcribe your meetings and calls?
        </h3>
        <p className="text-foreground-secondary mb-6">
          Start with a pilot program. Scale to your entire organization.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="group">
            Start free trial
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button variant="outline" size="lg">
            Talk to sales
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Check } from "lucide-react";

const tabs = ["chat", "documents", "agents"] as const;

type TabKey = (typeof tabs)[number];

export function DeploySection() {
  const t = useTranslations("home.deploy");
  const [activeTab, setActiveTab] = useState<TabKey>("chat");

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <Badge variant="success" dot className="mb-6">
            {t("badge")}
          </Badge>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
            <h2 className="text-4xl md:text-5xl font-normal leading-tight tracking-tight">
              {t("titleLine1")}
              <br />
              {t("titleLine2")}
              <br />
              {t("titleLine3")}
            </h2>
            <p className="text-foreground-secondary text-base max-w-sm pt-2">
              {t("subtitle")}
            </p>
          </div>
        </div>

        <div className="border border-border  overflow-hidden">
          <div className="flex overflow-x-auto border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 shrink-0 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === activeTab
                    ? "text-foreground bg-background-secondary"
                    : "text-foreground-muted hover:text-foreground-secondary hover:bg-background-secondary/50"
                }`}
              >
                {t(`tabs.${tab}`)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px]">
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <h3 className="text-2xl font-semibold mb-2">
                {t(`content.${activeTab}.title`)}
              </h3>
              <p className="text-foreground-secondary text-lg mb-4">
                {t(`content.${activeTab}.subtitle`)}
              </p>
              <p className="text-foreground-muted leading-relaxed">
                {t(`content.${activeTab}.description`)}
              </p>
            </div>

            <div className="relative bg-background-secondary border-l border-border p-6 flex items-center justify-center">
              {activeTab === "chat" && <ChatMockup />}
              {activeTab === "documents" && <DocsMockup />}
              {activeTab === "agents" && <AgentsMockup />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatMockup() {
  return (
    <Card variant="bordered" className="w-full max-w-md">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2  bg-accent-success" />
          <span className="text-sm font-medium">Rofiant Chat</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex gap-3">
          <div className="w-6 h-6  bg-background-tertiary flex items-center justify-center text-xs text-foreground-muted shrink-0">
            U
          </div>
          <div className="bg-background-tertiary  px-3 py-2 text-sm text-foreground max-w-[80%]">
            What were our Q3 revenue numbers?
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <div className="bg-accent-secondary/20  px-3 py-2 text-sm text-foreground max-w-[80%]">
            Q3 revenue was $4.2M, up 18% from Q2. Key growth drivers were
            enterprise subscriptions and API usage.
          </div>
          <div className="w-6 h-6  bg-accent-secondary flex items-center justify-center text-xs text-white shrink-0">
            R
          </div>
        </div>
      </div>
    </Card>
  );
}

function DocsMockup() {
  return (
    <Card variant="bordered" className="w-full max-w-md">
      <div className="p-4 border-b border-border">
        <h4 className="font-semibold">Document Intelligence</h4>
        <p className="text-xs text-foreground-muted mt-1">
          Processing: 1,247 documents
        </p>
      </div>
      <div className="p-4 space-y-3">
        {[
          {
            name: "Q3 Financial Report.pdf",
            type: "Classification",
            status: "Complete",
          },
          {
            name: "Board Meeting Notes.docx",
            type: "Extraction",
            status: "Processing",
          },
          {
            name: "Policy Update v3.pdf",
            type: "Summarization",
            status: "Queued",
          },
        ].map((doc) => (
          <div
            key={doc.name}
            className="flex items-center justify-between p-3  border border-border"
          >
            <div>
              <div className="text-sm font-medium">{doc.name}</div>
              <div className="text-xs text-foreground-muted">{doc.type}</div>
            </div>
            <Badge
              variant={
                doc.status === "Complete"
                  ? "success"
                  : doc.status === "Processing"
                    ? "info"
                    : "default"
              }
              dot
            >
              {doc.status}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

const PIPELINE_STEPS = [
  "1. Receive query",
  "2. Search documents",
  "3. Cross-reference data",
  "4. Generate summary",
  "5. Return response",
] as const;

const STEP_DURATION_MS = 1400;

type StepStatus = "done" | "running" | "pending";

function AgentsMockup() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (activeStep >= PIPELINE_STEPS.length) return;

    const timer = window.setTimeout(() => {
      setActiveStep((prev) => prev + 1);
    }, STEP_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [activeStep]);

  function getStepStatus(index: number): StepStatus {
    if (index < activeStep) return "done";
    if (index === activeStep && activeStep < PIPELINE_STEPS.length) return "running";
    return "pending";
  }

  return (
    <Card variant="bordered" className="w-full max-w-md">
      <div className="p-4 border-b border-border">
        <h4 className="font-semibold">Agent Pipeline</h4>
        <p className="text-xs text-foreground-muted mt-1">
          Multi-step reasoning workflow
        </p>
      </div>
      <div className="p-4 space-y-2">
        {PIPELINE_STEPS.map((step, index) => {
          const status = getStepStatus(index);

          return (
            <div key={step} className="flex items-center gap-3 p-2">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                {status === "done" && (
                  <div className="flex h-5 w-5 items-center justify-center bg-accent-success text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                )}
                {status === "running" && (
                  <Spinner
                    size="sm"
                    className="text-accent-secondary"
                    aria-label={`Running: ${step}`}
                  />
                )}
                {status === "pending" && (
                  <div className="h-5 w-5 border-2 border-foreground-muted/40" />
                )}
              </div>
              <span
                className={`text-sm transition-colors ${
                  status === "running"
                    ? "text-foreground font-medium"
                    : status === "done"
                      ? "text-foreground-secondary"
                      : "text-foreground-muted"
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

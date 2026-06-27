"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Database, MessageSquare, Link2, FileText } from "lucide-react";

const tabs = ["Chat", "Voice", "Documents", "Agents", "Integrate"] as const;

type TabKey = (typeof tabs)[number];

interface TabContent {
  title: string;
  subtitle: string;
  description: string;
}

const tabContent: Record<TabKey, TabContent> = {
  Chat: {
    title: "Deploy conversational AI instantly",
    subtitle: "Chat that understands your domain",
    description:
      "Launch a ChatGPT-like experience customized to your data, policies, and workflows. Users get instant answers from your knowledge base.",
  },
  Voice: {
    title: "Voice AI for meetings and calls",
    subtitle: "Real-time transcription and summarization",
    description:
      "Transcribe meetings, calls, and interviews in real time. Generate summaries with action items and key decisions.",
  },
  Documents: {
    title: "Unstructured document intelligence",
    subtitle: "Extract, classify, and summarize at scale",
    description:
      "Process reports, filings, and documents automatically. RAG-powered search across millions of pages.",
  },
  Agents: {
    title: "AI workflow assistants",
    subtitle: "Multi-step reasoning, governed execution",
    description:
      "Deploy agents that plan, reason, and execute complex workflows — with guardrails, approvals, and full audit trails.",
  },
  Integrate: {
    title: "Integrate with existing systems",
    subtitle: "APIs that plug into your stack",
    description:
      "Connect Rofiant to your existing tools — case management, CRM, ticketing — via REST APIs and webhooks.",
  },
};

export function DeploySection() {
  const [activeTab, setActiveTab] = useState<TabKey>("Chat");
  const content = tabContent[activeTab];

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <Badge variant="success" dot className="mb-6">
            AI PLATFORM
          </Badge>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
            <h2 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
              Deploy AI in minutes.
              <br />
              Scale to millions of
              <br />
              conversations.
            </h2>
            <p className="text-foreground-secondary text-base max-w-sm pt-2">
              From prototype to production in minutes. Chat, voice, documents,
              and workflow assistants — all on one platform.
            </p>
          </div>
        </div>

        <div className="border border-border  overflow-hidden">
          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  tab === activeTab
                    ? "text-foreground bg-background-secondary"
                    : "text-foreground-muted hover:text-foreground-secondary hover:bg-background-secondary/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px]">
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <h3 className="text-2xl font-semibold mb-2">{content.title}</h3>
              <p className="text-foreground-secondary text-lg mb-4">
                {content.subtitle}
              </p>
              <p className="text-foreground-muted leading-relaxed">
                {content.description}
              </p>

              {activeTab === "Voice" && (
                <div className="flex items-center gap-6 mt-8 pt-6 border-t border-border">
                  {["English", "Spanish", "Arabic", "Mandarin"].map((lang) => (
                    <span
                      key={lang}
                      className="text-foreground-muted text-sm font-medium"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="relative bg-background-secondary border-l border-border p-6 flex items-center justify-center">
              {activeTab === "Chat" && <ChatMockup />}
              {activeTab === "Voice" && <VoiceMockup />}
              {activeTab === "Documents" && <DocsMockup />}
              {activeTab === "Agents" && <AgentsMockup />}
              {activeTab === "Integrate" && <IntegrateMockup />}
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

function VoiceMockup() {
  return (
    <Card variant="bordered" className="w-full max-w-md">
      <div className="p-4 border-b border-border">
        <h4 className="font-semibold">Voice Session</h4>
        <p className="text-xs text-foreground-muted mt-1">Active call</p>
      </div>
      <div className="p-6 flex flex-col items-center gap-4">
        <div className="w-20 h-20  bg-accent-secondary/20 flex items-center justify-center">
          <div className="w-3 h-3  bg-accent-secondary animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">Listening...</p>
          <p className="text-xs text-foreground-muted mt-1">
            Transcribing in real-time
          </p>
        </div>
        <div className="w-full bg-background-tertiary  p-3 text-xs text-foreground-secondary font-mono">
          &quot;...can you pull up the latest sales report...&quot;
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

function AgentsMockup() {
  return (
    <Card variant="bordered" className="w-full max-w-md">
      <div className="p-4 border-b border-border">
        <h4 className="font-semibold">Agent Pipeline</h4>
        <p className="text-xs text-foreground-muted mt-1">
          Multi-step reasoning workflow
        </p>
      </div>
      <div className="p-4 space-y-2">
        {[
          { step: "1. Receive query", status: "done" },
          { step: "2. Search knowledge base", status: "done" },
          { step: "3. Cross-reference data", status: "running" },
          { step: "4. Generate summary", status: "pending" },
          { step: "5. Return response", status: "pending" },
        ].map((item) => (
          <div key={item.step} className="flex items-center gap-3 p-2">
            {item.status === "done" && (
              <div className="w-5 h-5  bg-accent-success flex items-center justify-center text-[10px] text-white">
                ✓
              </div>
            )}
            {item.status === "running" && (
              <div className="w-5 h-5 border-2 border-accent-secondary border-t-transparent  animate-spin" />
            )}
            {item.status === "pending" && (
              <div className="w-5 h-5  border-2 border-foreground-muted" />
            )}
            <span className="text-sm">{item.step}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function IntegrateMockup() {
  return (
    <Card variant="bordered" className="w-full max-w-md">
      <div className="p-4 border-b border-border">
        <h4 className="font-semibold">System Integrations</h4>
        <p className="text-xs text-foreground-muted mt-1">Connected systems</p>
      </div>
      <div className="p-4 space-y-3">
        {[
          { name: "CRM", status: "Connected", icon: Database },
          { name: "Slack", status: "Connected", icon: MessageSquare },
          { name: "Jira", status: "Pending", icon: Link2 },
          { name: "Notion", status: "Connected", icon: FileText },
        ].map((sys) => {
          const Icon = sys.icon;
          return (
          <div
            key={sys.name}
            className="flex items-center justify-between p-3  border border-border"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{sys.name}</span>
            </div>
            <Badge
              variant={sys.status === "Connected" ? "success" : "warning"}
              dot
            >
              {sys.status}
            </Badge>
          </div>
        );})}
      </div>
    </Card>
  );
}

import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowDown, CheckCircle } from "lucide-react";

function DocumentVisual() {
  return (
    <div className=" border border-border bg-card p-6">
      <div className="grid grid-cols-3 gap-4 mb-4">
        {["PDF", "DOCX", "CSV"].map((type) => (
          <div
            key={type}
            className="bg-background-tertiary  p-3 text-center"
          >
            <FileText className="w-8 h-8 mx-auto text-foreground-muted mb-1" />
            <span className="text-xs font-mono text-foreground-muted">
              .{type.toLowerCase()}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-px bg-border" />
        <ArrowDown className="w-4 h-4 text-accent-primary" />
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="bg-background-tertiary  p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-4 h-4 text-accent-success" />
          <span className="text-sm font-medium text-accent-success">
            Extraction complete
          </span>
        </div>
        <div className="space-y-2 text-sm font-mono">
          <div className="flex justify-between">
            <span className="text-foreground-muted">entity_count</span>
            <span className="text-accent-primary">47</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-muted">confidence_avg</span>
            <span className="text-accent-primary">0.94</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-muted">pages_processed</span>
            <span className="text-accent-primary">12</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-muted">classification</span>
            <span className="text-accent-success">financial_report</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DocumentIntelligencePage() {
  const features = [
    {
      title: "Automated extraction",
      desc: "Pull structured data from unstructured documents — PDFs, scans, emails, and more.",
    },
    {
      title: "Classification",
      desc: "Automatically categorize and route documents based on content, type, and urgency.",
    },
    {
      title: "RAG-powered search",
      desc: "Search across your entire document corpus with natural language. Find answers, not just keywords.",
    },
    {
      title: "Summarization",
      desc: "Generate concise summaries of long reports, contracts, and filings in seconds.",
    },
  ];

  return (
    <PageLayout
      badge="PLATFORM"
      badgeVariant="info"
      title="Document Intelligence"
      subtitle="Process reports, filings, and documents automatically. RAG-powered search across millions of pages."
      hero={<DocumentVisual />}
    >
      <PageSection title="Capabilities">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-8">
          {features.map((f) => (
            <Card key={f.title} variant="bordered" className="p-6">
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-foreground-secondary">
                {f.desc}
              </p>
            </Card>
          ))}
        </div>
      </PageSection>

      <div className="mt-12">
        <Button size="lg">Get started</Button>
      </div>
    </PageLayout>
  );
}

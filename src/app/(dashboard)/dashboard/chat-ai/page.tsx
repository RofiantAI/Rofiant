import { createClient } from "@/lib/supabase/server";
import { MessageSquare, Database, Plus, Search, FileText } from "lucide-react";

export default async function ChatAIPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const knowledgeBases = [
    { name: "Default", docs: 0, status: "Active" },
  ];

  const sampleQuestions = [
    "What is our vacation policy?",
    "How do I submit an expense report?",
    "Summarize the quarterly report",
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-foreground">Chat AI</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Conversational AI trained on your documents
          </p>
        </div>
        <a
          href="/chat"
          className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New chat
        </a>
      </div>

      {/* Knowledge bases */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-foreground-secondary mb-4 uppercase tracking-wider">
          Knowledge bases
        </h2>
        <div className="bg-card border border-border">
          {knowledgeBases.map((kb, i) => (
            <div
              key={kb.name}
              className={`flex items-center justify-between px-5 py-4 ${
                i < knowledgeBases.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-foreground-muted" />
                <span className="text-sm text-foreground">{kb.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-foreground-muted">{kb.docs} documents</span>
                <span className="text-xs text-accent-success">{kb.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat interface placeholder */}
      <div className="bg-card border border-border">
        <div className="border-b border-border px-5 py-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-foreground-muted" />
          <span className="text-sm font-medium text-foreground">New conversation</span>
        </div>
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-background-tertiary flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-foreground font-medium">Start a conversation</h3>
          <p className="text-sm text-foreground-secondary mt-2 max-w-md mx-auto">
            Ask questions about your documents, policies, and data. Responses include
            source citations.
          </p>
          <div className="mt-6 space-y-2 max-w-md mx-auto">
            {sampleQuestions.map((q) => (
              <a
                key={q}
                href="/chat"
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground-secondary border border-border hover:border-border-light hover:text-foreground transition-colors text-left"
              >
                <Search className="w-3 h-3 text-foreground-muted" />
                {q}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Upload docs CTA */}
      <div className="mt-6 bg-card border border-border p-5">
        <div className="flex items-start gap-4">
          <FileText className="w-5 h-5 text-foreground-muted mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-foreground">No documents uploaded</h3>
            <p className="text-sm text-foreground-secondary mt-1">
              Upload PDFs, Word docs, or web pages to train your chat AI on your content.
            </p>
            <a
              href="/dashboard/documents"
              className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium border border-border text-foreground hover:bg-background-tertiary transition-colors mt-3"
            >
              Go to Documents
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

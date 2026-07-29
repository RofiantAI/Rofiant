"use client";

import { PageLayout } from "@/components/page-layout";
import {
  Rocket,
  MessageSquare,
  BarChart3,
  Webhook,
  Users,
  AlertTriangle,
  Key,
  Check,
  Copy,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

const NAV = [
  { id: "getting-started", label: "Getting Started", icon: Rocket },
  { id: "authentication", label: "Authentication", icon: Key },
  { id: "chat-completions", label: "Chat Completions", icon: MessageSquare },
  { id: "models", label: "Models", icon: BarChart3 },
  { id: "usage", label: "Usage", icon: BarChart3 },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "scim", label: "SCIM Provisioning", icon: Users },
  { id: "errors", label: "Errors & Rate Limits", icon: AlertTriangle },
];

function CodeBlock({ children, lang = "bash" }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(children.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative group mt-4 rounded-lg border border-border bg-black/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
        <span className="text-xs font-mono text-foreground-muted">{lang}</span>
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-accent-success" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono text-foreground-secondary">{children.trim()}</code>
      </pre>
    </div>
  );
}

function DocSection({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 pt-16 first:pt-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg border border-border flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5 text-accent-primary" />
        </div>
        <h2 className="text-2xl font-normal tracking-tight text-foreground">{title}</h2>
      </div>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground-secondary [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-8 [&_h3]:mb-2 [&_a]:text-accent-primary [&_a]:underline [&_a]:underline-offset-2 [&_code]:font-mono [&_code]:text-xs [&_code]:bg-black/30 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_table]:w-full [&_table]:text-sm [&_th]:text-left [&_th]:text-foreground [&_th]:font-medium [&_th]:py-2 [&_th]:pr-4 [&_th]:border-b [&_th]:border-border [&_td]:py-2 [&_td]:pr-4 [&_td]:border-b [&_td]:border-border/60 [&_td]:align-top">
        {children}
      </div>
    </section>
  );
}

export default function DocumentationPage() {
  const t = useTranslations("resources.documentation");
  const [activeNav, setActiveNav] = useState("getting-started");

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <PageLayout badge="RESOURCES" title={t("title")} subtitle={t("subtitle")}>
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
        <nav className="hidden lg:block">
          <div className="sticky top-24 space-y-0.5">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-card text-foreground font-medium"
                      : "text-foreground-muted hover:text-foreground-secondary"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="min-w-0 divide-y divide-border">
          <DocSection id="getting-started" title="Getting Started" icon={Rocket}>
            <p>
              The Rofiant API is a REST API served over HTTPS. Requests and responses use JSON.
              The API is reachable at <code>https://api.rofiant.ca</code>, or as{" "}
              <code>/api/v1/*</code> on <code>rofiant.ca</code> directly.
            </p>
            <h3>1. Create an API key</h3>
            <p>
              Sign in and go to <strong>Dashboard → API Keys</strong> to generate a key. API
              access requires a <strong>Pro, Team, Agency, or Enterprise</strong> plan &mdash;
              keys cannot be created on the Free plan. The key is shown once, in full, at creation
              time; only its prefix is stored and shown afterward.
            </p>
            <h3>2. Make a request</h3>
            <CodeBlock lang="bash">{`
curl https://api.rofiant.ca/v1/chat/completions \\
  -H "Authorization: Bearer $ROFIANT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      { "role": "user", "content": "Summarize this quarter'\\''s incident reports." }
    ]
  }'
            `}</CodeBlock>
          </DocSection>

          <DocSection id="authentication" title="Authentication" icon={Key}>
            <p>
              Every request is authenticated with a bearer token in the{" "}
              <code>Authorization</code> header. Keys are prefixed <code>sk_</code>; requests
              without a valid key return <code>401</code>.
            </p>
            <CodeBlock lang="bash">{`Authorization: Bearer sk_...`}</CodeBlock>
            <p>
              Each request updates the key&apos;s <code>last_used_at</code> timestamp, visible on
              the API Keys page. Keys can be revoked at any time from the dashboard.
            </p>
          </DocSection>

          <DocSection id="chat-completions" title="Chat Completions" icon={MessageSquare}>
            <p>
              <code>POST /v1/chat/completions</code> &mdash; generate a chat response, in an
              OpenAI-compatible request/response shape.
            </p>
            <h3>Request body</h3>
            <table>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><code>messages</code></td><td>array</td><td>Required. <code>{"{ role, content }"}</code> objects, role one of <code>system</code> / <code>user</code> / <code>assistant</code>.</td></tr>
                <tr><td><code>model</code></td><td>string</td><td>See <a href="#models">Models</a>. Falls back to <code>llama-3.3-70b-versatile</code> if omitted or unrecognized.</td></tr>
                <tr><td><code>stream</code></td><td>boolean</td><td>Default <code>false</code>. See below.</td></tr>
                <tr><td><code>temperature</code></td><td>number</td><td>Optional, passed through to the model.</td></tr>
                <tr><td><code>max_tokens</code></td><td>number</td><td>Optional, passed through to the model.</td></tr>
                <tr><td><code>system</code></td><td>string</td><td>Optional. Appended after the built-in Rofiant system prompt and any <code>system</code>-role messages.</td></tr>
              </tbody>
            </table>
            <h3>Non-streaming response</h3>
            <CodeBlock lang="json">{`
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1730000000,
  "model": "llama-3.3-70b-versatile",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "..." },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 42,
    "completion_tokens": 128,
    "total_tokens": 170
  }
}
            `}</CodeBlock>
            <h3>Streaming</h3>
            <p>
              Set <code>stream: true</code> to receive <code>text/event-stream</code>{" "}
              server-sent events. Each event is a <code>chat.completion.chunk</code> object with a
              <code>delta.content</code> string; the stream ends with a final chunk (
              <code>finish_reason: &quot;stop&quot;</code>) followed by a literal{" "}
              <code>data: [DONE]</code> line.
            </p>
          </DocSection>

          <DocSection id="models" title="Models" icon={BarChart3}>
            <p><code>GET /v1/models</code> &mdash; list available models.</p>
            <table>
              <thead>
                <tr>
                  <th>id</th>
                  <th>canonical</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><code>groq-llama-3.3-70b</code></td><td><code>llama-3.3-70b-versatile</code></td><td>Best for complex reasoning and analysis</td></tr>
                <tr><td><code>groq-llama-3.1-8b</code></td><td><code>llama-3.1-8b-instant</code></td><td>Lightweight, fastest responses</td></tr>
                <tr><td><code>groq-mixtral-8x7b</code></td><td><code>mixtral-8x7b-32768</code></td><td>Mixtral MoE, long context up to 32k tokens</td></tr>
              </tbody>
            </table>
            <p>Either the alias or the canonical name may be passed as <code>model</code> in a chat completion request.</p>
          </DocSection>

          <DocSection id="usage" title="Usage" icon={BarChart3}>
            <p>
              <code>GET /v1/usage?days=30</code> &mdash; token and request counts for the
              authenticated key&apos;s account, grouped by model. <code>days</code> is optional
              (default 30, max 90).
            </p>
            <CodeBlock lang="json">{`
{
  "object": "usage",
  "period_days": 30,
  "total_requests": 214,
  "by_model": {
    "llama-3.3-70b-versatile": {
      "requests": 180,
      "input_tokens": 52340,
      "output_tokens": 98120
    }
  }
}
            `}</CodeBlock>
          </DocSection>

          <DocSection id="webhooks" title="Webhooks" icon={Webhook}>
            <p>
              Register an <code>https://</code> endpoint from{" "}
              <strong>Dashboard → API Keys → Webhooks</strong> and select which events to
              receive:
            </p>
            <ul>
              <li><code>document.processed</code> &mdash; a document finished processing</li>
            </ul>
            <p>
              Each delivery is a <code>POST</code> with a JSON body of{" "}
              <code>{"{ event, created, data }"}</code> and an{" "}
              <code>X-Rofiant-Signature</code> header: an HMAC-SHA256 hex digest of the raw body,
              signed with the webhook&apos;s secret (shown once, at creation, prefixed{" "}
              <code>whsec_</code>). Verify it before trusting the payload.
            </p>
          </DocSection>

          <DocSection id="scim" title="SCIM Provisioning" icon={Users}>
            <p>
              Agency and Enterprise plans can provision users from an identity provider (e.g.
              Okta, Azure AD) via SCIM 2.0 at <code>/v1/scim/v2/Users</code>.
            </p>
            <ul>
              <li><code>GET /v1/scim/v2/Users</code> &mdash; list agency members as SCIM User resources</li>
              <li><code>POST /v1/scim/v2/Users</code> &mdash; provision a new member</li>
            </ul>
            <p>
              Authenticate with the agency&apos;s SCIM token (
              <strong>Dashboard → Agency → SCIM</strong>) as a bearer token &mdash; this is a
              separate credential from a regular API key.
            </p>
          </DocSection>

          <DocSection id="errors" title="Errors & Rate Limits" icon={AlertTriangle}>
            <p>Errors return a non-2xx status with a JSON body:</p>
            <CodeBlock lang="json">{`
{
  "error": {
    "message": "Invalid or missing API key",
    "type": "api_error",
    "code": 401
  }
}
            `}</CodeBlock>
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>400</td><td>Invalid request body (e.g. missing <code>messages</code>)</td></tr>
                <tr><td>401</td><td>Missing or invalid API key</td></tr>
                <tr><td>403</td><td>Key&apos;s account is not on a Pro/Team/Agency/Enterprise plan</td></tr>
                <tr><td>429</td><td>Rate limit exceeded &mdash; see <code>Retry-After</code> header</td></tr>
                <tr><td>500</td><td>Internal error</td></tr>
              </tbody>
            </table>
            <h3>Rate limits</h3>
            <p>
              <code>/v1/*</code> endpoints are limited to <strong>60 requests per 60 seconds per
              API key</strong>. A <code>429</code> response includes a{" "}
              <code>Retry-After</code> header with the number of seconds to wait.
            </p>
          </DocSection>
        </div>
      </div>
    </PageLayout>
  );
}

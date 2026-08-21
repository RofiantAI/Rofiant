import type { ReactNode } from "react";
import { Sparkles, MessageSquare, FolderCode, KeyRound } from "lucide-react";

const FEATURES = [
  { icon: MessageSquare, title: "Ask it anything", body: "Chat like normal: questions, plans, quick answers." },
  {
    icon: FolderCode,
    title: "It can do real work",
    body: "Reads and writes files and runs commands in its own sandbox.",
  },
  {
    icon: KeyRound,
    title: "Use your own account",
    body: "Connect Claude Pro/Max or your OpenAI key to run on your subscription.",
  },
] as const;

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex h-full w-full text-foreground">
      <div className="flex w-full min-w-0 flex-1 items-center justify-center bg-background px-6 lg:w-[45%] lg:flex-none">
        <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="mb-8 flex flex-col items-start">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-foreground">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}

          <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
        </div>
      </div>

      <div className="hidden flex-1 items-center justify-center border-l border-border bg-card px-12 lg:flex">
        <div className="max-w-sm space-y-8">
          {FEATURES.map(({ icon: Icon, title: featureTitle, body }) => (
            <div key={featureTitle} className="flex gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Icon className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{featureTitle}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

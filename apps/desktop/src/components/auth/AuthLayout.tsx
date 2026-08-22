import type { ReactNode } from "react";
import { PersonaFace } from "@/components/personas/PersonaFace";
import { PERSONAS } from "@/lib/personas";

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
            <PersonaFace persona="agent" size={44} />
            <h1 className="mt-4 text-xl font-semibold text-foreground">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}

          <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
        </div>
      </div>

      <div className="hidden flex-1 items-center justify-center border-l border-border bg-sidebar px-12 lg:flex">
        <div className="max-w-sm">
          <p className="mb-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Meet your agents
          </p>
          <div className="space-y-5">
            {PERSONAS.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-1 duration-300"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
              >
                <PersonaFace persona={p.id} size={34} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{p.tagline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

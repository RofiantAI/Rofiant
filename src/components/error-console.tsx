import type { ReactNode } from "react";

export function ErrorState({
  code,
  title,
  subtitle,
  digest,
  actions,
  links,
}: {
  code: string;
  title: string;
  subtitle: string;
  digest?: string;
  actions: ReactNode;
  links?: ReactNode;
}) {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-xl text-center">
        <p className="text-sm font-medium tracking-[0.2em] text-foreground-muted">
          {code}
        </p>
        <h1 className="mt-4 text-4xl font-normal tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-foreground-secondary">
          {subtitle}
        </p>
        {digest && (
          <p className="mt-3 text-xs text-foreground-muted">
            Reference: {digest}
          </p>
        )}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {actions}
        </div>
        {links && (
          <div className="mt-16 border-t border-border pt-8">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {links}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

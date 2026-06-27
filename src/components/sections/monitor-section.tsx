import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function MonitorSection() {
  const barData = [
    { h: 25, yellow: false },
    { h: 30, yellow: true },
    { h: 28, yellow: false },
    { h: 35, yellow: false },
    { h: 32, yellow: true },
    { h: 40, yellow: false },
    { h: 38, yellow: true },
    { h: 45, yellow: false },
    { h: 50, yellow: false },
    { h: 55, yellow: false },
    { h: 60, yellow: true },
    { h: 65, yellow: false },
    { h: 70, yellow: false },
    { h: 75, yellow: true },
    { h: 80, yellow: false },
    { h: 85, yellow: true },
    { h: 78, yellow: false },
    { h: 72, yellow: false },
    { h: 68, yellow: true },
    { h: 60, yellow: false },
    { h: 55, yellow: false },
    { h: 48, yellow: true },
    { h: 42, yellow: false },
    { h: 38, yellow: false },
    { h: 35, yellow: true },
    { h: 30, yellow: false },
    { h: 28, yellow: false },
    { h: 25, yellow: true },
    { h: 22, yellow: false },
    { h: 20, yellow: false },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Badge variant="info" dot className="mb-6">
          OBSERVABILITY
        </Badge>
        <h2 className="text-3xl font-normal tracking-tight text-foreground sm:text-5xl leading-tight max-w-3xl">
          Monitor every inference in real time.{" "}
          <span className="text-foreground-muted">
            Full visibility into cost, latency, and usage.
          </span>
        </h2>

        <div className="mt-12  border border-border bg-card p-8 overflow-hidden">
          <div className="relative h-56">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-border/50"
                style={{ top: `${(i + 1) * (100 / 6)}%` }}
              />
            ))}
            <div className="absolute inset-0 flex items-end gap-[3px] px-1">
              {barData.map((bar, i) => (
                <div
                  key={i}
                  className={`flex-1  ${
                    bar.yellow ? "bg-accent-primary" : "bg-gray-700"
                  }`}
                  style={{ height: `${bar.h}%` }}
                />
              ))}
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-4 grid grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-1">
                <div className="h-1.5 flex-1 bg-gray-700 " />
                <div className="h-1.5 flex-1 bg-gray-700 " />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <a href="/resources/documentation">
              <Button variant="outline" size="md" className="mb-8">
                Read the docs
              </Button>
            </a>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Automatic token and cost tracking.
            </h3>
            <p className="mt-2 text-sm text-foreground-secondary">
              Monitor token usage, API costs, and inference performance across every
              department and use case in real time.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Usage alerting and monitoring.
            </h3>
            <p className="mt-2 text-sm text-foreground-secondary">
              Set alerts for unusual usage patterns, rate limit breaches, and
              budget thresholds. Stay ahead of cost overruns.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div />
          <div>
            <h3 className="font-semibold text-foreground">
              Compliance dashboards.
            </h3>
            <p className="mt-2 text-sm text-foreground-secondary">
              Pre-built dashboards for FedRAMP, SOC 2, and agency-specific
              compliance frameworks. Export-ready audit reports.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              API-first analytics.
            </h3>
            <p className="mt-2 text-sm text-foreground-secondary">
              Query your usage data via API and pipe it into existing SIEM, SOC,
              or command dashboards.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

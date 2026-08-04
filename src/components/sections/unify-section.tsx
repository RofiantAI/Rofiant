import { Card } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { SectionHeader } from "./section-header";

function AskVisualization() {
  return (
    <div className="relative h-32 w-full">
      <svg viewBox="0 0 200 120" className="h-full w-full" fill="none">
        <rect
          x="10"
          y="15"
          width="130"
          height="22"
          rx="4"
          fill="var(--background-tertiary)"
          stroke="var(--border-light)"
          strokeWidth="1"
        />
        <text x="20" y="30" fill="var(--foreground-muted)" fontSize="7">
          &quot;clean up my downloads&quot;
        </text>
        <line x1="75" y1="37" x2="75" y2="48" stroke="var(--border-light)" strokeWidth="1" />
        <rect x="55" y="49" width="40" height="22" rx="4" fill="var(--accent-primary)" />
        <text x="75" y="63" textAnchor="middle" fill="var(--background)" fontSize="7" fontWeight="bold">
          Rofiant
        </text>
        <line x1="75" y1="71" x2="75" y2="83" stroke="var(--border-light)" strokeWidth="1" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect
              x={20 + i * 45}
              y="84"
              width="35"
              height="20"
              rx="3"
              fill="var(--background-tertiary)"
              stroke="var(--border-light)"
              strokeWidth="1"
            />
            <text x={37 + i * 45} y="97" textAnchor="middle" fill="var(--foreground-muted)" fontSize="6">
              {["Screenshots", "Invoices", "Old files"][i]}
            </text>
            <path
              d={`M${37 + i * 45} 84 l-3 -6 l6 0 z`}
              fill="var(--accent-success)"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

function LocalOnlyPanel() {
  const checks = [
    { label: "Runs on your machine", status: "Always" },
    { label: "Files uploaded to the cloud", status: "Never" },
    { label: "Risky actions", status: "Ask first" },
    { label: "Every action", status: "Logged" },
  ];

  return (
    <div className="h-32 w-full overflow-hidden border border-border bg-background-tertiary">
      <div className="flex flex-col">
        {checks.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-3 py-1.5 text-xs border-l-2 border-accent-success"
          >
            <span className="text-foreground-secondary">{row.label}</span>
            <span className="text-accent-success font-medium">
              {row.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MemoryVisualization() {
  const inputs = ["Naming", "Folders", "Habits"];
  return (
    <div className="relative h-32 w-full">
      <svg viewBox="0 0 200 120" className="h-full w-full" fill="none">
        {inputs.map((label, i) => (
          <g key={label}>
            <rect
              x={20 + i * 55}
              y="15"
              width="40"
              height="20"
              rx="3"
              fill="var(--background-tertiary)"
              stroke="var(--border-light)"
              strokeWidth="1"
            />
            <text x={40 + i * 55} y="28" textAnchor="middle" fill="var(--foreground-muted)" fontSize="6">
              {label}
            </text>
            <line
              x1={40 + i * 55}
              y1="35"
              x2="100"
              y2="48"
              stroke="var(--border-light)"
              strokeWidth="1"
            />
          </g>
        ))}
        <rect x="70" y="49" width="60" height="26" rx="4" fill="var(--accent-primary)" />
        <text x="100" y="65" textAnchor="middle" fill="var(--background)" fontSize="7" fontWeight="bold">
          Memory
        </text>
        <line x1="100" y1="75" x2="100" y2="90" stroke="var(--border-light)" strokeWidth="1" strokeDasharray="2,2" />
        <text x="100" y="102" textAnchor="middle" fill="var(--foreground-muted)" fontSize="6">
          gets better over time
        </text>
      </svg>
    </div>
  );
}

function ActivityLogVisualization() {
  const rows = [
    { time: "10:32", text: "Renamed 12 files in Downloads" },
    { time: "10:31", text: "Found “Q3 report.pdf”" },
    { time: "10:28", text: "Sorted screenshots by date" },
    { time: "10:20", text: "Archived 3 old folders" },
  ];
  return (
    <div className="h-32 w-full overflow-hidden border border-border bg-background-tertiary">
      <div className="flex flex-col">
        {rows.map((row) => (
          <div
            key={row.time}
            className="flex items-center gap-2 px-3 py-1.5 text-xs border-l-2 border-accent-primary"
          >
            <span className="text-foreground-muted tabular-nums shrink-0">{row.time}</span>
            <span className="text-foreground-secondary truncate">{row.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function UnifySection() {
  const t = await getTranslations("home.unify");

  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <SectionHeader
            title={
              <>
                {t("titlePrefix")}{" "}
                <span className="bg-accent-primary px-1 text-background">
                  {t("titleHighlight")}
                </span>
              </>
            }
            subtitle={t("subtitle")}
          />
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card variant="bordered" noHover className="p-6">
            <h3 className="text-sm font-medium text-foreground-secondary">
              {t("cards.agents.label")}
            </h3>
            <AskVisualization />
            <p className="mt-4 text-sm text-foreground-secondary">
              <strong className="text-foreground">{t("cards.agents.strong")}</strong>{" "}
              {t("cards.agents.text")}
            </p>
          </Card>

          <Card variant="bordered" noHover className="p-6">
            <h3 className="text-sm font-medium text-foreground-secondary">
              {t("cards.security.label")}
            </h3>
            <LocalOnlyPanel />
            <p className="mt-4 text-sm text-foreground-secondary">
              <strong className="text-foreground">{t("cards.security.strong")}</strong>{" "}
              {t("cards.security.text")}
            </p>
          </Card>

          <Card variant="bordered" noHover className="p-6">
            <h3 className="text-sm font-medium text-foreground-secondary">
              {t("cards.control.label")}
            </h3>
            <MemoryVisualization />
            <p className="mt-4 text-sm text-foreground-secondary">
              <strong className="text-foreground">{t("cards.control.strong")}</strong>{" "}
              {t("cards.control.text")}
            </p>
          </Card>

          <Card variant="bordered" noHover className="p-6">
            <h3 className="text-sm font-medium text-foreground-secondary">
              {t("cards.usage.label")}
            </h3>
            <ActivityLogVisualization />
            <p className="mt-4 text-sm text-foreground-secondary">
              <strong className="text-foreground">{t("cards.usage.strong")}</strong>{" "}
              {t("cards.usage.text")}
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}

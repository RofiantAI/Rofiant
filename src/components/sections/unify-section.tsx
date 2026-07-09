import { Card } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

function AgentVisualization() {
  return (
    <div className="relative h-32 w-full">
      <svg viewBox="0 0 200 120" className="h-full w-full" fill="none">
        <rect x="70" y="45" width="60" height="30" rx="4" fill="#3b82f6" />
        <text
          x="100"
          y="63"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="7"
          fontWeight="bold"
        >
          Rofiant AI
        </text>
        <rect
          x="10"
          y="15"
          width="35"
          height="18"
          rx="3"
          fill="#18181b"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <text x="27" y="27" textAnchor="middle" fill="#a1a1aa" fontSize="6">
          Chat
        </text>
        <line
          x1="27"
          y1="33"
          x2="80"
          y2="45"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <rect
          x="10"
          y="85"
          width="35"
          height="18"
          rx="3"
          fill="#18181b"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <text x="27" y="97" textAnchor="middle" fill="#a1a1aa" fontSize="6">
          Voice
        </text>
        <line
          x1="27"
          y1="85"
          x2="80"
          y2="75"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <rect
          x="155"
          y="15"
          width="35"
          height="18"
          rx="3"
          fill="#18181b"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <text x="172" y="27" textAnchor="middle" fill="#a1a1aa" fontSize="6">
          Docs
        </text>
        <line
          x1="172"
          y1="33"
          x2="120"
          y2="45"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <rect
          x="155"
          y="85"
          width="35"
          height="18"
          rx="3"
          fill="#18181b"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <text x="172" y="97" textAnchor="middle" fill="#a1a1aa" fontSize="6">
          API
        </text>
        <line
          x1="172"
          y1="85"
          x2="120"
          y2="75"
          stroke="#3f3f46"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

function SecurityPanel() {
  const checks = [
    { label: "SOC 2 Type II", status: "In progress" },
    { label: "Data encryption", status: "At rest & in transit" },
    { label: "Role-based access", status: "Built-in" },
    { label: "Audit logging", status: "Automatic" },
  ];

  return (
    <div className="h-32 w-full overflow-hidden  border border-border bg-background-tertiary">
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

function ControlPlane() {
  return (
    <div className="relative h-32 w-full">
      <svg viewBox="0 0 200 120" className="h-full w-full" fill="none">
        <rect x="80" y="45" width="40" height="30" rx="4" fill="#3b82f6" />
        <text
          x="100"
          y="63"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="7"
          fontWeight="bold"
        >
          Core
        </text>
        <rect
          x="30"
          y="10"
          width="35"
          height="20"
          rx="3"
          fill="#18181b"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <text x="47" y="23" textAnchor="middle" fill="#a1a1aa" fontSize="6">
          Models
        </text>
        <line
          x1="47"
          y1="30"
          x2="85"
          y2="45"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <rect
          x="85"
          y="10"
          width="30"
          height="20"
          rx="3"
          fill="#18181b"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <text x="100" y="23" textAnchor="middle" fill="#a1a1aa" fontSize="6">
          Agents
        </text>
        <line
          x1="100"
          y1="30"
          x2="100"
          y2="45"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <rect
          x="135"
          y="10"
          width="35"
          height="20"
          rx="3"
          fill="#18181b"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <text x="152" y="23" textAnchor="middle" fill="#a1a1aa" fontSize="6">
          RAG
        </text>
        <line
          x1="145"
          y1="30"
          x2="115"
          y2="45"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <rect
          x="40"
          y="90"
          width="35"
          height="20"
          rx="3"
          fill="#18181b"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <text x="57" y="103" textAnchor="middle" fill="#a1a1aa" fontSize="6">
          Audit
        </text>
        <line
          x1="57"
          y1="90"
          x2="85"
          y2="75"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <rect
          x="85"
          y="90"
          width="30"
          height="20"
          rx="3"
          fill="#18181b"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <text x="100" y="103" textAnchor="middle" fill="#a1a1aa" fontSize="6">
          Logs
        </text>
        <line
          x1="100"
          y1="90"
          x2="100"
          y2="75"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <rect
          x="125"
          y="90"
          width="35"
          height="20"
          rx="3"
          fill="#18181b"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <text x="142" y="103" textAnchor="middle" fill="#a1a1aa" fontSize="6">
          Alerts
        </text>
        <line
          x1="142"
          y1="90"
          x2="115"
          y2="75"
          stroke="#3f3f46"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

function UsageChart() {
  const bars = [40, 55, 35, 70, 45, 60, 50, 80, 42, 65, 55, 75];
  const labels = ["1w", "2w", "3w", "4w", "5w"];

  return (
    <div className="relative h-32 w-full">
      <svg viewBox="0 0 200 120" className="h-full w-full" fill="none">
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1="10"
            y1={20 + i * 25}
            x2="170"
            y2={20 + i * 25}
            stroke="#27272a"
            strokeWidth="0.5"
          />
        ))}
        {bars.map((height, i) => (
          <rect
            key={i}
            x={18 + i * 13}
            y={100 - height}
            width="8"
            height={height}
            rx="1"
            fill={i === 7 ? "#3b82f6" : "#27272a"}
          />
        ))}
        {labels.map((label, i) => (
          <text
            key={label}
            x={22 + i * 32}
            y="115"
            textAnchor="middle"
            fill="#71717a"
            fontSize="7"
          >
            {label}
          </text>
        ))}
        <polyline
          points="22,80 54,65 86,85 118,45 150,70"
          stroke="#3b82f6"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="118" cy="45" r="3" fill="#3b82f6" />
      </svg>
    </div>
  );
}

export async function UnifySection() {
  const t = await getTranslations("home.unify");

  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-normal tracking-tight text-foreground sm:text-5xl leading-[1.15]">
            {t("titlePrefix")}{" "}
            <span className="bg-accent-primary px-1 text-background">
              {t("titleHighlight")}
            </span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-foreground-secondary">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card variant="bordered" noHover className="p-6">
            <h3 className="text-sm font-medium text-foreground-secondary">
              {t("cards.agents.label")}
            </h3>
            <AgentVisualization />
            <p className="mt-4 text-sm text-foreground-secondary">
              <strong className="text-foreground">{t("cards.agents.strong")}</strong>{" "}
              {t("cards.agents.text")}
            </p>
          </Card>

          <Card variant="bordered" noHover className="p-6">
            <h3 className="text-sm font-medium text-foreground-secondary">
              {t("cards.security.label")}
            </h3>
            <SecurityPanel />
            <p className="mt-4 text-sm text-foreground-secondary">
              <strong className="text-foreground">{t("cards.security.strong")}</strong>{" "}
              {t("cards.security.text")}
            </p>
          </Card>

          <Card variant="bordered" noHover className="p-6">
            <h3 className="text-sm font-medium text-foreground-secondary">
              {t("cards.control.label")}
            </h3>
            <ControlPlane />
            <p className="mt-4 text-sm text-foreground-secondary">
              <strong className="text-foreground">{t("cards.control.strong")}</strong>{" "}
              {t("cards.control.text")}
            </p>
          </Card>

          <Card variant="bordered" noHover className="p-6">
            <h3 className="text-sm font-medium text-foreground-secondary">
              {t("cards.usage.label")}
            </h3>
            <UsageChart />
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

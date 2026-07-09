"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ClipboardList,
  Heart,
  Scale,
  Headphones,
  FileText,
  Lock,
  Landmark,
  Users,
  Loader2,
  ArrowRight,
  Search,
  Upload,
  FileCheck,
  Shield,
} from "lucide-react";
import {
  DashboardPage,
  DashboardHeader,
  DashboardCard,
  DashboardUpgradeGate,
} from "@/components/dashboard/ui/page-shell";
import type { FederalSolutionId } from "@/lib/federal-solutions";
import { WORKFLOW_TASKS } from "@/lib/federal-workflows/tasks";
import { WORKFLOW_CATEGORIES } from "@/lib/federal-workflows/categories";

const ICONS: Record<FederalSolutionId, typeof ClipboardList> = {
  acquisitionContracts: ClipboardList,
  benefitsClaims: Heart,
  regulatoryRulemaking: Scale,
  citizenServices: Headphones,
  legalFoia: FileText,
  cyberAto: Lock,
  grantsFinancial: Landmark,
  humanCapital: Users,
};

const CATEGORY_ICONS: Record<string, typeof ClipboardList> = {
  contracting: ClipboardList,
  benefits: Heart,
  policy: Scale,
  operations: Shield,
};

const CATEGORIES = WORKFLOW_CATEGORIES.map((c) => ({
  ...c,
  icon: CATEGORY_ICONS[c.key] ?? ClipboardList,
}));

const ALL_IDS = CATEGORIES.flatMap((c) => c.solutions);

function SolutionCard({
  id,
  dept,
  agencies,
  summary,
  taskCountLabel,
  openLabel,
}: {
  id: FederalSolutionId;
  dept: string;
  agencies: string;
  summary: string;
  taskCountLabel: string;
  openLabel: string;
}) {
  const Icon = ICONS[id];
  const agencyList = agencies.split(",").map((a) => a.trim()).filter(Boolean);

  return (
    <DashboardCard className="p-0 flex flex-col h-full overflow-hidden hover:border-foreground/20 transition-colors">
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-background-tertiary border border-border">
            <Icon className="w-4 h-4 text-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-foreground leading-snug">{dept}</h3>
            <p className="text-xs text-foreground-secondary mt-1.5 line-clamp-2">{summary}</p>
            <p className="text-[10px] text-foreground-muted mt-2">{taskCountLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-auto pt-3">
          {agencyList.slice(0, 4).map((agency) => (
            <span
              key={agency}
              className="text-[10px] px-2 py-0.5 rounded border border-border text-foreground-muted bg-background-tertiary"
            >
              {agency}
            </span>
          ))}
        </div>
      </div>

      <Link
        href={`/dashboard/agency/solutions/${id}`}
        className="flex items-center justify-between gap-2 px-5 py-3 border-t border-border text-sm font-medium text-foreground bg-background-tertiary/30 hover:bg-background-tertiary transition-colors"
      >
        {openLabel}
        <ArrowRight className="w-4 h-4 text-foreground-muted" />
      </Link>
    </DashboardCard>
  );
}

export function FederalSolutionsClient() {
  const t = useTranslations("dashboard.agency.solutions");
  const tSolutions = useTranslations("solutions.federalAgencies.useCases");
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/federal-solutions")
      .then((r) => r.json())
      .then((data) => setAllowed(Boolean(data.allowed)))
      .finally(() => setLoading(false));
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!normalizedQuery) return CATEGORIES;

    return CATEGORIES.map((category) => ({
      ...category,
      solutions: category.solutions.filter((id) => {
        const dept = tSolutions(`${id}.dept`).toLowerCase();
        const agencies = tSolutions(`${id}.agencies`).toLowerCase();
        const items = (tSolutions.raw(`${id}.items`) as string[]).join(" ").toLowerCase();
        return (
          dept.includes(normalizedQuery) ||
          agencies.includes(normalizedQuery) ||
          items.includes(normalizedQuery) ||
          id.toLowerCase().includes(normalizedQuery)
        );
      }),
    })).filter((category) => category.solutions.length > 0);
  }, [normalizedQuery, tSolutions]);

  const visibleCount = filteredCategories.reduce((n, c) => n + c.solutions.length, 0);

  if (loading) {
    return (
      <DashboardPage>
        <div className="flex items-center justify-center py-20 text-foreground-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </DashboardPage>
    );
  }

  if (!allowed) {
    return (
      <DashboardPage>
        <DashboardHeader title={t("title")} description={t("subtitle")} />
        <DashboardUpgradeGate
          icon={Landmark}
          title={t("upgrade.title")}
          description={t("upgrade.description")}
          ctaHref="/pricing"
          ctaLabel={t("upgrade.cta")}
        />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <DashboardHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["upload", "run", "review"] as const).map((step) => (
          <div
            key={step}
            className="rounded-lg border border-border bg-card px-4 py-3 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-md bg-background-tertiary flex items-center justify-center shrink-0">
              {step === "upload" && <Upload className="w-4 h-4 text-foreground-muted" />}
              {step === "run" && <FileCheck className="w-4 h-4 text-foreground-muted" />}
              {step === "review" && <Shield className="w-4 h-4 text-foreground-muted" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{t(`howItWorks.${step}.title`)}</p>
              <p className="text-xs text-foreground-muted mt-0.5">{t(`howItWorks.${step}.desc`)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full h-9 pl-9 pr-3 rounded-md bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
          />
        </div>
        <p className="text-xs text-foreground-muted">
          {t("workflowCount", { count: visibleCount, total: ALL_IDS.length })}
        </p>
      </div>

      {filteredCategories.length === 0 ? (
        <DashboardCard className="p-8 text-center">
          <p className="text-sm text-foreground-secondary">{t("noResults")}</p>
        </DashboardCard>
      ) : (
        <div className="space-y-10">
          {filteredCategories.map((category) => {
            const CategoryIcon = category.icon;
            return (
              <section key={category.key}>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                  <CategoryIcon className="w-4 h-4 text-foreground-muted" />
                  <h2 className="text-sm font-medium text-foreground">
                    {t(`categories.${category.key}`)}
                  </h2>
                  <span className="text-xs text-foreground-muted ml-auto">
                    {category.solutions.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.solutions.map((id) => {
                    const items = tSolutions.raw(`${id}.items`) as string[];
                    return (
                      <SolutionCard
                        key={id}
                        id={id}
                        dept={tSolutions(`${id}.dept`)}
                        agencies={tSolutions(`${id}.agencies`)}
                        summary={items[0] ?? ""}
                        taskCountLabel={t("taskCount", { count: WORKFLOW_TASKS[id].length })}
                        openLabel={t("openWorkflow")}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <DashboardCard className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background-tertiary/20">
        <p className="text-sm text-foreground-secondary">{t("documentsHint")}</p>
        <Link
          href="/dashboard/documents"
          className="inline-flex items-center gap-2 text-sm font-medium text-accent-primary hover:underline shrink-0"
        >
          <Upload className="w-4 h-4" />
          {t("documentsCta")}
        </Link>
      </DashboardCard>
    </DashboardPage>
  );
}

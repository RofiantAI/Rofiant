import { createAdminClient } from "@/lib/supabase/admin";
import { PageLayout } from "@/components/page-layout";
import { CheckCircle2, AlertTriangle, MinusCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { StatusAnalytics } from "./status-analytics";
import { StatusUptimeBar } from "./status-uptime-bar";

const SERVICE_KEYS = ["chatAi", "documentIntelligence", "publicApi", "dashboard"] as const;
type ServiceKey = (typeof SERVICE_KEYS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;
const HISTORY_DAYS = 90;
// Two missed 5-minute cron ticks in a row before we call it a new incident
// rather than a continuation of the same one.
const INCIDENT_GAP_MS = 12 * 60 * 1000;

type Check = { service: string; healthy: boolean; latency_ms: number | null; checked_at: string };
type DailyUptime = { service: string; day: string; total_checks: number; healthy_checks: number };

async function checkDatabaseLive(): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("conversations").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

function uptimePct(rows: { total_checks: number; healthy_checks: number }[]): number | null {
  const total = rows.reduce((s, r) => s + r.total_checks, 0);
  if (total === 0) return null;
  const healthy = rows.reduce((s, r) => s + r.healthy_checks, 0);
  return (healthy / total) * 100;
}

function formatDuration(ms: number, t: (key: string, values?: Record<string, number>) => string): string {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return t("incidents.durationMinutes", { count: minutes });
  return t("incidents.durationHours", { count: Math.floor(minutes / 60), minutes: minutes % 60 });
}

export default async function StatusPage() {
  const t = await getTranslations("status");
  const admin = createAdminClient();
  // Server Component executed fresh per request (not memoized/re-rendered
  // client-side), so the current timestamp here is safe to compute once.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const [dayChecksRes, dailyUptimeRes, incidentChecksRes] = await Promise.all([
    admin
      .from("status_checks")
      .select("service, healthy, latency_ms, checked_at")
      .gte("checked_at", new Date(now - DAY_MS).toISOString())
      .order("checked_at", { ascending: true }),
    admin
      .from("status_daily_uptime")
      .select("service, day, total_checks, healthy_checks")
      .gte("day", new Date(now - HISTORY_DAYS * DAY_MS).toISOString().slice(0, 10)),
    admin
      .from("status_checks")
      .select("service, checked_at")
      .eq("healthy", false)
      .gte("checked_at", new Date(now - HISTORY_DAYS * DAY_MS).toISOString())
      .order("checked_at", { ascending: true })
      .limit(2000),
  ]);

  const dayChecks: Check[] = dayChecksRes.data ?? [];
  const dailyUptime: DailyUptime[] = dailyUptimeRes.data ?? [];
  const hasHistory = dayChecks.length > 0 || dailyUptime.length > 0;

  // Before the migration/cron has run there's no history yet — fall back to a
  // single live check so the page still reflects real status.
  const liveHealthy = hasHistory ? null : await checkDatabaseLive();

  const perService = SERVICE_KEYS.map((service) => {
    const dayRows = dayChecks.filter((c) => c.service === service);
    const latest = dayRows[dayRows.length - 1];
    const healthy = latest ? latest.healthy : (liveHealthy ?? true);

    const uptimeRows90 = dailyUptime.filter((r) => r.service === service);
    const uptime90 = uptimePct(uptimeRows90);
    const uptime24 = uptimePct(
      dayRows.length ? [{ total_checks: dayRows.length, healthy_checks: dayRows.filter((c) => c.healthy).length }] : []
    );

    // Build a 90-slot bar, oldest to newest, one cell per day.
    const byDay = new Map(uptimeRows90.map((r) => [r.day, r]));
    const bar = Array.from({ length: HISTORY_DAYS }, (_, i) => {
      const d = new Date(now - (HISTORY_DAYS - 1 - i) * DAY_MS);
      const key = d.toISOString().slice(0, 10);
      const row = byDay.get(key);
      const pct = row && row.total_checks > 0 ? (row.healthy_checks / row.total_checks) * 100 : null;
      return { date: key, pct };
    });

    return { service, healthy, uptime90, uptime24, bar };
  });

  const allHealthy = perService.every((s) => s.healthy);

  // Group consecutive unhealthy checks per service into incidents.
  const incidentChecks = incidentChecksRes.data ?? [];
  type Incident = { service: ServiceKey; start: string; end: string; ongoing: boolean };
  const incidents: Incident[] = [];
  for (const service of SERVICE_KEYS) {
    const rows = incidentChecks.filter((c) => c.service === service);
    let runStart: string | null = null;
    let runEnd: string | null = null;
    for (const row of rows) {
      const ts = new Date(row.checked_at).getTime();
      if (runEnd && ts - new Date(runEnd).getTime() > INCIDENT_GAP_MS) {
        incidents.push({ service, start: runStart!, end: runEnd, ongoing: false });
        runStart = row.checked_at;
      } else if (!runStart) {
        runStart = row.checked_at;
      }
      runEnd = row.checked_at;
    }
    if (runStart && runEnd) {
      const isOngoing = !perService.find((s) => s.service === service)?.healthy;
      incidents.push({ service, start: runStart, end: runEnd, ongoing: isOngoing });
    }
  }
  incidents.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
  const recentIncidents = incidents.slice(0, 10);

  return (
    <PageLayout badge={t("badge")} title={t("title")} subtitle={t("subtitle")}>
      <div
        className={`flex items-center gap-3 p-4 border mb-6 ${
          allHealthy ? "border-accent-success/30 bg-accent-success/5" : "border-red-500/30 bg-red-500/5"
        }`}
      >
        {allHealthy ? (
          <CheckCircle2 className="w-5 h-5 text-accent-success shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
        )}
        <p className="text-sm text-foreground">{allHealthy ? t("allOperational") : t("someIssues")}</p>
      </div>

      {!hasHistory && (
        <p className="text-xs text-foreground-muted mb-6">{t("noHistory")}</p>
      )}

      <div className="border border-border bg-card mb-6">
        {perService.map((s, i) => (
          <div
            key={s.service}
            className={`px-5 py-4 ${i < perService.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-foreground">{t(`services.${s.service}`)}</span>
              <div className="flex items-center gap-4">
                {s.uptime24 != null && (
                  <span className="text-xs text-foreground-muted font-mono tabular-nums hidden sm:inline">
                    {s.uptime24.toFixed(2)}% <span className="text-foreground-muted">· {t("uptime.day")}</span>
                  </span>
                )}
                {s.uptime90 != null && (
                  <span className="text-xs text-foreground-muted font-mono tabular-nums">
                    {s.uptime90.toFixed(2)}% <span className="text-foreground-muted">· {t("uptime.quarter")}</span>
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                    s.healthy ? "text-accent-success" : "text-red-400"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${s.healthy ? "bg-accent-success" : "bg-red-400"}`} />
                  {s.healthy ? t("operational") : t("degraded")}
                </span>
              </div>
            </div>

            {hasHistory && <StatusUptimeBar data={s.bar} />}
          </div>
        ))}
      </div>

      {hasHistory && <StatusAnalytics checks={dayChecks} />}

      {hasHistory && (
        <div className="border border-border bg-card">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted">
              {t("incidents.title")}
            </p>
            <p className="text-xs text-foreground-muted mt-0.5">{t("incidents.subtitle")}</p>
          </div>
          {recentIncidents.length === 0 ? (
            <p className="px-5 py-8 text-sm text-foreground-muted text-center">{t("incidents.empty")}</p>
          ) : (
            <div className="divide-y divide-border">
              {recentIncidents.map((inc, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    {inc.ongoing ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    ) : (
                      <MinusCircle className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{t(`services.${inc.service}`)}</p>
                      <p className="text-[10px] text-foreground-muted">
                        {t("incidents.startedAt", { time: new Date(inc.start).toLocaleString() })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 border shrink-0 ${
                      inc.ongoing
                        ? "text-red-400 border-red-400/30 bg-red-400/10"
                        : "text-foreground-muted border-border bg-background-tertiary"
                    }`}
                  >
                    {inc.ongoing
                      ? t("incidents.ongoing")
                      : formatDuration(new Date(inc.end).getTime() - new Date(inc.start).getTime(), t)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-foreground-muted">
        {t("lastChecked", { time: new Date().toLocaleString() })} · {t("checkedEvery")}
      </p>
    </PageLayout>
  );
}

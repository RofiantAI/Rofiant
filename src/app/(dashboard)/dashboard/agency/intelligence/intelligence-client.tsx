"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  AlertTriangle,
  Radio,
  CheckCircle2,
  Info,
  XCircle,
  MapPin,
  Clock,
} from "lucide-react";
import { IntelAnalytics } from "./intel-analytics";
import {
  DashboardPage,
  DashboardHeader,
  DashboardList,
  DashboardAlert,
} from "@/components/dashboard/ui/page-shell";

type IntelEvent = {
  id: string;
  source: string;
  source_id: string | null;
  event_type: string;
  severity: "low" | "medium" | "high" | "critical";
  location_label: string | null;
  lat: number | null;
  lng: number | null;
  confidence: number | null;
  summary: string;
  image_url: string | null;
  resolved_at: string | null;
  created_at: string;
};

const severityIcons = {
  critical: XCircle,
  high: AlertTriangle,
  medium: Info,
  low: CheckCircle2,
};

const severityColors = {
  critical: "text-red-400 border-red-400/30 bg-red-400/10",
  high: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  low: "text-foreground-muted border-border bg-background-tertiary",
};

function SeverityBadge({ severity }: { severity: IntelEvent["severity"] }) {
  const t = useTranslations("dashboard.agency.intelligence");
  const color = severityColors[severity] ?? severityColors.low;
  return (
    <span
      className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 border ${color}`}
    >
      {t(`severity.${severity}`)}
    </span>
  );
}

function EventRow({ event, isNew }: { event: IntelEvent; isNew: boolean }) {
  const t = useTranslations("dashboard.agency.intelligence");
  const Icon = severityIcons[event.severity] ?? severityIcons.low;
  const color = severityColors[event.severity] ?? severityColors.low;
  const time = new Date(event.created_at);

  return (
    <div
      className={`flex gap-4 px-5 py-4 border-b border-border transition-colors duration-1000 ${
        isNew ? "bg-accent-primary/5" : ""
      }`}
    >
      <div className="mt-0.5 shrink-0">
        <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-1">
          <p className="text-sm text-foreground leading-snug">
            {event.summary}
          </p>
          <SeverityBadge severity={event.severity} />
        </div>
        <div className="flex items-center gap-3 flex-wrap text-[11px] text-foreground-muted">
          <span className="uppercase tracking-wider">{event.source}</span>
          {event.source_id && <span>#{event.source_id}</span>}
          {event.location_label && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {event.location_label}
            </span>
          )}
          {event.confidence != null && (
            <span>{t("event.confidence", { percent: Math.round(event.confidence * 100) })}</span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {time.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
        {event.image_url && (
          <img
            src={event.image_url}
            alt={t("event.imageAlt")}
            className="mt-3 max-h-40 border border-border object-cover"
          />
        )}
      </div>
    </div>
  );
}

export function IntelligenceClient({
  agencyId,
  initial,
}: {
  agencyId: string;
  initial: IntelEvent[];
}) {
  const t = useTranslations("dashboard.agency.intelligence");
  const [events, setEvents] = useState<IntelEvent[]>(initial);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [live, setLive] = useState(false);
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`intelligence:${agencyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "intelligence_events",
          filter: `agency_id=eq.${agencyId}`,
        },
        (payload) => {
          const ev = payload.new as IntelEvent;
          setEvents((prev) => [ev, ...prev].slice(0, 200));
          setNewIds((prev) => new Set(prev).add(ev.id));
          setTimeout(() => {
            setNewIds((prev) => {
              const next = new Set(prev);
              next.delete(ev.id);
              return next;
            });
          }, 3000);
        },
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [agencyId]);

  const critical = events.filter(
    (e) => e.severity === "critical" && !e.resolved_at,
  ).length;
  const high = events.filter(
    (e) => e.severity === "high" && !e.resolved_at,
  ).length;

  return (
    <DashboardPage>
      <DashboardHeader title={t("title")} />

      {(critical > 0 || high > 0) && (
        <div className="flex flex-wrap gap-3">
          {critical > 0 && (
            <DashboardAlert variant="error">
              <span className="inline-flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                {t("criticalUnresolved", { count: critical })}
              </span>
            </DashboardAlert>
          )}
          {high > 0 && (
            <DashboardAlert variant="warning">
              <span className="inline-flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {t("highPriority", { count: high })}
              </span>
            </DashboardAlert>
          )}
        </div>
      )}

      <IntelAnalytics events={events} />

      <DashboardList>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <span className="text-sm font-medium text-foreground">
            {t("feed.title", { count: events.length })}
          </span>
        </div>
        {events.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Radio className="w-6 h-6 text-foreground-muted mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">{t("feed.emptyTitle")}</p>
            <p className="text-sm text-foreground-secondary mt-1">
              {t.rich("feed.emptyDescription", {
                endpoint: "/api/intelligence",
                code: (chunks) => <code className="font-mono text-xs">{chunks}</code>,
              })}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {events.map((ev) => (
              <EventRow key={ev.id} event={ev} isNew={newIds.has(ev.id)} />
            ))}
          </div>
        )}
      </DashboardList>
    </DashboardPage>
  );
}

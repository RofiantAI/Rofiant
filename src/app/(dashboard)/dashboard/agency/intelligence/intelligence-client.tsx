"use client";

import { useEffect, useRef, useState } from "react";
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

const severityConfig = {
  critical: {
    label: "Critical",
    icon: XCircle,
    color: "text-red-400 border-red-400/30 bg-red-400/10",
  },
  high: {
    label: "High",
    icon: AlertTriangle,
    color: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  },
  medium: {
    label: "Medium",
    icon: Info,
    color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  },
  low: {
    label: "Low",
    icon: CheckCircle2,
    color: "text-foreground-muted border-border bg-background-tertiary",
  },
};

function SeverityBadge({ severity }: { severity: IntelEvent["severity"] }) {
  const { label, color } = severityConfig[severity] ?? severityConfig.low;
  return (
    <span
      className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 border ${color}`}
    >
      {label}
    </span>
  );
}

function EventRow({ event, isNew }: { event: IntelEvent; isNew: boolean }) {
  const cfg = severityConfig[event.severity] ?? severityConfig.low;
  const Icon = cfg.icon;
  const time = new Date(event.created_at);

  return (
    <div
      className={`flex gap-4 px-5 py-4 border-b border-border transition-colors duration-1000 ${
        isNew ? "bg-accent-primary/5" : ""
      }`}
    >
      <div className="mt-0.5 shrink-0">
        <Icon className={`w-4 h-4 ${cfg.color.split(" ")[0]}`} />
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
            <span>{Math.round(event.confidence * 100)}% confidence</span>
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
            alt="Intel frame"
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
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-normal text-foreground">
            Intelligence Feed
          </h1>
        </div>{" "}
      </div>

      {/* Summary strip */}
      {(critical > 0 || high > 0) && (
        <div className="flex gap-4 mb-6">
          {critical > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 border border-red-400/30 bg-red-400/10 text-red-400">
              <XCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {critical} critical unresolved
              </span>
            </div>
          )}
          {high > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 border border-orange-400/30 bg-orange-400/10 text-orange-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">{high} high priority</span>
            </div>
          )}
        </div>
      )}

      <IntelAnalytics events={events} />

      {/* Feed */}
      <div className="border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted">
            Events — last {events.length}
          </span>
        </div>
        {events.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Radio className="w-6 h-6 text-foreground-muted mx-auto mb-3" />
            <p className="text-sm text-foreground-secondary">
              Waiting for data from your program…
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              POST to <code className="font-mono">/api/intelligence</code> to
              push events
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {events.map((ev) => (
              <EventRow key={ev.id} event={ev} isNew={newIds.has(ev.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

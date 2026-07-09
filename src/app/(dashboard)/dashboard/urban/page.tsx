"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Car,
  Users,
  RefreshCw,
  Radio,
  MapPin,
  TrendingUp,
  Eye,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DashboardPage,
  DashboardHeader,
  DashboardCard,
  DashboardMetricGrid,
  DashboardMetric,
  DashboardList,
  DashboardEmptyState,
  DashboardAlert,
  DashboardPrimaryButton,
  DashboardSecondaryButton,
} from "@/components/dashboard/ui/page-shell";
import { SkeletonListRows } from "@/components/ui/skeleton";

type Detection = {
  id: string;
  camera_id: string;
  main_road: string;
  cross_street: string;
  cars: number;
  people: number;
  trucks: number;
  motorcycles: number;
  buses: number;
  total_vehicles: number;
  total_objects: number;
  anomaly_count: number;
  anomaly_types: string[];
  image_url: string;
  created_at: string;
};

type Stats = {
  rows_analyzed: number;
  cameras_seen: number;
  total_cars: number;
  total_people: number;
  total_trucks: number;
  total_motorcycles: number;
  total_anomalies: number;
  avg_cars_per_camera: number;
  avg_people_per_camera: number;
};

type Health = {
  status: string;
  cameras: number;
  scan_running: boolean;
  last_scan_at: string | null;
  model: string;
};

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return <DashboardMetric label={label} value={String(value)} sub={sub} icon={icon} />;
}

function SeverityBadge({ type }: { type: string }) {
  const t = useTranslations("dashboard.urban");
  const colors: Record<string, string> = {
    TRAFFIC_JAM: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    LARGE_CROWD: "text-red-400 bg-red-400/10 border-red-400/20",
    EMPTY_ROAD: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  };
  return (
    <span
      className={`px-1.5 py-0.5 text-[10px] font-medium border ${colors[type] ?? "text-foreground-muted border-border"}`}
    >
      {t.has(`anomalyTypes.${type}`) ? t(`anomalyTypes.${type}`) : type.replace("_", " ")}
    </span>
  );
}

function relTime(iso: string, t: ReturnType<typeof useTranslations>) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return t("list.justNow");
  if (m < 60) return t("list.minutesAgo", { count: m });
  return t("list.hoursAgo", { count: Math.floor(m / 60) });
}

export default function UrbanAIPage() {
  const t = useTranslations("dashboard.urban");
  const [health, setHealth] = useState<Health | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [liveEvents, setLiveEvents] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [tab, setTab] = useState<"detections" | "anomalies" | "live">(
    "detections",
  );
  const [serviceDown, setServiceDown] = useState(false);
  const [lightbox, setLightbox] = useState<Detection | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [healthRes, statsRes, detectRes] = await Promise.all([
        fetch("/api/urban?action=health"),
        fetch("/api/urban?action=stats"),
        fetch("/api/urban?action=detections&limit=100"),
      ]);
      if (!healthRes.ok) {
        setServiceDown(true);
        return;
      }
      setServiceDown(false);
      const [h, s, d] = await Promise.all([
        healthRes.json(),
        statsRes.json(),
        detectRes.json(),
      ]);
      setHealth(h);
      setStats(s.rows_analyzed ? s : null);
      setDetections(d.detections ?? []);
    } catch {
      setServiceDown(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // SSE for live events
    const es = new EventSource("/api/urban/stream");
    esRef.current = es;
    es.addEventListener("detection", (e) => {
      const data = JSON.parse(e.data) as Detection;
      setLiveEvents((prev) => [data, ...prev].slice(0, 50));
    });
    return () => es.close();
  }, [fetchData]);

  async function triggerScan(max?: number) {
    setScanError("");
    setScanning(true);
    try {
      const res = await fetch("/api/urban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_cameras: max }),
      });
      const data = await res.json();
      if (!res.ok) setScanError(data.error ?? t("banners.scanFailed"));
      else setTimeout(fetchData, 5000);
    } catch {
      setScanError(t("banners.serviceUnavailable"));
    } finally {
      setScanning(false);
    }
  }

  const anomalyDetections = detections.filter((d) => d.anomaly_count > 0);
  const activeList =
    tab === "anomalies"
      ? anomalyDetections
      : tab === "live"
        ? liveEvents
        : detections;

  return (
    <DashboardPage>
      <DashboardHeader
        title={t("header.title")}
        action={
          <div className="flex items-center gap-2">
            <DashboardSecondaryButton onClick={fetchData}>
              <RefreshCw className="w-3.5 h-3.5" />
              {t("header.refresh")}
            </DashboardSecondaryButton>
            <DashboardPrimaryButton
              onClick={() => triggerScan(20)}
              disabled={scanning || health?.scan_running}
            >
              <Radio className="w-3.5 h-3.5" />
              {scanning || health?.scan_running ? t("header.scanning") : t("header.runScan")}
            </DashboardPrimaryButton>
          </div>
        }
      />

      {serviceDown && (
        <DashboardAlert variant="error">
          {t("banners.serviceDown")}{" "}
          <code className="font-mono text-xs bg-red-500/10 px-1 rounded">
            cd ~/Desktop/rofiant && python urban_ai.py
          </code>
        </DashboardAlert>
      )}

      {scanError && <DashboardAlert variant="error">{scanError}</DashboardAlert>}

      {/* Health strip */}
      {health && (
        <div className="flex items-center gap-4 mb-6 text-xs text-foreground-muted">
          <span
            className={`flex items-center gap-1.5 ${health.status === "ok" ? "text-accent-success" : "text-red-400"}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${health.status === "ok" ? "bg-accent-success" : "bg-red-400"}`}
            />
            {t("health.serviceStatus", { status: health.status })}
          </span>
          <span>
            {t("health.model")}{" "}
            <span className="text-foreground font-mono">{health.model}</span>
          </span>
          {health.last_scan_at && (
            <span>
              {t("health.lastScan")}{" "}
              <span className="text-foreground">
                {relTime(health.last_scan_at, t)}
              </span>
            </span>
          )}
          {health.scan_running && (
            <span className="text-accent-primary">
              {t("health.scanning")}
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <DashboardMetricGrid>
          <StatCard icon={Eye} label={t("stats.camerasSeen.label")} value={stats.cameras_seen} sub={t("stats.camerasSeen.sub")} />
          <StatCard icon={Car} label={t("stats.cars.label")} value={stats.total_cars.toLocaleString()} sub={t("stats.cars.sub", { avg: stats.avg_cars_per_camera })} />
          <StatCard icon={Car} label={t("stats.trucks.label")} value={(stats.total_trucks ?? 0).toLocaleString()} sub={t("stats.trucks.sub")} />
          <StatCard icon={Users} label={t("stats.people.label")} value={stats.total_people.toLocaleString()} sub={t("stats.people.sub", { avg: stats.avg_people_per_camera })} />
          <StatCard icon={AlertTriangle} label={t("stats.anomalies.label")} value={stats.total_anomalies} sub={t("stats.anomalies.sub")} />
        </DashboardMetricGrid>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-6">
        {(
          [
            {
              id: "detections",
              label: t("tabs.detections"),
              count: detections.length,
            },
            {
              id: "anomalies",
              label: t("tabs.anomalies"),
              count: anomalyDetections.length,
            },
            { id: "live", label: t("tabs.live"), count: liveEvents.length },
          ] as const
        ).map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === id
                ? "border-accent-primary text-foreground"
                : "border-transparent text-foreground-muted hover:text-foreground"
            }`}
          >
            {label}
            {count > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-background-tertiary text-foreground-muted text-[10px] font-mono">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Detection list */}
      {loading ? (
        <DashboardList>
          <SkeletonListRows rows={6} />
        </DashboardList>
      ) : activeList.length === 0 ? (
        <DashboardEmptyState
          icon={Activity}
          title={tab === "live" ? t("list.emptyLive") : t("list.emptyDefault")}
        />
      ) : (
        <DashboardList>
          <div className="grid grid-cols-[56px_2fr_1fr_1fr_1fr_1fr_1fr_2fr] gap-3 px-4 py-2.5 border-b border-border bg-background-secondary">
            {[
              "",
              t("list.columns.location"),
              t("list.columns.cars"),
              t("list.columns.trucks"),
              t("list.columns.motos"),
              t("list.columns.people"),
              t("list.columns.anomalies"),
              t("list.columns.time"),
            ].map((h) => (
              <span key={h || "thumb"} className="text-xs font-medium text-foreground-muted">
                {h}
              </span>
            ))}
          </div>
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {activeList.map((d, i) => (
              <div
                key={d.id ?? `${d.camera_id}-${d.created_at ?? i}`}
                onClick={() => d.image_url && setLightbox(d)}
                className={`grid grid-cols-[56px_2fr_1fr_1fr_1fr_1fr_1fr_2fr] gap-3 px-4 py-2.5 items-center transition-colors ${
                  d.anomaly_count > 0 ? "border-l-2 border-l-orange-400/60" : ""
                } ${d.image_url ? "cursor-pointer hover:bg-background-tertiary" : "hover:bg-background-tertiary/50"}`}
              >
                {/* Thumbnail */}
                <div className="w-14 h-10 shrink-0 bg-background-tertiary border border-border overflow-hidden">
                  {d.image_url ? (
                    <img
                      src={d.image_url}
                      alt={`cam ${d.camera_id}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Eye className="w-3 h-3 text-foreground-muted opacity-40" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-foreground truncate font-medium">
                    {d.main_road}
                  </div>
                  <div className="text-[11px] text-foreground-muted truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    {d.cross_street} · {t("list.camLabel", { id: d.camera_id })}
                  </div>
                </div>
                <span className="text-sm font-mono text-foreground">
                  {d.cars ?? 0}
                </span>
                <span className="text-sm font-mono text-foreground">
                  {d.trucks ?? 0}
                </span>
                <span className="text-sm font-mono text-foreground">
                  {d.motorcycles ?? 0}
                </span>
                <span className="text-sm font-mono text-foreground">
                  {d.people ?? 0}
                </span>
                <div className="flex flex-wrap gap-1">
                  {d.anomaly_count === 0 ? (
                    <span className="text-[10px] text-foreground-muted">—</span>
                  ) : (
                    (d.anomaly_types ?? []).map((at) => (
                      <SeverityBadge key={at} type={at} />
                    ))
                  )}
                </div>
                <span className="text-xs text-foreground-muted font-mono">
                  {d.created_at ? relTime(d.created_at, t) : t("list.live")}
                </span>
              </div>
            ))}
          </div>
        </DashboardList>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-card border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <span className="text-sm font-medium text-foreground">
                  {lightbox.main_road}
                </span>
                <span className="text-xs text-foreground-muted ml-2">
                  {lightbox.cross_street} · {t("lightbox.camLabel", { id: lightbox.camera_id })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-foreground-muted">
                <span>
                  {t("lightbox.summary", {
                    cars: lightbox.cars,
                    trucks: lightbox.trucks ?? 0,
                    motos: lightbox.motorcycles ?? 0,
                    people: lightbox.people,
                  })}
                </span>
                {(lightbox.anomaly_types ?? []).map((at) => (
                  <SeverityBadge key={at} type={at} />
                ))}
                <button
                  onClick={() => setLightbox(null)}
                  className="ml-2 text-foreground-muted hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <img
              src={lightbox.image_url}
              alt={`Camera ${lightbox.camera_id} annotated`}
              className="w-full max-h-[70vh] object-contain bg-black"
            />
            <div className="px-4 py-2 text-[11px] text-foreground-muted flex items-center gap-4">
              <span>
                {t("lightbox.captured", {
                  time: lightbox.created_at ? relTime(lightbox.created_at, t) : t("list.live"),
                })}
              </span>
              <a
                href={lightbox.image_url}
                target="_blank"
                rel="noreferrer"
                className="text-accent-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {t("lightbox.openFullSize")}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Trend summary */}
      {stats && (
        <DashboardMetricGrid>
          <DashboardMetric
            label={t("trends.anomalyRate.title")}
            value={stats.rows_analyzed > 0 ? `${((stats.total_anomalies / stats.rows_analyzed) * 100).toFixed(1)}%` : "—"}
            sub={t("trends.anomalyRate.sub")}
            icon={TrendingUp}
          />
          <DashboardMetric
            label={t("trends.busiestType.title")}
            value={t("trends.busiestType.vehicles")}
            sub={t("trends.busiestType.sub", { cars: stats.total_cars.toLocaleString(), readings: stats.rows_analyzed })}
            icon={Car}
          />
          <DashboardMetric
            label={t("trends.coverage.title")}
            value={String(health?.cameras ?? "—")}
            sub={t("trends.coverage.sub")}
            icon={Activity}
          />
        </DashboardMetricGrid>
      )}
    </DashboardPage>
  );
}

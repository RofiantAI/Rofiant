"use client";

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
import { useCallback, useEffect, useRef, useState } from "react";

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
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-card border border-border px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-foreground-muted" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted">
          {label}
        </span>
      </div>
      <div className="text-2xl font-light font-mono text-foreground">
        {value}
      </div>
      {sub && <div className="text-xs text-foreground-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function SeverityBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    TRAFFIC_JAM: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    LARGE_CROWD: "text-red-400 bg-red-400/10 border-red-400/20",
    EMPTY_ROAD: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  };
  return (
    <span
      className={`px-1.5 py-0.5 text-[10px] font-medium border ${colors[type] ?? "text-foreground-muted border-border"}`}
    >
      {type.replace("_", " ")}
    </span>
  );
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function UrbanAIPage() {
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
      if (!res.ok) setScanError(data.error ?? "Scan failed");
      else setTimeout(fetchData, 5000);
    } catch {
      setScanError("Service unavailable");
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
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-normal text-foreground">
            Urban AI Monitor
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="h-8 px-3 text-xs border border-border text-foreground-secondary hover:text-foreground hover:bg-background-tertiary transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={() => triggerScan(20)}
            disabled={scanning || health?.scan_running}
            className="h-8 px-3 text-xs font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5" />
            {scanning || health?.scan_running
              ? "Scanning…"
              : "Run scan (20 cameras)"}
          </button>
        </div>
      </div>

      {/* Service down banner */}
      {serviceDown && (
        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          Urban AI service is not reachable. Start it with:{" "}
          <code className="font-mono text-xs bg-red-500/10 px-1">
            cd ~/Desktop/rofiant && python urban_ai.py
          </code>
        </div>
      )}

      {scanError && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {scanError}
        </div>
      )}

      {/* Health strip */}
      {health && (
        <div className="flex items-center gap-4 mb-6 text-xs text-foreground-muted">
          <span
            className={`flex items-center gap-1.5 ${health.status === "ok" ? "text-accent-success" : "text-red-400"}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${health.status === "ok" ? "bg-accent-success" : "bg-red-400"}`}
            />
            Service {health.status}
          </span>
          <span>
            Model:{" "}
            <span className="text-foreground font-mono">{health.model}</span>
          </span>
          {health.last_scan_at && (
            <span>
              Last scan:{" "}
              <span className="text-foreground">
                {relTime(health.last_scan_at)}
              </span>
            </span>
          )}
          {health.scan_running && (
            <span className="text-accent-primary animate-pulse">
              ● Scanning…
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={Eye}
            label="Cameras seen"
            value={stats.cameras_seen}
            sub="in last 500 records"
          />
          <StatCard
            icon={Car}
            label="Cars"
            value={stats.total_cars.toLocaleString()}
            sub={`avg ${stats.avg_cars_per_camera}/camera`}
          />
          <StatCard
            icon={Car}
            label="Trucks"
            value={(stats.total_trucks ?? 0).toLocaleString()}
            sub="heavy vehicles"
          />
          <StatCard
            icon={Users}
            label="People"
            value={stats.total_people.toLocaleString()}
            sub={`avg ${stats.avg_people_per_camera}/camera`}
          />
          <StatCard
            icon={AlertTriangle}
            label="Anomalies"
            value={stats.total_anomalies}
            sub="across all scans"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-6">
        {(
          [
            {
              id: "detections",
              label: "All detections",
              count: detections.length,
            },
            {
              id: "anomalies",
              label: "Anomalies",
              count: anomalyDetections.length,
            },
            { id: "live", label: "Live stream", count: liveEvents.length },
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
        <div className="bg-card border border-border p-8 text-center text-sm text-foreground-muted">
          Loading…
        </div>
      ) : activeList.length === 0 ? (
        <div className="bg-card border border-border p-12 text-center">
          <Activity className="w-6 h-6 text-foreground-muted mx-auto mb-3" />
          <p className="text-sm text-foreground-secondary">
            {tab === "live"
              ? "Waiting for live events…"
              : "No data yet. Run a scan to populate."}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border">
          {/* Header */}
          <div className="grid grid-cols-[56px_2fr_1fr_1fr_1fr_1fr_1fr_2fr] gap-3 px-4 py-2.5 border-b border-border bg-background-secondary">
            {[
              "",
              "Location",
              "Cars",
              "Trucks",
              "Motos",
              "People",
              "Anomalies",
              "Time",
            ].map((h) => (
              <span
                key={h}
                className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted"
              >
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
                    {d.cross_street} · cam {d.camera_id}
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
                    (d.anomaly_types ?? []).map((t) => (
                      <SeverityBadge key={t} type={t} />
                    ))
                  )}
                </div>
                <span className="text-xs text-foreground-muted font-mono">
                  {d.created_at ? relTime(d.created_at) : "live"}
                </span>
              </div>
            ))}
          </div>
        </div>
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
                  {lightbox.cross_street} · cam {lightbox.camera_id}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-foreground-muted">
                <span>
                  {lightbox.cars} cars · {lightbox.trucks ?? 0} trucks ·{" "}
                  {lightbox.motorcycles ?? 0} motos · {lightbox.people} people
                </span>
                {(lightbox.anomaly_types ?? []).map((t) => (
                  <SeverityBadge key={t} type={t} />
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
                Captured{" "}
                {lightbox.created_at ? relTime(lightbox.created_at) : "live"}
              </span>
              <a
                href={lightbox.image_url}
                target="_blank"
                rel="noreferrer"
                className="text-accent-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Open full size ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Trend summary */}
      {stats && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-foreground-muted" />
              <span className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
                Anomaly rate
              </span>
            </div>
            <div className="text-2xl font-light font-mono text-foreground">
              {stats.rows_analyzed > 0
                ? `${((stats.total_anomalies / stats.rows_analyzed) * 100).toFixed(1)}%`
                : "—"}
            </div>
            <p className="text-xs text-foreground-muted mt-1">
              of camera readings flagged
            </p>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Car className="w-3.5 h-3.5 text-foreground-muted" />
              <span className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
                Busiest type
              </span>
            </div>
            <div className="text-2xl font-light text-foreground">Vehicles</div>
            <p className="text-xs text-foreground-muted mt-1">
              {stats.total_cars.toLocaleString()} cars across{" "}
              {stats.rows_analyzed} readings
            </p>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-3.5 h-3.5 text-foreground-muted" />
              <span className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
                Coverage
              </span>
            </div>
            <div className="text-2xl font-light font-mono text-foreground">
              {health?.cameras ?? "—"}
            </div>
            <p className="text-xs text-foreground-muted mt-1">
              cameras available to scan
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

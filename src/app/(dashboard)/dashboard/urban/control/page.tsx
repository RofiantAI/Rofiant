"use client";

import { useEffect, useRef, useState } from "react";
import {
  Copy, Check, Save, RefreshCw, Terminal,
  Sliders, Wifi, WifiOff, ChevronDown,
} from "lucide-react";

type Config = {
  datasource_url:    string;
  datasource_auth:   string;
  scan_interval:     number;
  concurrency:       number;
  confidence:        number;
  infer_size:        number;
  model_name:        string;
  crowd_threshold:   number;
  traffic_threshold: number;
};

type LogLine = { ts: string; level: string; msg: string };

const MODELS = ["yolov8n.pt", "yolov8s.pt", "yolov8m.pt", "yolov8l.pt", "yolov8x.pt"];
const INFER_SIZES = [640, 960, 1280];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-foreground-muted">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, type = "text", step }: {
  value: string | number; onChange: (v: string) => void; type?: string; step?: string;
}) {
  return (
    <input
      type={type}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-8 px-3 text-sm bg-background border border-border text-foreground focus:outline-none focus:border-border-light font-mono"
    />
  );
}

function Select({ value, onChange, options }: {
  value: string | number; onChange: (v: string) => void; options: (string | number)[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 px-3 text-sm bg-background border border-border text-foreground focus:outline-none focus:border-border-light appearance-none pr-8"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted pointer-events-none" />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="shrink-0 h-8 px-3 border border-border text-foreground-secondary hover:text-foreground hover:bg-background-tertiary transition-colors inline-flex items-center gap-1.5 text-xs">
      {copied ? <Check className="w-3.5 h-3.5 text-accent-success" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function levelColor(level: string) {
  if (level === "ERROR")   return "text-red-400";
  if (level === "WARNING") return "text-orange-400";
  if (level === "INFO")    return "text-foreground-secondary";
  return "text-foreground-muted";
}

export default function UrbanControlPage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [config, setConfig] = useState<Config | null>(null);
  const [draft, setDraft] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [serviceUp, setServiceUp] = useState<boolean | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Load API keys list to show the first key for the start command
  useEffect(() => {
    fetch("/api/api-keys")
      .then((r) => r.json())
      .then((keys) => {
        if (Array.isArray(keys) && keys.length > 0) {
          setApiKey(keys[0].key_prefix + "…  (use full key)");
        }
      })
      .catch(() => {});
  }, []);

  // Load config
  useEffect(() => {
    fetch("/api/urban/config")
      .then((r) => r.json())
      .then((d) => { setConfig(d); setDraft(d); })
      .catch(() => {});
  }, []);

  // Check if service is up
  useEffect(() => {
    fetch("/api/urban?action=health")
      .then((r) => setServiceUp(r.ok))
      .catch(() => setServiceUp(false));
  }, []);

  function fetchLogs() {
    setLogsLoading(true);
    fetch("/api/urban?action=logs")
      .then((r) => r.json())
      .then((d) => { setLogs(d.logs ?? []); })
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }

  useEffect(() => { fetchLogs(); }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  function set<K extends keyof Config>(k: K, v: Config[K]) {
    setDraft((prev) => prev ? { ...prev, [k]: v } : null);
  }

  async function save() {
    if (!draft) return;
    setSaving(true); setSaveError(""); setSaved(false);
    try {
      const res = await fetch("/api/urban/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setSaveError(e.error ?? "Save failed");
      } else {
        const updated = await res.json();
        setConfig(updated); setDraft(updated); setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch { setSaveError("Network error"); }
    finally { setSaving(false); }
  }

  const startCmd = `ROFIANT_API_KEY=rofiant_sk_YOUR_KEY python urban_ai.py`;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-normal text-foreground">Urban AI — Control Panel</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Configure the Python service and monitor its activity from here.
        </p>
      </div>

      {/* Service status */}
      <div className={`flex items-center gap-2 mb-6 px-4 py-3 border text-sm ${
        serviceUp === true
          ? "bg-green-500/5 border-green-500/20 text-green-400"
          : serviceUp === false
            ? "bg-red-500/5 border-red-500/20 text-red-400"
            : "bg-background-secondary border-border text-foreground-muted"
      }`}>
        {serviceUp === true
          ? <><Wifi className="w-3.5 h-3.5" /> Service is running</>
          : serviceUp === false
            ? <><WifiOff className="w-3.5 h-3.5" /> Service is not running — see start command below</>
            : <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking…</>}
      </div>

      {/* ── Setup ── */}
      <section className="mb-8">
        <h2 className="text-xs font-medium uppercase tracking-widest text-foreground-muted mb-4">
          Start the service
        </h2>
        <div className="bg-card border border-border p-5 space-y-4">
          <div>
            <p className="text-sm text-foreground-secondary mb-3">
              1. Go to <a href="/dashboard/api-keys" className="text-accent-primary hover:underline">API Keys</a> and create a key, then copy it.
            </p>
            <p className="text-sm text-foreground-secondary mb-3">
              2. Run this command in your terminal (replace with your full key):
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-background border border-border text-xs font-mono text-foreground-secondary overflow-x-auto whitespace-nowrap">
                {startCmd}
              </code>
              <CopyButton text={startCmd} />
            </div>
          </div>
          <p className="text-xs text-foreground-muted">
            The service reads all other settings (data source, scan interval, model, thresholds) from this
            page automatically — no editing config files needed.
          </p>
        </div>
      </section>

      {/* ── Settings ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-medium uppercase tracking-widest text-foreground-muted flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5" /> Settings
          </h2>
          {draft && config && JSON.stringify(draft) !== JSON.stringify(config) && (
            <span className="text-[10px] text-foreground-muted">Unsaved changes</span>
          )}
        </div>

        {draft ? (
          <div className="bg-card border border-border p-5 space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <Field label="Camera data source URL" hint="CSV or JSON API. Leave blank for bundled Toronto TMC cameras.">
                <Input value={draft.datasource_url}
                  onChange={(v) => set("datasource_url", v)} />
              </Field>
              <Field label="Data source auth key" hint="Bearer token if the source requires auth.">
                <Input value={draft.datasource_auth}
                  onChange={(v) => set("datasource_auth", v)} />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <Field label="Scan interval (seconds)" hint="How often the service scans all cameras.">
                <Input type="number" value={draft.scan_interval}
                  onChange={(v) => set("scan_interval", Number(v))} />
              </Field>
              <Field label="Concurrency" hint="Parallel camera requests per scan.">
                <Input type="number" value={draft.concurrency}
                  onChange={(v) => set("concurrency", Number(v))} />
              </Field>
              <Field label="Confidence threshold" hint="Lower = more detections, more false positives.">
                <Input type="number" step="0.05" value={draft.confidence}
                  onChange={(v) => set("confidence", Number(v))} />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <Field label="YOLO model" hint="Larger = more accurate but slower.">
                <Select value={draft.model_name} options={MODELS}
                  onChange={(v) => set("model_name", v)} />
              </Field>
              <Field label="Inference size (px)" hint="Image size fed to YOLO. 1280 is best for traffic cams.">
                <Select value={draft.infer_size} options={INFER_SIZES}
                  onChange={(v) => set("infer_size", Number(v))} />
              </Field>
              <Field label="Crowd threshold" hint="People count that triggers LARGE_CROWD anomaly.">
                <Input type="number" value={draft.crowd_threshold}
                  onChange={(v) => set("crowd_threshold", Number(v))} />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <Field label="Traffic threshold" hint="Car count that triggers TRAFFIC_JAM anomaly.">
                <Input type="number" value={draft.traffic_threshold}
                  onChange={(v) => set("traffic_threshold", Number(v))} />
              </Field>
            </div>

            {saveError && (
              <p className="text-xs text-red-400">{saveError}</p>
            )}

            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <button
                onClick={save}
                disabled={saving}
                className="h-8 px-4 text-xs font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
              >
                {saved
                  ? <><Check className="w-3.5 h-3.5" /> Saved</>
                  : saving
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                    : <><Save className="w-3.5 h-3.5" /> Save settings</>}
              </button>
              <p className="text-xs text-foreground-muted">
                The running service picks up changes within {draft.scan_interval}s automatically.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border p-8 text-center text-sm text-foreground-muted">
            Loading settings…
          </div>
        )}
      </section>

      {/* ── Logs ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-medium uppercase tracking-widest text-foreground-muted flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5" /> Service logs
          </h2>
          <button
            onClick={fetchLogs}
            disabled={logsLoading}
            className="h-7 px-2.5 text-xs border border-border text-foreground-secondary hover:text-foreground hover:bg-background-tertiary transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${logsLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="bg-card border border-border">
          {serviceUp === false ? (
            <div className="p-8 text-center text-sm text-foreground-muted">
              Service is not running — logs will appear here once started.
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-foreground-muted">
              {logsLoading ? "Loading logs…" : "No logs yet."}
            </div>
          ) : (
            <div className="font-mono text-[11px] max-h-[480px] overflow-y-auto p-3 space-y-0.5">
              {logs.map((l, i) => (
                <div key={i} className="flex gap-3 leading-5">
                  <span className="text-foreground-muted shrink-0 tabular-nums">
                    {l.ts ? new Date(l.ts).toLocaleTimeString() : ""}
                  </span>
                  <span className={`shrink-0 w-14 ${levelColor(l.level)}`}>{l.level}</span>
                  <span className="text-foreground-secondary break-all">{l.msg}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

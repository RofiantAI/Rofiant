import type { ChatMode } from "./chat-agents";

export type ChatSettings = {
  model: string;
  customInstructions: string;
  contextLimit: number;
  knowledgeBaseId: string;
  enterToSend: boolean;
  autoTitle: boolean;
  fontSize: "sm" | "md" | "lg";
  density: "compact" | "comfortable";
  showTimestamps: boolean;
  responseSound: boolean;
  chatMode: ChatMode;
  activeAgentId: string | null;
};

export const FREE_MODELS = [
  { id: "openai/gpt-oss-20b",                          name: "GPT OSS 20B",      desc: "Fast: great for quick back-and-forth" },
  { id: "llama-3.1-8b-instant",                        name: "Llama 3.1 8B Instant", desc: "Lightest, fastest, best for avoiding rate limits" },
  { id: "qwen/qwen3.6-27b",                            name: "Qwen3.6 27B",     desc: "Supports image uploads for vision tasks" },
] as const;

export const PRO_MODELS = [
  { id: "openai/gpt-oss-120b",     name: "GPT OSS 120B",    desc: "Best for deep thinking and tough problems" },
] as const;

export const ALL_MODELS = [...FREE_MODELS, ...PRO_MODELS];

const FREE_MODEL_IDS: Set<string>  = new Set(FREE_MODELS.map((m) => m.id));
const ALL_MODEL_IDS:  Set<string>  = new Set(ALL_MODELS.map((m) => m.id));

export const DEFAULT_FREE_MODEL = "openai/gpt-oss-20b";
export const DEFAULT_PRO_MODEL  = "openai/gpt-oss-120b";

export const VISION_MODEL_ID = "qwen/qwen3.6-27b";

export function isVisionModel(id: string): boolean {
  return id === VISION_MODEL_ID;
}

export const DEFAULT_SETTINGS: ChatSettings = {
  model: DEFAULT_FREE_MODEL,
  customInstructions: "",
  contextLimit: 20,
  knowledgeBaseId: "",
  enterToSend: true,
  autoTitle: true,
  fontSize: "md",
  density: "comfortable",
  showTimestamps: false,
  responseSound: false,
  chatMode: "ask",
  activeAgentId: null,
};

const KEY = "chat_settings";

export function defaultModelForPlan(isPro: boolean) {
  return isPro ? DEFAULT_PRO_MODEL : DEFAULT_FREE_MODEL;
}

export function clampModelForPlan(model: string, isPro: boolean): string {
  if (!ALL_MODEL_IDS.has(model)) return defaultModelForPlan(isPro);
  if (!isPro && !FREE_MODEL_IDS.has(model)) return DEFAULT_FREE_MODEL;
  return model;
}

export function loadSettings(isPro = false): ChatSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS, model: defaultModelForPlan(isPro) };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS, model: defaultModelForPlan(isPro) };
    const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    parsed.model = clampModelForPlan(parsed.model, isPro);
    return parsed;
  } catch {
    return { ...DEFAULT_SETTINGS, model: defaultModelForPlan(isPro) };
  }
}

export function saveSettings(s: ChatSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function playDoneSound() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.3);
  } catch {}
}

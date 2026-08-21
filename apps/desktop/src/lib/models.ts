// All free OpenRouter tiers (":free" suffix). See openrouter.ai/collections/free-models.
// Nemotron Omni stays default: confirmed tool-call + image support (backend/app/config.py).
export const FREE_MODELS = [
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", label: "Nemotron Omni", logo: "/nvidia.svg" },
  { id: "nvidia/nemotron-3-super-120b-a12b:free", label: "Nemotron Super", logo: "/nvidia.svg" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "Nemotron Ultra", logo: "/nvidia.svg" },
  { id: "openai/gpt-oss-20b:free", label: "GPT-OSS 20B", logo: "/chatgpt.svg" },
];

// Only offered once the user's Claude account is connected. These run on
// their own subscription quota, not the app's.
export const CLAUDE_MODELS = [
  { id: "claude-opus-5", label: "Claude Opus 5", logo: "/claude.svg" },
  { id: "claude-sonnet-5", label: "Claude Sonnet 5", logo: "/claude.svg" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", logo: "/claude.svg" },
];

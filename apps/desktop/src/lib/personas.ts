// Bot personas. `id` must match a key in backend/app/agent/prompts.py
// (PERSONAS) — that's where the actual system-prompt text lives; this file is
// only what the picker shows. `color`/`shape` drive PersonaFace.
export const PERSONAS = [
  {
    id: "agent",
    name: "Agent",
    tagline: "General-purpose. Chats, edits files, runs commands.",
    color: "#3dbb9a",
    shape: "circle",
  },
  {
    id: "builder",
    name: "Builder",
    tagline: "Does the work with tools instead of describing it.",
    color: "#f0a02a",
    shape: "circle",
  },
  {
    id: "reviewer",
    name: "Reviewer",
    tagline: "Reads and critiques. Won't edit unless you ask.",
    color: "#6b5cf6",
    shape: "triangle",
  },
  {
    id: "explainer",
    name: "Explainer",
    tagline: "Teaches it step by step instead of just solving it.",
    color: "#9b5cf6",
    shape: "leaf",
  },
  {
    id: "duck",
    name: "Rubber Duck",
    tagline: "Asks the questions until you spot it yourself.",
    color: "#3b82f6",
    shape: "circle",
  },
] as const;

export type Persona = (typeof PERSONAS)[number];

export const DEFAULT_PERSONA = "agent";

export function personaFor(id: string | undefined): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}

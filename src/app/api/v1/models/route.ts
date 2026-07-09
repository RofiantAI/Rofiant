import { validateApiKey, apiError } from "@/lib/api-auth";
import { apiRatelimit, enforceRatelimit } from "@/lib/ratelimit";

const MODELS = [
  {
    id: "groq-llama-3.3-70b",
    object: "model",
    created: 1700000000,
    owned_by: "rofiant",
    canonical: "llama-3.3-70b-versatile",
    description: "Fast 70B model — best for complex reasoning and analysis",
  },
  {
    id: "groq-llama-3.1-8b",
    object: "model",
    created: 1700000000,
    owned_by: "rofiant",
    canonical: "llama-3.1-8b-instant",
    description: "Lightweight 8B model — fastest responses",
  },
  {
    id: "groq-mixtral-8x7b",
    object: "model",
    created: 1700000000,
    owned_by: "rofiant",
    canonical: "mixtral-8x7b-32768",
    description: "Mixtral MoE — long context up to 32k tokens",
  },
];

export async function GET(req: Request) {
  const apiKeyUser = await validateApiKey(req.headers.get("authorization"));
  if (!apiKeyUser) return apiError("Invalid or missing API key", 401);

  const limited = await enforceRatelimit(apiRatelimit, apiKeyUser.keyId);
  if (limited) return limited;

  return Response.json({ object: "list", data: MODELS });
}

export const MODEL_RATES: Record<string, { in: number; out: number }> = {
  "llama-3.3-70b-versatile": { in: 0.59, out: 0.79 },
  "llama-3.1-8b-instant": { in: 0.05, out: 0.08 },
  "mixtral-8x7b-32768": { in: 0.24, out: 0.24 },
};

export function estimateModelCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number | null {
  const rate = MODEL_RATES[model];
  if (!rate) return null;
  return (inputTokens * rate.in + outputTokens * rate.out) / 1_000_000;
}

export function formatUsd(cost: number | null): string {
  if (cost === null) return "—";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Public/external API (v1): 60 req / 60 s per API key
export const apiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix: "rl:api",
});

// Auth actions (invite, etc.): 5 req / 60 s per IP
export const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "rl:auth",
});

export async function enforceRatelimit(
  limiter: Ratelimit,
  identifier: string,
): Promise<Response | null> {
  const { success, reset } = await limiter.limit(identifier);
  if (!success) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) },
    });
  }
  return null;
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

const URBAN_AI_URL = process.env.URBAN_AI_URL ?? "http://localhost:8080";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Proxy SSE stream from Python service
  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(`${URBAN_AI_URL}/stream`, {
      signal: req.signal,
      headers: { Accept: "text/event-stream" },
    });
  } catch {
    // Service down — return empty SSE that stays open
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(": service unavailable\n\n"));
        },
      }),
      { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } },
    );
  }

  const body = upstreamRes.body;
  if (!body) return new Response("No stream", { status: 502 });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

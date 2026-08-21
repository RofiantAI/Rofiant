import { supabase } from "@/lib/supabase";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/** Fetch against the FastAPI backend, attaching the user's Supabase JWT. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  // FormData bodies (file uploads) need the browser to set their own
  // multipart boundary in Content-Type, so only default it for JSON bodies.
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }

  return res;
}

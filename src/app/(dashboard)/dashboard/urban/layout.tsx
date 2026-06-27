import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function UrbanLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  if (plan !== "pro" && plan !== "team") redirect("/dashboard");

  return <>{children}</>;
}

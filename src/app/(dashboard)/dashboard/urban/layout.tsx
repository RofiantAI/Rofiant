import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export default async function UrbanLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${routing.defaultLocale}/auth/login`);

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  if (plan !== "agency" && plan !== "enterprise") redirect("/dashboard");

  return <>{children}</>;
}

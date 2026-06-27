import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatSettingsProvider } from "@/contexts/chat-settings-context";
import { ChatShell } from "@/components/chat/chat-shell";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const plan: string = (user.user_metadata?.plan ?? "free" as string).toLowerCase();
  const isPro = plan === "pro" || plan === "team";

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, title, updated_at, pinned")
    .eq("user_id", user.id)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <ChatSettingsProvider isPro={isPro}>
      <ChatShell conversations={conversations ?? []} user={user}>
        {children}
      </ChatShell>
    </ChatSettingsProvider>
  );
}

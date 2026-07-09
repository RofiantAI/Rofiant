import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatSettingsProvider } from "@/contexts/chat-settings-context";
import { ChatShell } from "@/components/chat/chat-shell";
import { AnnouncementBanner } from "@/components/dashboard/announcement-banner";
import { routing } from "@/i18n/routing";
import { getActiveSiteAnnouncements } from "@/lib/site-broadcast";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${routing.defaultLocale}/auth/login`);

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
    redirect(`/${routing.defaultLocale}/auth/mfa`);
  }

  const plan: string = (user.user_metadata?.plan ?? "free" as string).toLowerCase();
  const isPro = plan !== "free";

  const [{ data: conversations }, announcements] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, title, updated_at, pinned")
      .eq("user_id", user.id)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(50),
    getActiveSiteAnnouncements(supabase),
  ]);

  return (
    <ChatSettingsProvider isPro={isPro}>
      <ChatShell conversations={conversations ?? []} user={user}>
        <AnnouncementBanner
          announcements={announcements.map((a) => ({
            id: a.id,
            title: a.title,
            body: a.body,
            variant: a.variant,
          }))}
        />
        {children}
      </ChatShell>
    </ChatSettingsProvider>
  );
}

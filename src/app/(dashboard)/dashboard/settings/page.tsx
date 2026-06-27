import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-normal text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Manage your account, security, and preferences
        </p>
      </div>

      <div className="max-w-3xl">
        <SettingsClient
          email={user?.email ?? ""}
          userId={user?.id ?? ""}
          displayName={user?.user_metadata?.display_name ?? ""}
          bio={user?.user_metadata?.bio ?? ""}
        />
      </div>
    </div>
  );
}

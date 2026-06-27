import { createClient } from "@/lib/supabase/server";
import { APIKeysClient } from "./api-keys-client";
import { Lock, ArrowRight } from "lucide-react";

export default async function APIKeysPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const plan: string = (user?.user_metadata?.plan ?? "free" as string).toLowerCase();
  const isPaid = plan === "pro" || plan === "team";

  if (!isPaid) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-normal text-foreground">API Keys</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Manage keys for programmatic access to Rofiant
          </p>
        </div>

        <div className="border border-border bg-card p-10 flex flex-col items-center text-center max-w-md mx-auto mt-16">
          <div className="flex items-center justify-center w-12 h-12 mb-5 bg-background-tertiary border border-border">
            <Lock className="w-5 h-5 text-foreground-muted" />
          </div>
          <h2 className="text-lg font-normal text-foreground mb-2">
            API access requires a paid plan
          </h2>
          <p className="text-sm text-foreground-secondary mb-8">
            Upgrade to Pro or Team to create API keys and integrate Rofiant into your own applications.
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 h-10 px-6 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            View plans
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return <APIKeysClient />;
}

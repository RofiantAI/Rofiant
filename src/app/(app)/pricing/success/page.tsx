import { CheckCircle, ArrowRight } from "lucide-react";

export default function PricingSuccessPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const plan = searchParams.plan ?? "pro";
  const label = plan === "team" ? "Team" : "Pro";

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-accent-success/10 border border-accent-success/20">
          <CheckCircle className="w-8 h-8 text-accent-success" />
        </div>

        <h1 className="text-3xl font-normal text-foreground mb-3">
          Welcome to {label}
        </h1>
        <p className="text-foreground-secondary mb-10">
          Your subscription is active. Your account has been upgraded — head to the chat to try your new models.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/chat"
            className="inline-flex items-center justify-center gap-2 h-10 px-6 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            Open chat
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center h-10 px-6 text-sm font-medium border border-border text-foreground hover:bg-background-tertiary transition-colors"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

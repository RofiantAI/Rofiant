import { PageLayout } from "@/components/page-layout";

const sections = [
  {
    number: "01",
    title: "Information We Collect",
    content: (
      <>
        <p>
          When you create an account, we collect your email address and a hashed password. When you use the platform, we collect the content of your conversations, API call metadata, and basic usage logs (timestamps, feature interactions, error reports).
        </p>
        <p className="mt-4">
          We use cookies to maintain your session and remember your cookie consent preference. No advertising or tracking cookies are used.
        </p>
      </>
    ),
  },
  {
    number: "02",
    title: "Third-Party Services",
    content: (
      <>
        <p>We rely on the following third-party services to operate:</p>
        <ul className="mt-4 space-y-3">
          {[
            { name: "Supabase", role: "Authentication and database. Stores your account credentials and application data." },
            { name: "Groq", role: "AI inference provider. Your chat messages are transmitted to Groq to generate responses." },
          ].map(({ name, role }) => (
            <li key={name} className="flex gap-4">
              <span className="shrink-0 font-medium text-foreground w-20">{name}</span>
              <span>{role}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          Each provider operates under their own privacy policy and data processing agreements.
        </p>
      </>
    ),
  },
  {
    number: "03",
    title: "How We Use Your Data",
    content: (
      <p>
        We use your data solely to provide and improve the Rofiant platform — authenticating your account, processing your requests, diagnosing errors, and communicating service updates. We do not sell, rent, or share your personal data with third parties beyond the service providers listed above.
      </p>
    ),
  },
  {
    number: "04",
    title: "Data Retention",
    content: (
      <p>
        Your account data is retained for the lifetime of your account. If you delete your account, your personal data is removed within 30 days. Anonymized usage logs may be retained longer for analytics purposes. You can request deletion of your data at any time by contacting us.
      </p>
    ),
  },
  {
    number: "05",
    title: "Security",
    content: (
      <p>
        All data is encrypted in transit (TLS) and at rest. Access to production systems is restricted to authorised personnel. We use Supabase's managed infrastructure, which undergoes independent security audits.
      </p>
    ),
  },
  {
    number: "06",
    title: "Your Rights",
    content: (
      <p>
        You have the right to access, correct, export, or delete your personal data at any time. To exercise any of these rights, email us at{" "}
        <a href="mailto:privacy@rofiant.ca" className="text-foreground underline underline-offset-2 hover:text-foreground-secondary transition-colors">
          privacy@rofiant.ca
        </a>
        . We will respond within 30 days.
      </p>
    ),
  },
  {
    number: "07",
    title: "Contact",
    content: (
      <p>
        Questions or concerns about this policy? Reach us at{" "}
        <a href="mailto:privacy@rofiant.ca" className="text-foreground underline underline-offset-2 hover:text-foreground-secondary transition-colors">
          privacy@rofiant.ca
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PageLayout title="Privacy Policy" subtitle="Last updated June 26, 2026">
      <div className="mt-16 max-w-3xl">
        <div className="divide-y divide-border">
          {sections.map(({ number, title, content }) => (
            <div key={number} className="py-10 grid grid-cols-[4rem_1fr] gap-8">
              <span className="text-xs font-mono text-foreground-muted pt-1">{number}</span>
              <div>
                <h2 className="text-base font-semibold text-foreground tracking-wide mb-4">{title}</h2>
                <div className="text-sm text-foreground-secondary leading-relaxed">{content}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

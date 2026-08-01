import { PageLayout } from "@/components/page-layout";
import { LegalSections } from "@/components/legal/legal-sections";
import { getTranslations } from "next-intl/server";

const emailLink = (chunks: React.ReactNode) => (
  <a
    href="mailto:support@rofiant.ca"
    className="text-foreground underline underline-offset-2 hover:text-foreground-secondary transition-colors"
  >
    {chunks}
  </a>
);

const sections = [
  { key: "s1", kind: "paragraphs" as const, paragraphs: ["para1", "para2", "para3"] },
  { key: "s2", kind: "body" as const },
  {
    key: "s3",
    kind: "list" as const,
    intro: true,
    items: ["account", "content", "documents", "voice", "usage", "billing", "communications", "support"],
    outro: true,
  },
  {
    key: "s4",
    kind: "list" as const,
    intro: true,
    items: ["direct", "automatic", "thirdParty"],
  },
  {
    key: "s5",
    kind: "list" as const,
    intro: true,
    items: ["provide", "secure", "support", "billing", "improve", "comply", "communicate"],
    outro: true,
  },
  {
    key: "s6",
    kind: "list" as const,
    intro: true,
    items: ["contract", "legitimate", "consent", "legal"],
  },
  { key: "s7", kind: "paragraphs" as const, paragraphs: ["para1", "para2", "para3"] },
  {
    key: "s8",
    kind: "providers" as const,
    providers: ["supabase", "groq", "posthog", "sentry", "creem", "resend", "upstash", "cloudflare", "vercel"],
  },
  {
    key: "s9",
    kind: "list" as const,
    intro: true,
    items: ["processors", "legal", "protection", "consent", "business"],
    outro: true,
  },
  { key: "s10", kind: "paragraphs" as const, paragraphs: ["para1", "para2"] },
  {
    key: "s11",
    kind: "list" as const,
    intro: true,
    items: ["account", "content", "logs", "billing", "legal"],
    outro: true,
  },
  {
    key: "s12",
    kind: "list" as const,
    intro: true,
    items: ["encryption", "access", "monitoring", "infrastructure", "incident"],
    outro: true,
  },
  {
    key: "s13",
    kind: "list" as const,
    intro: true,
    items: ["access", "correct", "delete", "export", "restrict", "withdraw", "complaint"],
    outro: true,
  },
  {
    key: "s14",
    kind: "list" as const,
    intro: true,
    items: ["essential", "consent", "analytics"],
    outro: true,
  },
  { key: "s15", kind: "body" as const },
  { key: "s16", kind: "body" as const },
  { key: "s17", kind: "body" as const },
  { key: "s18", kind: "body" as const, rich: true },
];

export default async function PrivacyPolicyPage() {
  const t = await getTranslations("legal.privacyPolicy");

  return (
    <PageLayout title={t("title")} subtitle={t("subtitle")}>
      <div className="mt-16 max-w-3xl">
        <LegalSections namespace="legal.privacyPolicy" sections={sections} link={emailLink} />
      </div>
    </PageLayout>
  );
}

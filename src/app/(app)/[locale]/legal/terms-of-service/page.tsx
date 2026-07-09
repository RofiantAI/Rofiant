import { PageLayout } from "@/components/page-layout";
import { LegalSections } from "@/components/legal/legal-sections";
import { getTranslations } from "next-intl/server";

const legalLink = (chunks: React.ReactNode) => (
  <a
    href="mailto:legal@rofiant.ca"
    className="text-foreground underline underline-offset-2 hover:text-foreground-secondary transition-colors"
  >
    {chunks}
  </a>
);

const sections = [
  { key: "s1", kind: "paragraphs" as const, paragraphs: ["para1", "para2"] },
  {
    key: "s2",
    kind: "list" as const,
    intro: true,
    items: ["age", "authority", "accuracy", "security"],
  },
  { key: "s3", kind: "paragraphs" as const, paragraphs: ["para1", "para2"] },
  {
    key: "s4",
    kind: "list" as const,
    intro: true,
    items: ["credentials", "mfa", "activity", "agency"],
  },
  {
    key: "s5",
    kind: "list" as const,
    intro: true,
    items: [
      "unlawful",
      "harmful",
      "infringe",
      "malware",
      "access",
      "scrape",
      "reverse",
      "overload",
      "impersonate",
      "spam",
      "export",
      "circumvent",
    ],
    outro: true,
  },
  { key: "s6", kind: "paragraphs" as const, paragraphs: ["para1", "para2", "para3"] },
  { key: "s7", kind: "paragraphs" as const, paragraphs: ["para1", "para2", "para3"] },
  { key: "s8", kind: "body" as const },
  { key: "s9", kind: "body" as const },
  {
    key: "s10",
    kind: "list" as const,
    intro: true,
    items: ["plans", "payment", "renewal", "taxes", "refunds", "changes"],
    outro: true,
  },
  { key: "s11", kind: "paragraphs" as const, paragraphs: ["para1", "para2"] },
  { key: "s12", kind: "body" as const },
  { key: "s13", kind: "paragraphs" as const, paragraphs: ["para1", "para2"] },
  { key: "s14", kind: "paragraphs" as const, paragraphs: ["para1", "para2"] },
  { key: "s15", kind: "paragraphs" as const, paragraphs: ["para1", "para2"] },
  { key: "s16", kind: "paragraphs" as const, paragraphs: ["para1", "para2", "para3"] },
  { key: "s17", kind: "paragraphs" as const, paragraphs: ["para1", "para2"] },
  {
    key: "s18",
    kind: "list" as const,
    intro: true,
    items: ["byYou", "byUs", "effect"],
    outro: true,
  },
  { key: "s19", kind: "paragraphs" as const, paragraphs: ["para1", "para2", "para3"] },
  {
    key: "s20",
    kind: "list" as const,
    intro: true,
    items: ["assignment", "severability", "waiver", "entire", "updates"],
  },
  { key: "s21", kind: "body" as const },
  { key: "s22", kind: "body" as const, rich: true },
];

export default async function TermsOfServicePage() {
  const t = await getTranslations("legal.termsOfService");

  return (
    <PageLayout title={t("title")} subtitle={t("subtitle")}>
      <div className="mt-16 max-w-3xl">
        <LegalSections namespace="legal.termsOfService" sections={sections} link={legalLink} />
      </div>
    </PageLayout>
  );
}

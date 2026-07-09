import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

type LinkRenderer = (chunks: ReactNode) => ReactNode;
type Translator = Awaited<ReturnType<typeof getTranslations>>;

type SectionConfig =
  | { key: string; kind: "paragraphs"; paragraphs: string[] }
  | { key: string; kind: "body"; rich?: boolean }
  | {
      key: string;
      kind: "list";
      intro?: boolean;
      items: string[];
      outro?: boolean;
    }
  | {
      key: string;
      kind: "providers";
      providers: string[];
    };

function renderRichOrPlain(
  t: Translator,
  key: string,
  link?: LinkRenderer,
) {
  if (link) {
    return t.rich(key, { link });
  }
  return t(key);
}

function renderParagraphs(
  t: Translator,
  prefix: string,
  paragraphs: string[],
  link?: LinkRenderer,
) {
  return paragraphs.map((suffix) => (
    <p key={suffix} className={suffix === paragraphs[0] ? undefined : "mt-4"}>
      {renderRichOrPlain(t, `${prefix}.${suffix}`, link)}
    </p>
  ));
}

function SectionContent({
  t,
  prefix,
  config,
  link,
}: {
  t: Translator;
  prefix: string;
  config: SectionConfig;
  link?: LinkRenderer;
}) {
  switch (config.kind) {
    case "paragraphs":
      return <>{renderParagraphs(t, prefix, config.paragraphs, link)}</>;
    case "body":
      return (
        <p>
          {config.rich ? renderRichOrPlain(t, `${prefix}.body`, link) : t(`${prefix}.body`)}
        </p>
      );
    case "list":
      return (
        <>
          {config.intro ? <p>{t(`${prefix}.intro`)}</p> : null}
          <ul className={`${config.intro ? "mt-4" : ""} space-y-2 list-disc pl-5`}>
            {config.items.map((item) => (
              <li key={item}>{t(`${prefix}.items.${item}`)}</li>
            ))}
          </ul>
          {config.outro ? (
            <p className="mt-4">{renderRichOrPlain(t, `${prefix}.outro`, link)}</p>
          ) : null}
        </>
      );
    case "providers":
      return (
        <>
          <p>{t(`${prefix}.intro`)}</p>
          <ul className="mt-4 space-y-3">
            {config.providers.map((provider) => (
              <li key={provider} className="flex gap-4">
                <span className="shrink-0 font-medium text-foreground w-28">
                  {t(`${prefix}.providers.${provider}.name`)}
                </span>
                <span>{t(`${prefix}.providers.${provider}.role`)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4">{t(`${prefix}.outro`)}</p>
        </>
      );
  }
}

export async function LegalSections({
  namespace,
  sections,
  link,
}: {
  namespace: "legal.privacyPolicy" | "legal.termsOfService";
  sections: SectionConfig[];
  link?: LinkRenderer;
}) {
  const t = await getTranslations(namespace);

  return (
    <div className="divide-y divide-border">
      {sections.map(({ key, ...config }, index) => (
        <div key={key} className="py-10 grid grid-cols-[4rem_1fr] gap-8">
          <span className="text-xs font-mono text-foreground-muted pt-1">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-wide mb-4">
              {t(`sections.${key}.title`)}
            </h2>
            <div className="text-sm text-foreground-secondary leading-relaxed">
              <SectionContent
                t={t}
                prefix={`sections.${key}`}
                config={{ key, ...config } as SectionConfig}
                link={link}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

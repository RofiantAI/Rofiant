import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";

const codeLines = [
  {
    indent: 0,
    text: "curl -X POST https://api.rofiant.ca/v1/chat/completions \\",
    color: "text-foreground",
  },
  {
    indent: 1,
    text: '-H "Authorization: Bearer sk_..." \\',
    color: "text-foreground-secondary",
  },
  {
    indent: 1,
    text: '-H "Content-Type: application/json" \\',
    color: "text-foreground-secondary",
  },
  { indent: 1, text: "-d '{", color: "text-foreground-secondary" },
  {
    indent: 2,
    text: '"model": "groq-llama-3.3-70b",',
    color: "text-foreground-secondary",
  },
  {
    indent: 2,
    text: '"messages": [{"role": "user",',
    color: "text-foreground-secondary",
  },
  {
    indent: 3,
    text: '"content": "Summarize the Q3 report"}]',
    color: "text-foreground-secondary",
  },
  { indent: 1, text: "}'", color: "text-green-400" },
];

export async function DeveloperSection() {
  const t = await getTranslations("home.developer");
  const tableHeaders = ["model", "requests", "tokens"];
  const tableRows = [
    ["groq-llama-3.3-70b", "42", "2,847"],
    ["groq-llama-3.1-8b", "118", "1,205"],
  ];

  return (
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <Badge variant="info" dot className="mb-6">
          {t("badge")}
        </Badge>
        <h2 className="text-3xl font-normal tracking-tight text-foreground sm:text-5xl leading-tight max-w-3xl">
          {t("titlePrefix")}{" "}
          <span className="text-foreground-muted">{t("titleMuted")}</span>
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className=" border border-border bg-card overflow-hidden">
            <div className="flex border-b border-border">
              <div className="px-4 py-3 text-sm font-medium text-foreground border-b-2 border-accent-primary">
                cURL
              </div>
            </div>
            <div className="p-6 font-mono text-sm leading-6 overflow-x-auto">
              {codeLines.map((line, i) => (
                <div key={i} className="flex">
                  <span className="w-8 text-right pr-4 text-foreground-muted select-none shrink-0">
                    {i + 1}
                  </span>
                  <span className={line.color}>
                    {"  ".repeat(line.indent)}
                    {line.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className=" border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <div className="w-3 h-3  bg-red-500" />
              <div className="w-3 h-3  bg-yellow-500" />
              <div className="w-3 h-3  bg-green-500" />
              <span className="ml-2 text-sm text-foreground-muted">
                model-usage
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {tableHeaders.map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-border last:border-0 hover:bg-background-tertiary transition-colors"
                    >
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={`px-4 py-3 whitespace-nowrap ${
                            j === 0
                              ? "text-foreground font-medium"
                              : "text-foreground-secondary"
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="font-semibold text-foreground">
              {t("features.cloud.title")}
            </h3>
            <p className="mt-2 text-sm text-foreground-secondary">
              {t("features.cloud.desc")}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {t("features.multiModel.title")}
            </h3>
            <p className="mt-2 text-sm text-foreground-secondary">
              {t("features.multiModel.desc")}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {t("features.observability.title")}
            </h3>
            <p className="mt-2 text-sm text-foreground-secondary">
              {t("features.observability.desc")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

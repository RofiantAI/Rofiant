import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Package, Terminal, Boxes, Monitor, Apple } from "lucide-react";

const REPO = "RofiantAI/RofiantDesktop";

type PlatformKey = "linux" | "macos" | "windows";

interface ReleaseAsset {
  name: string;
  size: number;
  browser_download_url: string;
}

interface Release {
  tag_name: string;
  html_url: string;
  prerelease: boolean;
  assets: ReleaseAsset[];
}

async function getLatestRelease(): Promise<Release | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases?per_page=1`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const releases = (await res.json()) as Release[];
    return releases[0] ?? null;
  } catch {
    return null;
  }
}

// Order matters: mobile UAs can also match /Linux/ (Android) or contain
// "like Mac OS X" (iOS), so those must be ruled out before the desktop checks.
function detectPlatform(userAgent: string): PlatformKey | null {
  if (/iPhone|iPad|iPod|Android/i.test(userAgent)) return null;
  if (/Windows NT/i.test(userAgent)) return "windows";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "macos";
  if (/Linux/i.test(userAgent)) return "linux";
  return null;
}

function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function trackedDownloadUrl(asset: ReleaseAsset, platform: PlatformKey, version: string) {
  const params = new URLSearchParams({
    url: asset.browser_download_url,
    name: asset.name,
    platform,
    version,
  });
  return `/api/download?${params.toString()}`;
}

const formatConfig = [
  { match: ".AppImage", icon: Boxes, platform: "linux" as PlatformKey },
  { match: ".deb", icon: Package, platform: "linux" as PlatformKey },
  { match: ".rpm", icon: Terminal, platform: "linux" as PlatformKey },
  { match: ".exe", icon: Monitor, platform: "windows" as PlatformKey },
  { match: ".msi", icon: Monitor, platform: "windows" as PlatformKey },
  { match: ".dmg", icon: Apple, platform: "macos" as PlatformKey },
] as const;

export default async function DownloadPage() {
  const t = await getTranslations("download");
  const [release, requestHeaders] = await Promise.all([
    getLatestRelease(),
    headers(),
  ]);
  const detected = detectPlatform(requestHeaders.get("user-agent") ?? "");

  const assets = release
    ? formatConfig
        .map((cfg) => ({
          ...cfg,
          asset: release.assets.find((a) => a.name.endsWith(cfg.match)),
        }))
        .filter((a): a is typeof a & { asset: ReleaseAsset } => Boolean(a.asset))
    : [];

  const primary =
    (detected && assets.find((a) => a.platform === detected)) ??
    assets.find((a) => a.platform === "linux") ??
    assets[0];
  const primaryPlatform: PlatformKey = primary?.platform ?? detected ?? "linux";
  const ext = primary?.match.replace(/^\./, "") ?? "AppImage";
  const assetsByPlatform = (["linux", "macos", "windows"] as const).reduce(
    (acc, p) => {
      acc[p] = assets.filter((a) => a.platform === p);
      return acc;
    },
    {} as Record<PlatformKey, typeof assets>,
  );

  return (
    <PageLayout
      badge={t("badge")}
      badgeVariant="info"
      title={t("title")}
      subtitle={t("subtitle")}
      hero={
        <Card variant="bordered" className="p-8">
          {release && primary ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-foreground">
                    {t("heroTitle", { platform: t(`platforms.${primaryPlatform}.title`) })}
                  </span>
                  <Badge variant={release.prerelease ? "warning" : "success"} dot>
                    {release.prerelease ? t("prerelease") : t("stable")}
                  </Badge>
                  {detected === primaryPlatform && (
                    <Badge variant="info">{t("detected")}</Badge>
                  )}
                </div>
                <p className="mt-2 text-sm text-foreground-secondary">
                  {t("version", { version: release.tag_name })} · {formatBytes(primary.asset.size)}
                </p>
              </div>
              <a
                href={trackedDownloadUrl(primary.asset, primaryPlatform, release.tag_name)}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 text-base font-medium rounded-lg bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors duration-200 whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                {t("downloadCta", { ext })}
              </a>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <span className="text-lg font-semibold text-foreground">
                  {t("heroTitle", { platform: t(`platforms.${primaryPlatform}.title`) })}
                </span>
                <p className="mt-2 text-sm text-foreground-secondary">{t("noRelease")}</p>
              </div>
              <a
                href={`https://github.com/${REPO}/releases`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 text-base font-medium rounded-lg bg-button-outline text-button-outline-foreground border border-border hover:bg-background-tertiary hover:border-border-light transition-colors duration-200 whitespace-nowrap"
              >
                {t("viewReleases")}
              </a>
            </div>
          )}
        </Card>
      }
    >
      <PageSection title={t("platformsSection.title")} subtitle={t("platformsSection.subtitle")}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mt-8">
          {(["linux", "macos", "windows"] as const).map((p) => {
            const platformAssets = assetsByPlatform[p];
            const desc =
              p === "macos"
                ? t(platformAssets.length > 0 ? "platforms.macos.descAvailable" : "platforms.macos.descComingSoon")
                : t(`platforms.${p}.desc`);
            return (
              <Card key={p} variant="bordered" className="p-6">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{t(`platforms.${p}.title`)}</h3>
                  {detected === p && <Badge variant="info">{t("detected")}</Badge>}
                </div>
                <p className="mt-2 text-sm text-foreground-secondary">{desc}</p>
                {platformAssets.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-foreground-secondary/70">
                      {t("filesLabel")}
                    </p>
                    {platformAssets.map(({ asset, match, icon: Icon }) => (
                      <a
                        key={match}
                        href={trackedDownloadUrl(asset, p, release?.tag_name ?? "")}
                        className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{asset.name}</span>
                        <span className="text-foreground-secondary/70 shrink-0">
                          · {formatBytes(asset.size)}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </PageSection>
    </PageLayout>
  );
}

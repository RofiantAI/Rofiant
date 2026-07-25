import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_HOST = "github.com";
const ALLOWED_ASSET_HOST = "objects.githubusercontent.com";

function isAllowedAssetUrl(url: URL) {
  return url.hostname === ALLOWED_HOST || url.hostname === ALLOWED_ASSET_HOST;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const assetUrl = searchParams.get("url");
  const name = searchParams.get("name");
  const platform = searchParams.get("platform");
  const version = searchParams.get("version") ?? undefined;

  if (!assetUrl || !name || !platform) {
    return NextResponse.json({ error: "Missing url, name, or platform" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(assetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  if (!isAllowedAssetUrl(parsedUrl)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = req.headers.get("user-agent");

  const admin = createAdminClient();
  await admin.from("download_events").insert({
    user_id: user?.id ?? null,
    asset_name: name,
    platform,
    version,
    ip,
    user_agent: userAgent,
  });

  return NextResponse.redirect(parsedUrl.toString());
}

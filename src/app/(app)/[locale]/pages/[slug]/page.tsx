import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

export default async function PublicSiteScreenPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: screen } = await supabase
    .from("site_screens")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (!screen) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{screen.title}</h1>
      <div className="mt-8 text-foreground-secondary whitespace-pre-wrap leading-relaxed">
        {screen.content || "—"}
      </div>
    </main>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MembersClient } from "./members-client";

export default async function AgencyMembersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const plan: string = (user.user_metadata?.plan ?? "free" as string).toLowerCase();
  const isPaid = ["pro", "team", "pilot", "agency", "enterprise"].includes(plan);
  if (!isPaid) redirect("/dashboard/agency");

  let { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!agency) {
    const { data: created } = await supabase
      .from("agencies")
      .insert({ owner_id: user.id, name: "My Agency" })
      .select()
      .single();
    if (created) {
      await supabase.from("agency_members").insert({
        agency_id: created.id,
        user_id: user.id,
        email: user.email,
        role: "admin",
        status: "active",
        joined_at: new Date().toISOString(),
      });
      agency = created;
    }
  }

  const members = agency
    ? (
        await supabase
          .from("agency_members")
          .select("id, email, role, status, invited_at, joined_at")
          .eq("agency_id", agency.id)
          .order("invited_at", { ascending: false })
      ).data ?? []
    : [];

  return (
    <MembersClient
      initialMembers={members}
      ownerEmail={user.email ?? ""}
      isTeamPlan={plan === "team"}
    />
  );
}

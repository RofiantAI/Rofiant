import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { InviteBanner } from "@/components/dashboard/invite-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const plan: string = (user.user_metadata?.plan ?? "free" as string).toLowerCase();

  // Fetch pending invitations for this user
  const admin = createAdminClient();
  const { data: pendingRows } = await admin
    .from("agency_members")
    .select("id, role, agency_id")
    .eq("user_id", user.id)
    .eq("status", "pending");

  let pendingInvites: { id: string; agencyName: string; role: string }[] = [];

  if (pendingRows && pendingRows.length > 0) {
    const agencyIds = pendingRows.map((r: { agency_id: string }) => r.agency_id);
    const { data: agencies } = await admin
      .from("agencies")
      .select("id, name")
      .in("id", agencyIds);

    const agencyMap = Object.fromEntries(
      (agencies ?? []).map((a: { id: string; name: string }) => [a.id, a.name])
    );

    pendingInvites = pendingRows.map((r: { id: string; role: string; agency_id: string }) => ({
      id: r.id,
      agencyName: agencyMap[r.agency_id] ?? "An agency",
      role: r.role,
    }));
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar email={user.email} plan={plan} />
      <main className="flex-1 overflow-auto flex flex-col">
        {pendingInvites.length > 0 && <InviteBanner invites={pendingInvites} />}
        <div className="flex-1 p-8">
          <div className="max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { DashboardTour } from "./dashboard-tour";

export function DashboardOnboarding({
  displayName,
  isPaid = false,
  tourSeen = false,
}: {
  displayName: string;
  isPaid?: boolean;
  tourSeen?: boolean;
}) {
  return <DashboardTour displayName={displayName} isPaid={isPaid} tourSeen={tourSeen} />;
}

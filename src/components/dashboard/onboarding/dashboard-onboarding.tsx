"use client";

import { DashboardTour } from "./dashboard-tour";

export function DashboardOnboarding({
  userId,
  displayName,
  isPaid = false,
}: {
  userId: string;
  displayName: string;
  isPaid?: boolean;
}) {
  return <DashboardTour userId={userId} displayName={displayName} isPaid={isPaid} />;
}

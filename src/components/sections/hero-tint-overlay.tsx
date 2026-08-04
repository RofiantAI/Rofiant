"use client";

import { useEffect, useState } from "react";

export function HeroTintOverlay() {
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    setIsNight(hour < 6 || hour >= 18);
  }, []);

  if (!isNight) return null;

  return <div className="absolute inset-0 mix-blend-color bg-accent-primary/55" />;
}

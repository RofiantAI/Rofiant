"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY = "rofiant_dmc_ad_dismissed";

export function DmcAdSection() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm">
      <Card variant="elevated" className="p-4 relative">
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="absolute top-2 right-2 p-1 rounded-full text-foreground-secondary opacity-70 hover:opacity-100 hover:bg-background-tertiary transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3 pr-5">
          <div className="w-10 h-10 shrink-0 overflow-hidden rounded-lg border border-border bg-background-tertiary">
            <Image
              src="/dmc.jpg"
              alt="DMC logo"
              width={640}
              height={640}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <Badge variant="info" className="mb-1">
              Partner
            </Badge>
            <p className="text-sm font-semibold text-foreground">
              DMC: unified API gateway for AI models.
            </p>
            <p className="mt-1 text-xs text-foreground-secondary">
              Access a vast range of models through one standard API.
            </p>
          </div>
        </div>
        <a href="https://dmc.cc/" target="_blank" rel="noopener noreferrer" className="mt-3 block">
          <Button size="sm" variant="outline" className="w-full">
            Visit dmc.cc
          </Button>
        </a>
      </Card>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  LayoutDashboard,
  Sparkles,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const EASE = [0.22, 1, 0.36, 1] as const;
const PAD = 10;
const TOUR_OPEN_SIDEBAR = "dashboard-tour:open-sidebar";

type Rect = { top: number; left: number; width: number; height: number };
type Placement = "right" | "bottom" | "left" | "top";

type TourStepDef = {
  id: string;
  target: string;
  placement: Placement;
  icon: LucideIcon;
  paidOnly?: boolean;
  centerTooltip?: boolean;
};

const BASE_STEPS: TourStepDef[] = [
  { id: "welcome", target: '[data-tour="sidebar"]', placement: "right", icon: Sparkles },
  { id: "usage", target: '[data-tour="nav-usage"]', placement: "right", icon: BarChart3 },
  { id: "account", target: '[data-tour="user-menu"]', placement: "top", icon: User },
  {
    id: "workspace",
    target: '[data-tour="workspace"]',
    placement: "bottom",
    icon: LayoutDashboard,
    centerTooltip: true,
  },
];

async function markTourSeen() {
  try {
    await createClient().auth.updateUser({ data: { dashboard_tour_seen: true } });
  } catch {
    /* ignore */
  }
}

function subscribeNever() {
  return () => {};
}

function useMounted() {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

function measureTarget(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const box = el.getBoundingClientRect();
  const expandW = box.width < 120 ? Math.max(box.width, 240) : box.width;
  const expandH = box.height < 64 ? Math.max(box.height, 112) : box.height;
  const left = box.left - PAD - Math.max(0, (expandW - box.width) / 2);
  const top = box.top - PAD - Math.max(0, (expandH - box.height) / 2);
  return {
    top,
    left,
    width: expandW + PAD * 2,
    height: expandH + PAD * 2,
  };
}

function clampTooltip(
  rect: Rect,
  placement: Placement,
  tooltipW: number,
  tooltipH: number,
  vw: number,
  vh: number,
  center = false,
): { top: number; left: number } {
  if (center) {
    return {
      top: Math.max(12, (vh - tooltipH) / 2),
      left: Math.max(12, (vw - tooltipW) / 2),
    };
  }

  const gap = 16;
  let top = rect.top;
  let left = rect.left;

  if (placement === "right") {
    left = rect.left + rect.width + gap;
    top = rect.top + rect.height / 2 - tooltipH / 2;
  } else if (placement === "left") {
    left = rect.left - tooltipW - gap;
    top = rect.top + rect.height / 2 - tooltipH / 2;
  } else if (placement === "bottom") {
    top = rect.top + rect.height + gap;
    left = rect.left + rect.width / 2 - tooltipW / 2;
  } else {
    top = rect.top - tooltipH - gap;
    left = rect.left + rect.width / 2 - tooltipW / 2;
  }

  left = Math.max(12, Math.min(left, vw - tooltipW - 12));
  top = Math.max(12, Math.min(top, vh - tooltipH - 12));
  return { top, left };
}

function SpotlightPanels({ rect, vw, vh }: { rect: Rect; vw: number; vh: number }) {
  const bottom = rect.top + rect.height;
  const right = rect.left + rect.width;
  const panel = "fixed z-[70] bg-black/78 backdrop-blur-[1px]";

  return (
    <>
      <motion.div
        className={panel}
        initial={false}
        animate={{ top: 0, left: 0, width: vw, height: rect.top }}
        transition={{ duration: 0.45, ease: EASE }}
      />
      <motion.div
        className={panel}
        initial={false}
        animate={{ top: rect.top, left: 0, width: rect.left, height: rect.height }}
        transition={{ duration: 0.45, ease: EASE }}
      />
      <motion.div
        className={panel}
        initial={false}
        animate={{
          top: rect.top,
          left: right,
          width: Math.max(0, vw - right),
          height: rect.height,
        }}
        transition={{ duration: 0.45, ease: EASE }}
      />
      <motion.div
        className={panel}
        initial={false}
        animate={{ top: bottom, left: 0, width: vw, height: Math.max(0, vh - bottom) }}
        transition={{ duration: 0.45, ease: EASE }}
      />
    </>
  );
}

export function DashboardTour({
  displayName,
  isPaid = false,
  tourSeen = false,
}: {
  displayName: string;
  isPaid?: boolean;
  tourSeen?: boolean;
}) {
  const t = useTranslations("dashboard.overview.onboarding.tour");
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const mounted = useMounted();
  const [tooltipSize, setTooltipSize] = useState({ w: 320, h: 280 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const steps = useMemo(
    () => BASE_STEPS.filter((s) => !s.paidOnly || isPaid),
    [isPaid],
  );

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const StepIcon = step?.icon ?? Sparkles;

  const refreshRect = useCallback(() => {
    if (!step) return;
    window.dispatchEvent(new CustomEvent(TOUR_OPEN_SIDEBAR));
    const target = document.querySelector(step.target);
    target?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    const next = measureTarget(step.target);
    setRect(next);
    setViewport({ w: window.innerWidth, h: window.innerHeight });
  }, [step]);

  const close = useCallback(() => {
    void markTourSeen();
    setActive(false);
  }, []);

  useEffect(() => {
    if (!tourSeen) {
      const timer = window.setTimeout(() => setActive(true), 400);
      return () => window.clearTimeout(timer);
    }
  }, [tourSeen]);

  useEffect(() => {
    if (!active || !step) return;
    // Measuring the target element's DOM layout can't happen during render;
    // this syncs tooltip position to real (post-paint) geometry.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshRect();
    const timer = window.setTimeout(refreshRect, 350);
    const onLayout = () => refreshRect();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [active, step, stepIndex, refreshRect]);

  useEffect(() => {
    if (!active || !step) return;
    const timer = window.setTimeout(() => {
      if (!measureTarget(step.target)) {
        if (stepIndex < steps.length - 1) {
          setStepIndex((i) => i + 1);
        } else {
          close();
        }
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [active, step, stepIndex, steps.length, close]);

  useLayoutEffect(() => {
    if (!active || !tooltipRef.current) return;
    const box = tooltipRef.current.getBoundingClientRect();
    if (box.width > 0 && box.height > 0) {
      setTooltipSize({ w: box.width, h: box.height });
    }
  }, [active, step, stepIndex, displayName]);

  const goNext = () => {
    if (isLast) {
      close();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    if (stepIndex === 0) return;
    setStepIndex((i) => i - 1);
  };

  if (!mounted || !active || !step) return null;

  const fallbackRect: Rect = { top: 0, left: 0, width: 0, height: 0 };
  const spotlight = rect ?? fallbackRect;
  const showSpotlight = Boolean(rect);

  const tooltipW = tooltipSize.w;
  const tooltipH = tooltipSize.h;
  const tooltipPos = showSpotlight
    ? clampTooltip(
        spotlight,
        step.placement,
        tooltipW,
        tooltipH,
        viewport.w,
        viewport.h,
        step.centerTooltip,
      )
    : {
        top: Math.max(12, (viewport.h - tooltipH) / 2),
        left: Math.max(12, (viewport.w - tooltipW) / 2),
      };

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="dashboard-tour"
        className="fixed inset-0 z-[70]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        aria-hidden={false}
      >
        {showSpotlight ? (
          <SpotlightPanels rect={spotlight} vw={viewport.w} vh={viewport.h} />
        ) : (
          <div className="fixed inset-0 bg-black/78 backdrop-blur-[1px]" />
        )}

        {showSpotlight && (
          <motion.div
            className="pointer-events-none fixed z-[71] rounded-lg ring-2 ring-accent-primary shadow-[0_0_0_4px_rgba(234,179,8,0.15),0_0_32px_rgba(234,179,8,0.25)]"
            initial={false}
            animate={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
            }}
            transition={{ duration: 0.45, ease: EASE }}
          />
        )}

        <motion.div
          ref={tooltipRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-tour-title"
          className="pointer-events-auto fixed z-[72] flex max-h-[min(85vh,420px)] w-[min(calc(100vw-24px),360px)] flex-col rounded-xl border border-border bg-card shadow-2xl"
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, top: tooltipPos.top, left: tooltipPos.left, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.35, ease: EASE }}
          key={step.id}
        >
          <div className="relative flex-1 overflow-y-auto px-5 pt-5 pb-4">
            <button
              type="button"
              onClick={close}
              aria-label={t("skip")}
              className="absolute right-3 top-3 rounded-md p-1 text-foreground-muted transition-colors hover:bg-background-tertiary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background-secondary text-accent-primary">
              <StepIcon className="h-4 w-4" />
            </div>

            <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
              {t("stepIndicator", { current: stepIndex + 1, total: steps.length })}
            </p>
            <h2 id="dashboard-tour-title" className="mt-1 text-base font-semibold text-foreground">
              {step.id === "welcome"
                ? t("steps.welcome.title", { name: displayName })
                : t(`steps.${step.id}.title`)}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground-secondary">
              {step.id === "welcome"
                ? t("steps.welcome.description")
                : t(`steps.${step.id}.description`)}
            </p>

            <div className="mt-4 flex items-center gap-1.5">
              {steps.map((s, i) => (
                <motion.span
                  key={s.id}
                  className="h-1 rounded-full bg-border"
                  animate={{
                    width: i === stepIndex ? 20 : 6,
                    backgroundColor: i === stepIndex ? "var(--accent-primary)" : "var(--border)",
                  }}
                  transition={{ duration: 0.3, ease: EASE }}
                />
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-background-secondary/50 px-5 py-3">
            <button
              type="button"
              onClick={stepIndex === 0 ? close : goBack}
              className="text-sm text-foreground-muted transition-colors hover:text-foreground"
            >
              {stepIndex === 0 ? t("skip") : t("back")}
            </button>
            <button
              type="button"
              onClick={() => {
                if (isLast) {
                  close();
                  router.refresh();
                } else {
                  goNext();
                }
              }}
              className="inline-flex h-8 items-center justify-center gap-1.5 bg-button-primary px-3.5 text-sm font-medium text-button-primary-foreground transition-colors hover:bg-foreground/90"
            >
              {isLast ? t("finish") : t("next")}
              {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

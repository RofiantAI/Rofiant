"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Lock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useChatSettings } from "@/contexts/chat-settings-context";
import {
  ALL_MODELS,
  FREE_MODELS,
  PRO_MODELS,
} from "@/lib/chat-settings";

export function ModelSwitcher({ disabled }: { disabled?: boolean }) {
  const { settings, isPro, save } = useChatSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current =
    ALL_MODELS.find((m) => m.id === settings.model) ?? FREE_MODELS[0];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function selectModel(id: string) {
    const isFreeModel = FREE_MODELS.some((m) => m.id === id);
    if (!isPro && !isFreeModel) return;
    save({ ...settings, model: id });
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-8 px-2.5 text-xs text-foreground-secondary hover:text-foreground hover:bg-background-tertiary rounded-lg border border-transparent hover:border-border/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed max-w-[148px]"
        title="Switch model"
      >
        <span className="truncate font-medium">{current.name}</span>
        <ChevronDown
          className={`w-3 h-3 shrink-0 text-foreground-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted">
              Model
            </span>
          </div>

          <div className="py-1">
            {FREE_MODELS.map((m) => (
              <ModelOption
                key={m.id}
                model={m}
                selected={settings.model === m.id}
                locked={false}
                onSelect={() => selectModel(m.id)}
              />
            ))}
          </div>

          <div className="border-t border-border py-1">
            <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-widest text-foreground-muted">
              Pro
            </p>
            {PRO_MODELS.map((m) => (
              <ModelOption
                key={m.id}
                model={m}
                selected={settings.model === m.id}
                locked={!isPro}
                onSelect={() => selectModel(m.id)}
              />
            ))}
            {!isPro && (
              <Link
                href="/pricing"
                className="block mx-2 mb-2 mt-1 px-3 py-2 text-xs text-center text-accent-primary hover:bg-accent-primary/10 rounded-md transition-colors"
              >
                Upgrade for Pro models →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ModelOption({
  model,
  selected,
  locked,
  onSelect,
}: {
  model: { id: string; name: string; desc: string };
  selected: boolean;
  locked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={locked}
      className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-md text-left transition-colors ${
        locked
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-background-tertiary"
      } ${selected ? "bg-background-tertiary/60" : ""}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{model.name}</p>
        <p className="text-xs text-foreground-muted mt-0.5 leading-snug">
          {model.desc}
        </p>
      </div>
      {locked ? (
        <Lock className="w-3.5 h-3.5 shrink-0 text-foreground-muted mt-0.5" />
      ) : selected ? (
        <Check className="w-3.5 h-3.5 shrink-0 text-foreground mt-0.5" />
      ) : null}
    </button>
  );
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type ChatSettings, DEFAULT_SETTINGS, loadSettings, saveSettings, clampModelForPlan } from "@/lib/chat-settings";

type ChatSettingsContextValue = {
  settings: ChatSettings;
  isPro: boolean;
  update: (patch: Partial<ChatSettings>) => void;
  save: (s: ChatSettings) => void;
};

const ChatSettingsContext = createContext<ChatSettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  isPro: false,
  update: () => {},
  save: () => {},
} as ChatSettingsContextValue);

export function ChatSettingsProvider({
  isPro = false,
  children,
}: {
  isPro?: boolean;
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings(isPro));
  }, [isPro]);

  const update = useCallback(
    (patch: Partial<ChatSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        if (patch.model) next.model = clampModelForPlan(patch.model, isPro);
        return next;
      });
    },
    [isPro],
  );

  const save = useCallback(
    (s: ChatSettings) => {
      const clamped = { ...s, model: clampModelForPlan(s.model, isPro) };
      saveSettings(clamped);
      setSettings(clamped);
    },
    [isPro],
  );

  const value = useMemo(
    () => ({ settings, isPro, update, save }),
    [settings, isPro, update, save],
  );

  return (
    <ChatSettingsContext.Provider value={value}>
      {children}
    </ChatSettingsContext.Provider>
  );
}

export function useChatSettings() {
  return useContext(ChatSettingsContext);
}

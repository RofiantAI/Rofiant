export const SHORTCUT_DEFINITIONS = [
  { id: "sendMessage", label: "Send message", defaultBinding: "Enter" },
  { id: "newChat", label: "New chat", defaultBinding: "Mod+KeyN" },
  { id: "openSettings", label: "Open settings", defaultBinding: "Mod+Comma" },
  { id: "focusComposer", label: "Focus message input", defaultBinding: "Mod+KeyL" },
  { id: "toggleSidebar", label: "Toggle sidebar", defaultBinding: "Mod+KeyB" },
  { id: "toggleWorkspace", label: "Toggle workspace", defaultBinding: "Mod+KeyJ" },
  { id: "previousChat", label: "Previous chat", defaultBinding: "Mod+Shift+BracketLeft" },
  { id: "nextChat", label: "Next chat", defaultBinding: "Mod+Shift+BracketRight" },
] as const;

export type ShortcutId = (typeof SHORTCUT_DEFINITIONS)[number]["id"];
export type ShortcutBindings = Record<ShortcutId, string>;
export const FOCUS_COMPOSER_EVENT = "kiro:focus-composer";

export const DEFAULT_SHORTCUTS = Object.fromEntries(
  SHORTCUT_DEFINITIONS.map(({ id, defaultBinding }) => [id, defaultBinding]),
) as ShortcutBindings;

export function bindingFromEvent(event: KeyboardEvent): string | null {
  if (["Control", "Meta", "Alt", "Shift"].includes(event.key)) return null;
  const modifiers = [
    event.metaKey || event.ctrlKey ? "Mod" : null,
    event.altKey ? "Alt" : null,
    event.shiftKey ? "Shift" : null,
  ].filter(Boolean);
  // Global letter/number shortcuts must include a command modifier so typing
  // in the composer never accidentally triggers application navigation.
  if (modifiers.length === 0 && event.code !== "Enter" && !/^F\d+$/.test(event.code)) return null;
  return [...modifiers, event.code].join("+");
}

export function matchesShortcut(event: KeyboardEvent, binding: string): boolean {
  return bindingFromEvent(event) === binding;
}

export function formatShortcut(binding: string): string {
  const labels: Record<string, string> = {
    Mod: navigator.platform.includes("Mac") ? "⌘" : "Ctrl",
    Alt: navigator.platform.includes("Mac") ? "⌥" : "Alt",
    Shift: "Shift",
    Comma: ",",
    BracketLeft: "[",
    BracketRight: "]",
  };
  return binding
    .split("+")
    .map((part) => labels[part] ?? part.replace(/^Key/, "").replace(/^Digit/, ""))
    .join(" + ");
}

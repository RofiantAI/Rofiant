"use client";

import { useSyncExternalStore } from "react";

export const COOKIE_CONSENT_STORAGE_KEY = "cookie-consent";

function subscribe(callback: () => void) {
  window.addEventListener(COOKIE_CONSENT_STORAGE_KEY, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(COOKIE_CONSENT_STORAGE_KEY, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  return localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) === null;
}

function getServerSnapshot() {
  return false;
}

export function useCookieConsentNeeded() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

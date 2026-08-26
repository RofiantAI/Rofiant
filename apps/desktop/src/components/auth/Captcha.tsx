import { useEffect, useRef, useState } from "react";

const siteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

type HCaptchaApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme: "light" | "dark";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": (errorCode: string) => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

const getApi = () =>
  (window as typeof window & { hcaptcha?: HCaptchaApi }).hcaptcha;

const resolveTheme = (): "light" | "dark" => {
  const dataTheme = document.documentElement.dataset.theme;
  if (dataTheme === "light" || dataTheme === "dark") return dataTheme;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

export function Captcha({
  onTokenChange,
  resetKey,
}: {
  onTokenChange: (token: string) => void;
  resetKey: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let script = document.querySelector<HTMLScriptElement>(
      'script[src^="https://js.hcaptcha.com/1/api.js"]',
    );

    const render = () => {
      const api = getApi();
      if (cancelled || !api || !container.current || widgetId.current) return;
      widgetId.current = api.render(container.current, {
        sitekey: siteKey,
        theme: resolveTheme(),
        callback: (token) => {
          onTokenChange(token);
          setError(null);
        },
        "expired-callback": () => onTokenChange(""),
        "error-callback": (errorCode) => {
          onTokenChange("");
          setError(`Verification failed (${errorCode}). Try again.`);
        },
      });
    };
    const fail = () => setError("Verification failed to load. Try again.");

    if (!siteKey) {
      setError("Verification is not configured.");
      return;
    }
    if (!script) {
      script = document.createElement("script");
      script.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
      script.async = true;
      script.defer = true;
    }
    script.addEventListener("load", render);
    script.addEventListener("error", fail);
    if (!script.isConnected) document.head.append(script);
    render();

    return () => {
      cancelled = true;
      script.removeEventListener("load", render);
      script.removeEventListener("error", fail);
      if (widgetId.current) getApi()?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [onTokenChange, resetKey]);

  return (
    <>
      <div ref={container} className="flex min-h-[78px] justify-center" />
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </>
  );
}

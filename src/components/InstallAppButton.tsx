import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, X } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SNOOZE_KEY = "ac_install_snoozed_until";
const NEVER_KEY = "ac_install_never";
const VISITS_KEY = "ac_install_visits";
const FORCE_KEY = "ac_install_force";
const SNOOZE_DAYS = 7;
const MIN_VISITS = 2;
const SHOW_DELAY_MS = 8000;

function isForced() {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(FORCE_KEY) === "1") return true;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("forceInstall") === "1") {
      localStorage.setItem(FORCE_KEY, "1");
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

function isSnoozed() {
  if (typeof window === "undefined") return true;
  if (localStorage.getItem(NEVER_KEY) === "1") return true;
  const until = Number(localStorage.getItem(SNOOZE_KEY) || 0);
  return until > Date.now();
}

function snooze() {
  localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86400_000));
}

function bumpVisits() {
  const n = Number(localStorage.getItem(VISITS_KEY) || 0) + 1;
  localStorage.setItem(VISITS_KEY, String(n));
  return n;
}

export function InstallAppButton({ variant = "banner" }: { variant?: "banner" | "header" }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIos, setShowIos] = useState(false);
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const forced = isForced();

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS only
      window.navigator.standalone === true;
    if (standalone && !forced) {
      setInstalled(true);
      return;
    }
    if (!forced && isSnoozed()) return;

    const visits = bumpVisits();
    const ua = window.navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/.test(ua);
    const isIos = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);

    // Only prompt on mobile, or after MIN_VISITS on desktop (skip when forced)
    if (!forced && !isMobile && visits < MIN_VISITS) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      localStorage.setItem(NEVER_KEY, "1");
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // In forced mode, show iOS-style instructions when no native prompt fires
    if (isIos || forced) setShowIos(true);

    // Delay UI so it doesn't appear immediately on landing (instant when forced)
    const t = window.setTimeout(() => setEligible(true), forced ? 0 : SHOW_DELAY_MS);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !eligible) return null;
  if (!deferred && !showIos) return null;

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      localStorage.setItem(NEVER_KEY, "1");
    } else {
      snooze();
      setEligible(false);
    }
    setDeferred(null);
  }

  function handleDismiss() {
    snooze();
    setEligible(false);
  }

  if (variant === "header") {
    if (!deferred) return null;
    return (
      <Button size="sm" variant="outline" onClick={handleInstall} className="gap-1.5">
        <Download className="h-4 w-4" /> Install
      </Button>
    );
  }

  // Non-intrusive bottom-right toast-style card (mobile: full-width bottom)
  return (
    <div
      role="dialog"
      aria-label="Install AmbassadorsCloud"
      className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm"
    >
      <div className="rounded-xl border border-border bg-card/95 p-3.5 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-accent/15 text-accent">
            {showIos ? <Share className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Install AmbassadorsCloud</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {showIos
                ? "Tap Share, then 'Add to Home Screen' for the app experience."
                : "Add to your home screen for faster access and a fullscreen experience."}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              {deferred && (
                <Button size="sm" onClick={handleInstall} className="h-8">
                  Install
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-8 text-muted-foreground"
              >
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Settings control: lets users re-enable or permanently disable the install prompt. */
export function InstallPromptSettings() {
  const [neverShow, setNeverShow] = useState(false);
  const [snoozedUntil, setSnoozedUntil] = useState<number>(0);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setNeverShow(localStorage.getItem(NEVER_KEY) === "1");
    setSnoozedUntil(Number(localStorage.getItem(SNOOZE_KEY) || 0));
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS only
      window.navigator.standalone === true;
    setInstalled(!!standalone);
  }, []);

  function reset() {
    localStorage.removeItem(NEVER_KEY);
    localStorage.removeItem(SNOOZE_KEY);
    setNeverShow(false);
    setSnoozedUntil(0);
  }

  function disableForever() {
    localStorage.setItem(NEVER_KEY, "1");
    setNeverShow(true);
  }

  const snoozedActive = snoozedUntil > Date.now();
  const snoozedDate = snoozedActive ? new Date(snoozedUntil).toLocaleDateString() : null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-display text-lg font-semibold text-foreground">Install prompt</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {installed
          ? "AmbassadorsCloud is already installed on this device."
          : neverShow
            ? "The install prompt is turned off on this device."
            : snoozedActive
              ? `Hidden until ${snoozedDate}.`
              : "The install prompt may appear when you can install AmbassadorsCloud."}
      </p>
      {!installed && (
        <div className="mt-3 flex flex-wrap gap-2">
          {(neverShow || snoozedActive) && (
            <Button size="sm" variant="outline" onClick={reset}>
              Show install prompt again
            </Button>
          )}
          {!neverShow && (
            <Button size="sm" variant="ghost" onClick={disableForever}>
              Don't show again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

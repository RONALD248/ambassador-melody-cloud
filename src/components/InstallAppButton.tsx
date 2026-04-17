import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, X } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "ac_install_dismissed_v1";

export function InstallAppButton({ variant = "header" }: { variant?: "header" | "banner" }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIos, setShowIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS
      window.navigator.standalone === true;
    if (standalone) setInstalled(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari has no prompt — detect to show instructions
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
    if (isIos && !standalone) setShowIos(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || dismissed) return null;
  if (!deferred && !showIos) return null;

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferred(null);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  if (variant === "banner") {
    return (
      <div className="border-b border-accent/30 bg-accent/10 px-4 py-2.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            {showIos ? <Share className="h-4 w-4 text-accent" /> : <Download className="h-4 w-4 text-accent" />}
            <span className="font-medium">
              {showIos
                ? "Install: tap Share, then 'Add to Home Screen'"
                : "Install AmbassadorsCloud as an app"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {deferred && (
              <Button size="sm" variant="default" onClick={handleInstall}>
                Install
              </Button>
            )}
            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!deferred) return null;
  return (
    <Button size="sm" variant="outline" onClick={handleInstall} className="gap-1.5">
      <Download className="h-4 w-4" /> Install App
    </Button>
  );
}

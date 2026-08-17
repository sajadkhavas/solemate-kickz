import { Download, RefreshCw, Share2, WifiOff, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useCartCount } from "@/store";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  ("standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

export function PwaExperience() {
  const cartCount = useCartCount();
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [iosNeedsGuide, setIosNeedsGuide] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [registrationError, setRegistrationError] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const ua = navigator.userAgent;
    setIosNeedsGuide(
      /iPad|iPhone|iPod/.test(ua) &&
        /Safari/.test(ua) &&
        !/CriOS|FxiOS|EdgiOS/.test(ua) &&
        !isStandalone(),
    );
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);

    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      };
    }

    let disposed = false;
    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        if (disposed) return;
        setWaitingWorker(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              setWaitingWorker(worker);
            }
          });
        });
      })
      .catch(() => {
        if (!disposed) setRegistrationError(true);
      });

    return () => {
      disposed = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;
    const badgeNavigator = navigator as Navigator & {
      setAppBadge: (contents?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    const updateBadge =
      cartCount > 0 ? badgeNavigator.setAppBadge(cartCount) : badgeNavigator.clearAppBadge?.();
    void updateBadge?.catch(() => undefined);
  }, [cartCount]);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div className="pwa-status-stack" data-pwa-experience>
      {!online ? (
        <section className="pwa-status-card" role="status" aria-live="polite">
          <WifiOff aria-hidden="true" />
          <div>
            <strong>اتصال اینترنت قطع است</strong>
            <p>
              نسخه ذخیره‌شده صفحات عمومی نمایش داده می‌شود؛ قیمت و موجودی پس از اتصال بررسی می‌شود.
            </p>
          </div>
        </section>
      ) : null}

      {waitingWorker ? (
        <section className="pwa-status-card" role="status" aria-live="polite">
          <RefreshCw aria-hidden="true" />
          <div>
            <strong>نسخه جدید SOLE آماده است</strong>
            <p>برای جلوگیری از ترکیب فایل‌های قدیمی و جدید، برنامه را به‌روزرسانی کنید.</p>
            <Button size="sm" onClick={() => waitingWorker.postMessage({ type: "SKIP_WAITING" })}>
              به‌روزرسانی امن
            </Button>
          </div>
        </section>
      ) : null}

      {installPrompt ? (
        <Button className="pwa-install-button" onClick={install}>
          <Download aria-hidden="true" /> نصب SOLE
        </Button>
      ) : null}

      {iosNeedsGuide && !showIosGuide ? (
        <Button
          className="pwa-install-button"
          variant="outline"
          onClick={() => setShowIosGuide(true)}
        >
          <Share2 aria-hidden="true" /> راهنمای نصب در آیفون
        </Button>
      ) : null}

      {showIosGuide ? (
        <section
          className="pwa-status-card pwa-ios-guide"
          role="dialog"
          aria-modal="false"
          aria-labelledby="pwa-ios-title"
        >
          <Share2 aria-hidden="true" />
          <div>
            <strong id="pwa-ios-title">نصب SOLE در Safari</strong>
            <p>دکمه Share را بزنید، سپس «Add to Home Screen» را انتخاب و تأیید کنید.</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            aria-label="بستن راهنمای نصب"
            onClick={() => setShowIosGuide(false)}
          >
            <X aria-hidden="true" />
          </Button>
        </section>
      ) : null}

      {registrationError ? (
        <p className="sr-only" role="status">
          قابلیت آفلاین در این مرورگر فعال نشد.
        </p>
      ) : null}
    </div>
  );
}

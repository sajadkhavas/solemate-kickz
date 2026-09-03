import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useLocation,
  useRouter,
} from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

import foundationCss from "../foundation.css?url";
import appCss from "../styles.css?url";
import motionCss from "../motion.css?url";
import { CartDrawer } from "@/components/CartDrawer";
import { MagneticCursor } from "@/components/MagneticCursor";
import { PwaExperience } from "@/components/pwa/PwaExperience";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useStore } from "@/store";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { RumReporter } from "@/observability/RumReporter";

function NotFoundComponent() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 outline-none">
      <div className="max-w-md text-center">
        <p className="font-mono-num text-7xl font-bold text-foreground" aria-hidden="true">
          404
        </p>
        <h1 className="mt-4 text-xl font-semibold text-foreground">صفحه پیدا نشد</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          نشانی واردشده وجود ندارد یا جابه‌جا شده است.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link to="/">بازگشت به خانه</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 outline-none">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          این صفحه بارگذاری نشد
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          خطایی رخ داده است. دوباره تلاش کنید یا به صفحه اصلی برگردید.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            تلاش دوباره
          </Button>
          <Button asChild variant="outline">
            <Link to="/">بازگشت به خانه</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "SOLE — قدم بعدی تو" },
      {
        name: "description",
        content: "تجربه نمایشی فروشگاه کفش لوکس و استریت‌ویر به زبان فارسی.",
      },
      { name: "theme-color", content: "#0a0a0a" },
      { name: "color-scheme", content: "dark" },
      { property: "og:title", content: "SOLE — قدم بعدی تو" },
      {
        property: "og:description",
        content: "تجربه نمایشی کفش‌های لوکس و استریت‌ویر.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: foundationCss },
      { rel: "stylesheet", href: motionCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/sole-192.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          رفتن به محتوای اصلی
        </a>
        <div id="main-content" tabIndex={-1} className="min-w-0 outline-none">
          {children}
        </div>
        <Scripts />
      </body>
    </html>
  );
}

function StoreHydration() {
  useEffect(() => {
    let active = true;
    Promise.resolve(useStore.persist.rehydrate())
      .catch(() => undefined)
      .finally(() => {
        if (!active) return;
        useStore.getState().setHasHydrated(true);
        document.documentElement.dataset.soleHydrated = "true";
      });

    return () => {
      active = false;
      delete document.documentElement.dataset.soleHydrated;
    };
  }, []);

  return null;
}

function RouteMotionFeedback() {
  const location = useLocation();
  return (
    <div
      key={location.pathname}
      data-motion="navigation-feedback"
      className="route-motion-feedback"
      aria-hidden="true"
    />
  );
}

function RouteAccessibility() {
  const location = useLocation();
  const firstRender = useRef(true);
  const [announcement, setAnnouncement] = useState("");
  const routeNeedsMainLandmark = location.pathname === "/products";

  useEffect(() => {
    if (typeof document === "undefined") return;

    const frame = window.requestAnimationFrame(() => {
      if (!firstRender.current) {
        document.getElementById("main-content")?.focus({ preventScroll: true });
      }

      setAnnouncement(`صفحه ${document.title || "SOLE"}`);
      firstRender.current = false;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);

  return (
    <>
      <RouteMotionFeedback />
      <div
        role={routeNeedsMainLandmark ? "main" : undefined}
        aria-label={routeNeedsMainLandmark ? "محتوای اصلی" : undefined}
        className="min-w-0"
      >
        <Outlet />
      </div>
      <div className="route-announcer" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <StoreHydration />
        <RumReporter />
        <RouteAccessibility />
        <CartDrawer />
        <MagneticCursor />
        <PwaExperience />
        <Toaster dir="rtl" theme="dark" position="bottom-left" closeButton />
      </MotionConfig>
    </QueryClientProvider>
  );
}

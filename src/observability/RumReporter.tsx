import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

import { hasLocalAnalyticsConsent, sendAnalyticsEvent } from "./client";
import { routeTemplate } from "./contracts";

type RumName = "rum_lcp" | "rum_inp" | "rum_cls" | "rum_ttfb";

function rating(name: RumName, value: number): "good" | "needs_improvement" | "poor" {
  const limits =
    name === "rum_cls"
      ? [0.1, 0.25]
      : name === "rum_lcp"
        ? [2500, 4000]
        : name === "rum_inp"
          ? [200, 500]
          : [800, 1800];
  return value <= limits[0] ? "good" : value <= limits[1] ? "needs_improvement" : "poor";
}

export function RumReporter() {
  const location = useLocation();

  useEffect(() => {
    if (!hasLocalAnalyticsConsent()) return;

    let active = true;
    const observers: PerformanceObserver[] = [];
    const route = routeTemplate(location.pathname);
    const emit = (name: RumName, value: number) => {
      if (!active || !Number.isFinite(value)) return;
      void sendAnalyticsEvent(name, route, {
        value: Math.round(value * 1000) / 1000,
        rating: rating(name, value),
        navigation_type:
          performance.getEntriesByType("navigation")[0] instanceof PerformanceNavigationTiming
            ? (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming).type
            : "navigate",
      });
    };

    if (!("PerformanceObserver" in window)) return;
    const navigation = performance.getEntriesByType("navigation")[0];
    if (navigation instanceof PerformanceNavigationTiming)
          emit("rum_ttfb", navigation.responseStart);
    for (const [type, name] of [
      ["largest-contentful-paint", "rum_lcp"],
      ["event", "rum_inp"],
      ["layout-shift", "rum_cls"],
    ] as const) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries.at(-1) as PerformanceEntry & {
            value?: number;
            duration?: number;
            hadRecentInput?: boolean;
          };
          if (!last || last.hadRecentInput) return;
          emit(name, name === "rum_cls" ? (last.value ?? 0) : last.duration || last.startTime);
        });
        observer.observe({
          type,
          buffered: true,
          ...(type === "event" ? { durationThreshold: 40 } : {}),
        } as PerformanceObserverInit);
        observers.push(observer);
      } catch {
        // Unsupported observers are omitted; no synthetic field value is emitted.
      }
        }


    return () => {
      active = false;
      observers.forEach((observer) => observer.disconnect());
    };
  }, [location.pathname]);

  return null;
}

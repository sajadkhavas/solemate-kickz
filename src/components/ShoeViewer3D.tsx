import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { useMouseParallax } from "@/hooks/useMouseParallax";
import { motionTransition } from "@/lib/motion-system";

type ModelViewerProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement> & {
    src?: string;
    alt?: string;
    poster?: string;
    "camera-controls"?: boolean;
    "shadow-intensity"?: string;
    exposure?: string;
    "environment-image"?: string;
    "field-of-view"?: string;
    "min-camera-orbit"?: string;
    "max-camera-orbit"?: string;
    "interaction-prompt"?: string;
  },
  HTMLElement
>;

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "model-viewer": ModelViewerProps;
      }
    }
  }
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

interface Props {
  fallbackImage: string;
  alt: string;
  priority?: boolean;
}

export function ShoeViewer3D({ fallbackImage, alt, priority = false }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef<HTMLElement | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [activated, setActivated] = useState(false);
  const [inView, setInView] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [modelSrc, setModelSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [supported, setSupported] = useState(true);
  const [errored, setErrored] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const reduced = hydrated && prefersReducedMotion === true;

  const runtimeActive = activated && inView && documentVisible && !reduced && supported && !errored;
  const parallax = useMouseParallax(3, 4, runtimeActive);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const element = rootRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { rootMargin: "160px 0px", threshold: 0.05 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setDocumentVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (!runtimeActive) {
      setModelSrc(null);
      setLoaded(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    Promise.all([import("@google/model-viewer"), import("@/lib/create-shoe-model")])
      .then(([, modelFactory]) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(modelFactory.createShoeModelBlob());
        setModelSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setErrored(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [runtimeActive]);

  useEffect(() => {
    const element = modelRef.current;
    if (!element || !modelSrc) return;

    const onLoad = () => setLoaded(true);
    const onError = () => setErrored(true);
    const onInteraction = () => setInteracted(true);

    element.addEventListener("load", onLoad);
    element.addEventListener("error", onError);
    element.addEventListener("pointerdown", onInteraction, { once: true });

    return () => {
      element.removeEventListener("load", onLoad);
      element.removeEventListener("error", onError);
      element.removeEventListener("pointerdown", onInteraction);
    };
  }, [modelSrc]);

  const activate = useCallback(() => {
    if (reduced) return;
    if (!hasWebGL()) {
      setSupported(false);
      return;
    }
    setActivated(true);
  }, [reduced]);

  const canMountModel = runtimeActive && Boolean(modelSrc);

  return (
    <div
      ref={rootRef}
      className="relative w-full"
      data-testid="shoe-viewer"
      data-3d-active={canMountModel ? "true" : "false"}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(circle at ${parallax.lightX}% ${parallax.lightY + 18}%, rgba(200,241,53,0.18), transparent 58%)`,
          filter: "blur(36px)",
        }}
        aria-hidden="true"
      />

      <motion.div
        className="relative w-full"
        animate={
          runtimeActive
            ? { rotateX: parallax.rotateX, rotateY: parallax.rotateY }
            : { rotateX: 0, rotateY: 0 }
        }
        transition={motionTransition(reduced, {
          type: "spring",
          stiffness: 180,
          damping: 28,
          mass: 0.45,
        })}
        style={{ transformStyle: "preserve-3d", perspective: 1200 }}
      >
        <div className="relative aspect-square min-h-[300px] w-full overflow-hidden rounded-3xl sm:min-h-[420px] lg:min-h-[520px]">
          {!posterFailed ? (
            <img
              src={fallbackImage}
              alt={alt}
              width={900}
              height={900}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              draggable={false}
              data-testid="hero-poster"
              onError={() => setPosterFailed(true)}
              className={`absolute inset-0 h-full w-full select-none object-contain transition-opacity duration-300 motion-reduce:transition-none ${
                loaded && canMountModel ? "opacity-0" : "opacity-100"
              }`}
            />
          ) : (
            <div
              role="img"
              aria-label={`تصویر در دسترس نیست: ${alt}`}
              data-image-fallback="true"
              className="absolute inset-0 flex items-center justify-center bg-surface-elevated p-8 text-center font-fa text-sm text-muted-foreground"
            >
              پیش‌نمایش تصویری محصول در دسترس نیست
            </div>
          )}

          {canMountModel && modelSrc ? (
            <model-viewer
              ref={modelRef as React.RefObject<HTMLElement>}
              src={modelSrc}
              poster={fallbackImage}
              alt=""
              aria-hidden="true"
              tabIndex={-1}
              camera-controls
              shadow-intensity="1.25"
              exposure="0.9"
              environment-image="neutral"
              field-of-view="28deg"
              min-camera-orbit="auto auto 82%"
              max-camera-orbit="auto auto 118%"
              interaction-prompt="none"
              data-testid="hero-model-viewer"
              style={{
                width: "100%",
                height: "100%",
                background: "transparent",
                ["--poster-color" as string]: "transparent",
                touchAction: "pan-y",
              }}
            />
          ) : null}

          {!activated && !reduced && supported ? (
            <button
              type="button"
              onClick={activate}
              data-testid="shoe-viewer-enable-3d"
              className="absolute inset-inline-end-4 top-4 z-10 inline-flex min-h-11 items-center rounded-full border border-border-strong bg-background/90 px-4 font-fa text-xs font-bold text-foreground backdrop-blur transition-colors hover:border-primary hover:text-primary"
            >
              فعال‌کردن نمای سه‌بعدی
            </button>
          ) : null}
        </div>
      </motion.div>

      <div
        className="mt-3 min-h-6 text-center font-fa text-xs text-muted-foreground"
        aria-live="polite"
      >
        {reduced
          ? "برای احترام به تنظیم کاهش حرکت، تصویر ثابت نمایش داده می‌شود."
          : !supported
            ? "نمای سه‌بعدی روی این دستگاه پشتیبانی نمی‌شود؛ تصویر ثابت در دسترس است."
            : errored
              ? "نمای سه‌بعدی بارگذاری نشد؛ تصویر ثابت در دسترس است."
              : activated && !inView
                ? "نمای سه‌بعدی خارج از صفحه متوقف شده است."
                : activated && !documentVisible
                  ? "نمای سه‌بعدی هنگام پنهان بودن صفحه متوقف می‌شود."
                  : activated && !modelSrc
                    ? "در حال آماده‌سازی نمای سه‌بعدی…"
                    : canMountModel && loaded && !interacted
                      ? "برای دیدن زاویه‌ها، مدل را به‌صورت افقی بکشید."
                      : !activated
                        ? "نمای سه‌بعدی اختیاری است و فقط پس از درخواست شما بارگذاری می‌شود."
                        : ""}
      </div>
    </div>
  );
}

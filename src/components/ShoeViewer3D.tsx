import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { useMouseParallax } from "@/hooks/useMouseParallax";

// TypeScript declaration for <model-viewer> web component (React 19 uses React.JSX)
type ModelViewerProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement> & {
    src?: string;
    alt?: string;
    poster?: string;
    "auto-rotate"?: boolean;
    "camera-controls"?: boolean;
    ar?: boolean;
    "shadow-intensity"?: string;
    exposure?: string;
    "environment-image"?: string;
    "rotation-per-second"?: string;
    "field-of-view"?: string;
    "min-camera-orbit"?: string;
    "max-camera-orbit"?: string;
    "disable-zoom"?: boolean;
    "interaction-prompt"?: string;
  },
  HTMLElement
>;

declare global {
  // React 19 reads intrinsic elements from React.JSX
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "model-viewer": ModelViewerProps;
      }
    }
  }
}

const hasWebGL = () => {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
};

// Deep model compression remains owned by F9/F11.
const MODEL_SRC = "/models/shoe.glb";

interface Props {
  fallbackImage: string;
  alt: string;
  priority?: boolean;
}

export function ShoeViewer3D({ fallbackImage, alt, priority = false }: Props) {
  const reduceMotion = useReducedMotion() === true;
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const modelRef = useRef<HTMLElement | null>(null);
  const parallax = useMouseParallax(12, 18);

  useEffect(() => {
    if (typeof window === "undefined" || reduceMotion) return;
    if (!hasWebGL()) {
      setSupported(false);
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;

    const load = () => {
      import("@google/model-viewer")
        .then(() => {
          if (!cancelled) setReady(true);
        })
        .catch(() => {
          if (!cancelled) setErrored(true);
        });
    };

    const idleWindow = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof idleWindow.requestIdleCallback === "function") {
      idleId = idleWindow.requestIdleCallback(load, { timeout: 1800 });
    } else {
      timeoutId = setTimeout(load, 350);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined) idleWindow.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [reduceMotion]);

  useEffect(() => {
    const element = modelRef.current;
    if (!element || !ready) return;

    const onLoad = () => setLoaded(true);
    const onError = () => setErrored(true);
    const onInteraction = () => setInteracted(true);
    const interactionEvents = ["pointerdown", "wheel", "touchstart"] as const;

    element.addEventListener("load", onLoad);
    element.addEventListener("error", onError);
    interactionEvents.forEach((eventName) =>
      element.addEventListener(eventName, onInteraction, { once: true }),
    );

    return () => {
      element.removeEventListener("load", onLoad);
      element.removeEventListener("error", onError);
      interactionEvents.forEach((eventName) =>
        element.removeEventListener(eventName, onInteraction),
      );
    };
  }, [ready]);

  const canRenderModel = ready && supported && !errored && !reduceMotion;
  const rotateX = reduceMotion ? 0 : parallax.rotateX;
  const rotateY = reduceMotion ? 0 : parallax.rotateY;

  return (
    <div className="relative w-full" data-testid="shoe-viewer">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(circle at ${reduceMotion ? 50 : parallax.lightX}% ${
            reduceMotion ? 60 : parallax.lightY + 20
          }%, rgba(200,241,53,0.24), transparent 58%)`,
          filter: "blur(42px)",
        }}
        aria-hidden="true"
      />

      <motion.div
        className="relative w-full"
        animate={{ rotateX, rotateY }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 150, damping: 22, mass: 0.5 }
        }
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
                loaded && canRenderModel ? "opacity-0" : "opacity-100"
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

          {canRenderModel ? (
            <model-viewer
              ref={modelRef as React.RefObject<HTMLElement>}
              src={MODEL_SRC}
              poster={fallbackImage}
              alt=""
              aria-hidden="true"
              tabIndex={-1}
              auto-rotate
              camera-controls
              shadow-intensity="1.5"
              exposure="0.8"
              rotation-per-second="20deg"
              environment-image="neutral"
              field-of-view="25deg"
              min-camera-orbit="auto auto 80%"
              max-camera-orbit="auto auto 120%"
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
        </div>
      </motion.div>

      {canRenderModel && loaded && !interacted ? (
        <p
          aria-hidden="true"
          className="mt-3 text-center font-fa text-xs text-muted-foreground"
        >
          برای مشاهده زاویه‌ها، مدل را بکشید.
        </p>
      ) : null}
    </div>
  );
}

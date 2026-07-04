import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
};

// TODO: Replace /models/shoe.glb with an optimized model.
// Target: under 3MB, use Draco compression.
// Free sneaker GLBs: Sketchfab.com (search "sneaker", filter: free + downloadable).
// Compress with: npx gltf-pipeline -i shoe.glb -o shoe-compressed.glb --draco.compressionLevel 10
const MODEL_SRC = "/models/shoe.glb";

interface Props {
  fallbackImage: string;
  alt: string;
}

export function ShoeViewer3D({ fallbackImage, alt }: Props) {
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const mvRef = useRef<HTMLElement | null>(null);
  const parallax = useMouseParallax(12, 18);

  // Lazy load the model-viewer script after idle
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasWebGL()) {
      setSupported(false);
      return;
    }
    const load = () => {
      import("@google/model-viewer")
        .then(() => setReady(true))
        .catch(() => setErrored(true));
    };
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void) => number;
    };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(load);
    } else {
      setTimeout(load, 200);
    }
  }, []);

  // Track first user interaction to hide the "drag to explore" hint
  useEffect(() => {
    const el = mvRef.current;
    if (!el) return;
    const handler = () => setInteracted(true);
    const events = ["pointerdown", "wheel", "touchstart"];
    events.forEach((e) => el.addEventListener(e, handler, { once: true }));
    return () => {
      events.forEach((e) => el.removeEventListener(e, handler));
    };
  }, [ready]);

  // Attach load/error listeners on the web component
  useEffect(() => {
    const el = mvRef.current;
    if (!el || !ready) return;
    const onLoad = () => setLoaded(true);
    const onError = () => setErrored(true);
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
    };
  }, [ready]);

  const showFallback = !supported || errored;

  return (
    <div className="relative w-full">
      {/* Neon glow shadow that shifts with mouse */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 transition-opacity"
        style={{
          background: `radial-gradient(circle at ${parallax.lightX}% ${parallax.lightY + 20}%, rgba(200,241,53,0.30), transparent 55%)`,
          filter: "blur(40px)",
        }}
        aria-hidden
      />

      <motion.div
        className="relative w-full"
        style={{
          transformStyle: "preserve-3d",
          perspective: 1200,
        }}
        animate={{ rotateX: parallax.rotateX, rotateY: parallax.rotateY }}
        transition={{ type: "spring", stiffness: 150, damping: 20, mass: 0.5 }}
      >
        <div className="relative h-[320px] md:h-[500px] w-full">
          {/* Skeleton while loading */}
          {!loaded && !showFallback && (
            <div className="absolute inset-0 rounded-3xl bg-surface animate-pulse" />
          )}

          {/* 3D model */}
          {ready && !showFallback && (
            <model-viewer
              ref={mvRef as React.RefObject<HTMLElement>}
              src={MODEL_SRC}
              alt={alt}
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
              style={{
                width: "100%",
                height: "100%",
                background: "transparent",
                ["--poster-color" as string]: "transparent",
                touchAction: "pan-y",
              }}
            />
          )}

          {/* Static fallback (also shown while GLB is unavailable) */}
          {showFallback && (
            <img
              src={fallbackImage}
              alt={alt}
              className="w-full h-full object-contain rounded-3xl select-none pointer-events-none"
              draggable={false}
            />
          )}
        </div>
      </motion.div>

      {/* Drag hint */}
      {ready && loaded && !interacted && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.6 }}
          className="mt-3 flex items-center justify-center gap-3 eyebrow text-muted-foreground text-[10px]"
          aria-hidden
        >
          <motion.span
            animate={{ x: [-4, 0, -4] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
          >
            ←
          </motion.span>
          Drag to explore
          <motion.span
            animate={{ x: [4, 0, 4] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
          >
            →
          </motion.span>
        </motion.div>
      )}
    </div>
  );
}

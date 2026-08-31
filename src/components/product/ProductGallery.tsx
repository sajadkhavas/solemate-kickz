import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Expand, ImageOff, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { ResponsiveCatalogImage } from "@/components/catalog/ResponsiveCatalogImage";
import { IconButton } from "@/components/ui/commerce-primitives";
import type { Shoe } from "@/data/shoes";

type SafeImageProps = {
  shoe: Shoe;
  src: string;
  alt: string;
  className: string;
  testId?: string;
  onFailure?: () => void;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  width?: number;
  height?: number;
  sizes?: string;
};

function SafeImage({
  shoe,
  src,
  alt,
  className,
  testId,
  onFailure,
  loading = "lazy",
  fetchPriority = "auto",
  width,
  height,
  sizes = "100vw",
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (failed) {
    return (
      <div
        data-testid={testId ? `${testId}-fallback` : undefined}
        role="img"
        aria-label={`تصویر ${alt} در دسترس نیست`}
        className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface text-center text-muted-foreground"
      >
        <ImageOff aria-hidden="true" className="size-8" />
        <span className="font-fa text-xs">پیش‌نمایش تصویر در دسترس نیست</span>
      </div>
    );
  }

  return (
    <ResponsiveCatalogImage
      shoe={shoe}
      data-testid={testId}
      src={src}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      onError={() => {
        setFailed(true);
        onFailure?.();
      }}
    />
  );
}

type ProductGalleryProps = {
  shoe: Shoe;
};

export function ProductGallery({ shoe }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const imageCount = Math.max(1, shoe.images.length);

  useEffect(() => {
    setActiveIndex(0);
    setZoomOpen(false);
  }, [shoe.id]);

  const goTo = (nextIndex: number) => {
    setActiveIndex((nextIndex + imageCount) % imageCount);
  };

  const previous = () => goTo(activeIndex - 1);
  const next = () => goTo(activeIndex + 1);

  const handleKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      previous();
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(imageCount - 1);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStart.current = event.clientX;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (start === null) return;
    const delta = event.clientX - start;
    if (Math.abs(delta) < 44) return;
    if (delta < 0) next();
    else previous();
  };

  const activeImage = shoe.images[activeIndex] ?? shoe.image;

  return (
    <section
      data-testid="product-gallery"
      aria-label={`گالری تصاویر ${shoe.brand} ${shoe.name}`}
      className="min-w-0"
    >
      <div
        data-testid="product-gallery-stage"
        tabIndex={0}
        onKeyDown={handleKeyboard}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="group relative aspect-square touch-pan-y overflow-hidden rounded-3xl border border-border bg-surface outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <SafeImage
          key={`${shoe.id}-${activeIndex}`}
          shoe={shoe}
          src={activeImage}
          alt={`${shoe.brand} ${shoe.name}، نمای ${activeIndex + 1}`}
          testId="product-main-image"
          loading="eager"
          fetchPriority="high"
          width={900}
          height={900}
          sizes="(min-width: 1024px) 54vw, 100vw"
          className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-[1.02]"
        />

        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-3">
          <span className="rounded-full bg-background/90 px-3 py-2 font-mono-num text-xs text-foreground backdrop-blur">
            {activeIndex + 1} / {imageCount}
          </span>
          <IconButton
            label="نمایش تصویر بزرگ"
            variant="secondary"
            onClick={() => setZoomOpen(true)}
            data-testid="product-gallery-zoom"
            className="rounded-full bg-background/90 backdrop-blur"
          >
            <Expand aria-hidden="true" />
          </IconButton>
        </div>

        {imageCount > 1 ? (
          <>
            <IconButton
              label="تصویر قبلی"
              variant="secondary"
              onClick={previous}
              data-testid="product-gallery-previous"
              className="absolute inset-inline-start-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 backdrop-blur"
            >
              <ChevronRight aria-hidden="true" />
            </IconButton>
            <IconButton
              label="تصویر بعدی"
              variant="secondary"
              onClick={next}
              data-testid="product-gallery-next"
              className="absolute inset-inline-end-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 backdrop-blur"
            >
              <ChevronLeft aria-hidden="true" />
            </IconButton>
          </>
        ) : null}

        <p className="absolute inset-x-3 bottom-3 rounded-full bg-background/90 px-3 py-2 text-center font-fa text-xs text-muted-foreground backdrop-blur">
          با کلیدهای جهت‌دار یا کشیدن افقی، نما را عوض کنید.
        </p>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        نمای {activeIndex + 1} از {imageCount}
      </p>

      <div role="tablist" aria-label="انتخاب نمای محصول" className="mt-4 grid grid-cols-4 gap-3">
        {shoe.images.map((image, index) => {
          const selected = activeIndex === index;
          return (
            <button
              key={`${shoe.id}-${index}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-current={selected ? "true" : undefined}
              aria-label={`نمای ${index + 1} از ${imageCount}`}
              data-testid="product-thumbnail"
              onClick={() => goTo(index)}
              className="relative aspect-square min-h-11 overflow-hidden rounded-xl border-2 border-border bg-surface outline-none transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-focus aria-selected:border-primary"
            >
              <SafeImage
                shoe={shoe}
                src={image}
                alt=""
                loading="lazy"
                fetchPriority="low"
                width={220}
                height={220}
                sizes="220px"
                className="h-full w-full object-cover"
              />
            </button>
          );
        })}
      </div>

      <DialogPrimitive.Root open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-overlay backdrop-blur-sm" />
          <DialogPrimitive.Content
            data-testid="product-gallery-dialog"
            aria-describedby={undefined}
            className="fixed inset-3 z-[var(--z-modal)] mx-auto flex max-w-5xl flex-col rounded-2xl border border-border bg-background p-3 shadow-[var(--shadow-overlay)] outline-none sm:inset-8"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <DialogPrimitive.Title className="font-fa text-sm font-bold">
                {shoe.brand} {shoe.name} — نمای {activeIndex + 1}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close asChild>
                <IconButton label="بستن تصویر بزرگ" variant="ghost">
                  <X aria-hidden="true" />
                </IconButton>
              </DialogPrimitive.Close>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-surface">
              <SafeImage
                shoe={shoe}
                src={activeImage}
                alt={`${shoe.brand} ${shoe.name}، نمای بزرگ ${activeIndex + 1}`}
                sizes="100vw"
                className="h-full w-full object-contain"
              />
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </section>
  );
}

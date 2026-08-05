import { useState, type ImgHTMLAttributes } from "react";

interface HomeImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "onError"> {
  src: string;
  alt: string;
  fallbackLabel?: string;
  fallbackClassName?: string;
}

export function HomeImage({
  src,
  alt,
  fallbackLabel = "تصویر این بخش در دسترس نیست",
  fallbackClassName,
  className,
  ...imageProps
}: HomeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${fallbackLabel}: ${alt}`}
        data-image-fallback="true"
        className={
          fallbackClassName ??
          `${className ?? ""} flex items-center justify-center bg-surface-elevated p-6 text-center font-fa text-sm text-muted-foreground`
        }
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    <img
      {...imageProps}
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

import { useEffect, useState } from "react";

interface CartProductImageProps {
  src: string;
  alt: string;
  className?: string;
  testId?: string;
}

export function CartProductImage({ src, alt, className = "", testId }: CartProductImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} — تصویر در دسترس نیست`}
        data-testid={testId ? `${testId}-fallback` : undefined}
        className={`grid place-items-center bg-surface-elevated p-3 text-center ${className}`}
      >
        <span className="font-display text-sm font-black text-muted-foreground">SOLE</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={160}
      height={160}
      onError={() => setFailed(true)}
      data-testid={testId}
      className={className}
    />
  );
}

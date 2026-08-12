import * as React from "react";
import { Search, X } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type IconButtonProps = Omit<ButtonProps, "size" | "aria-label"> & {
  label: string;
  size?: "sm" | "default";
};

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, size = "default", className, children, ...props }, ref) => (
    <Button
      ref={ref}
      size="icon"
      aria-label={label}
      className={cn(size === "sm" && "size-11", className)}
      {...props}
    >
      {children}
    </Button>
  ),
);
IconButton.displayName = "IconButton";

type TextLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  asChild?: boolean;
};

const TextLink = React.forwardRef<HTMLAnchorElement, TextLinkProps>(
  ({ asChild = false, className, ...props }, ref) => {
    const Component = asChild ? Slot : "a";
    return (
      <Component
        ref={ref}
        className={cn(
          "inline-flex min-h-11 items-center rounded-sm font-medium text-primary underline-offset-4 transition-colors hover:text-[var(--primary-hover)] hover:underline focus-visible:outline-none",
          className,
        )}
        {...props}
      />
    );
  },
);
TextLink.displayName = "TextLink";

type SearchInputProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  clearLabel?: string;
  onClear?: () => void;
};

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, defaultValue, clearLabel = "پاک‌کردن جستجو", onClear, ...props }, ref) => {
    const hasValue =
      value !== undefined ? String(value).length > 0 : String(defaultValue ?? "").length > 0;

    return (
      <div className="relative" role="search">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute inset-inline-start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={ref}
          type="text"
          value={value}
          defaultValue={defaultValue}
          className={cn("min-h-11 ps-10 pe-11", className)}
          {...props}
        />
        {onClear ? (
          <button
            type="button"
            aria-label={hasValue ? clearLabel : undefined}
            aria-hidden={!hasValue || undefined}
            disabled={!hasValue}
            tabIndex={hasValue ? undefined : -1}
            onClick={onClear}
            className={cn(
              "absolute inset-inline-end-1 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-interactive hover:text-foreground",
              !hasValue && "invisible pointer-events-none",
            )}
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";

type PriceProps = React.HTMLAttributes<HTMLSpanElement> & {
  value: number;
  currency?: string;
  locale?: string;
};

function Price({ value, currency = "تومان", locale = "fa-IR", className, ...props }: PriceProps) {
  const formattedValue = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);

  return (
    <span
      dir="rtl"
      className={cn(
        "inline-flex items-baseline gap-1 font-mono-num text-[length:var(--text-price)]",
        className,
      )}
      {...props}
    >
      <bdi dir="ltr">{formattedValue}</bdi>
      <span className="font-fa text-[0.7em] font-medium">{currency}</span>
    </span>
  );
}

type DiscountPriceProps = Omit<PriceProps, "value"> & {
  price: number;
  originalPrice: number;
};

function DiscountPrice({ price, originalPrice, className, ...props }: DiscountPriceProps) {
  if (originalPrice <= price) {
    return <Price value={price} className={className} {...props} />;
  }

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <Price value={price} className="text-sale" {...props} />
      <Price
        value={originalPrice}
        aria-label={`قیمت قبلی ${originalPrice}`}
        className="text-sm text-muted-foreground line-through decoration-current"
        {...props}
      />
    </span>
  );
}

type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

type StockStateProps = React.HTMLAttributes<HTMLSpanElement> & {
  status: StockStatus;
  label?: string;
};

const STOCK_CONFIG: Record<StockStatus, { label: string; className: string }> = {
  "in-stock": { label: "موجود", className: "text-stock-in" },
  "low-stock": { label: "موجودی محدود", className: "text-stock-low" },
  "out-of-stock": { label: "ناموجود", className: "text-stock-out" },
};

function StockState({ status, label, className, ...props }: StockStateProps) {
  const config = STOCK_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium",
        config.className,
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="size-2 rounded-full border border-current bg-current" />
      {label ?? config.label}
    </span>
  );
}

type QuantityStepperProps = {
  value: number;
  onChange: (nextValue: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
};

function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  label = "تعداد محصول",
  className,
}: QuantityStepperProps) {
  const minimumSafeValue = Math.max(min, value);
  const safeValue =
    typeof max === "number" ? Math.min(max, Math.max(min, value)) : minimumSafeValue;
  const canDecrease = !disabled && safeValue > min;
  const canIncrease = !disabled && (typeof max !== "number" || safeValue < max);

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full border border-border bg-interactive p-1",
        className,
      )}
    >
      <IconButton
        label="کاهش تعداد"
        size="sm"
        variant="ghost"
        disabled={!canDecrease}
        onClick={() => onChange(Math.max(min, safeValue - 1))}
        className="rounded-full"
      >
        <span aria-hidden="true">−</span>
      </IconButton>
      <output
        aria-live="polite"
        aria-atomic="true"
        className="min-w-10 text-center font-mono-num text-sm"
      >
        {safeValue}
      </output>
      <IconButton
        label="افزایش تعداد"
        size="sm"
        variant="ghost"
        disabled={!canIncrease}
        onClick={() =>
          onChange(typeof max === "number" ? Math.min(max, safeValue + 1) : safeValue + 1)
        }
        className="rounded-full"
      >
        <span aria-hidden="true">+</span>
      </IconButton>
    </div>
  );
}

type SpinnerProps = React.HTMLAttributes<HTMLSpanElement> & {
  label?: string;
};

function Spinner({ label = "در حال بارگذاری", className, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}
      {...props}
    >
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
      />
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  );
}

type StateProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
};

function EmptyState({ title, description, icon, action, className, ...props }: StateProps) {
  return (
    <div
      className={cn(
        "flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface p-6 text-center",
        className,
      )}
      {...props}
    >
      {icon ? (
        <div aria-hidden="true" className="text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

function ErrorState({ title, description, icon, action, className, ...props }: StateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-danger/50 bg-danger/5 p-6 text-center",
        className,
      )}
      {...props}
    >
      {icon ? (
        <div aria-hidden="true" className="text-danger">
          {icon}
        </div>
      ) : null}
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

const VisuallyHidden = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn("sr-only", className)} {...props} />
  ),
);
VisuallyHidden.displayName = "VisuallyHidden";

export {
  DiscountPrice,
  EmptyState,
  ErrorState,
  IconButton,
  Price,
  QuantityStepper,
  SearchInput,
  Spinner,
  StockState,
  TextLink,
  VisuallyHidden,
};
export type { StockStatus };
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-[background-color,color,border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-[var(--opacity-disabled)] aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-[var(--opacity-disabled)] motion-reduce:transition-none motion-reduce:active:translate-y-0 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-[var(--primary-hover)]",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:border-[var(--border-strong)] hover:bg-interactive hover:text-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-interactive hover:text-foreground",
        link: "min-h-11 text-primary underline-offset-4 hover:text-[var(--primary-hover)] hover:underline",
      },
      size: {
        default: "px-4 py-2",
        sm: "min-h-11 rounded-md px-3 text-xs",
        lg: "min-h-12 rounded-md px-8",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      type,
      disabled,
      loading = false,
      loadingLabel = "در حال انجام",
      children,
      onClick,
      tabIndex,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const unavailable = disabled || loading;
    const classes = cn(buttonVariants({ variant, size, className }));

    if (asChild) {
      const handleClick: React.MouseEventHandler<HTMLElement> = (event) => {
        if (unavailable) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        onClick?.(event as unknown as React.MouseEvent<HTMLButtonElement>);
      };

      return (
        <Slot
          {...props}
          className={classes}
          ref={ref}
          aria-label={loading ? loadingLabel : ariaLabel}
          aria-disabled={unavailable || undefined}
          aria-busy={loading || undefined}
          data-disabled={unavailable ? "true" : undefined}
          data-loading={loading ? "true" : undefined}
          tabIndex={unavailable ? -1 : tabIndex}
          onClick={handleClick}
        >
          {React.Children.only(children)}
        </Slot>
      );
    }

    return (
      <button
        {...props}
        className={classes}
        ref={ref}
        type={type ?? "button"}
        disabled={unavailable}
        aria-label={ariaLabel}
        aria-busy={loading || undefined}
        data-loading={loading ? "true" : undefined}
        tabIndex={tabIndex}
        onClick={onClick}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="absolute size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
          />
        ) : null}
        <span className={cn(loading && "invisible")}>{children}</span>
        {loading ? <span className="sr-only">{loadingLabel}</span> : null}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

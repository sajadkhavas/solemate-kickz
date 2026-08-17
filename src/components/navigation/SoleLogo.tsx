import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export function SoleLogo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="SOLE، بازگشت به خانه"
      className={cn(
        "inline-flex min-h-11 items-center rounded-sm font-display text-2xl font-black tracking-tighter focus-visible:outline-none",
        className,
      )}
    >
      <bdi dir="ltr">
        SOLE<span className="text-primary">.</span>
      </bdi>
    </Link>
  );
}

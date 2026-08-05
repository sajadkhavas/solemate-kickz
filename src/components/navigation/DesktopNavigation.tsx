import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

import { CATEGORIES } from "@/data/shoes";
import { cn } from "@/lib/utils";

const PRIMARY_LINKS = [
  { to: "/", label: "خانه", exact: true },
  { to: "/products", label: "فروشگاه" },
  { to: "/brands", label: "برندها" },
  { to: "/about", label: "درباره SOLE" },
] as const;

function routeIsActive(pathname: string, to: string, exact = false) {
  return exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
}

function NavigationLink({
  to,
  label,
  exact,
}: {
  to: (typeof PRIMARY_LINKS)[number]["to"];
  label: string;
  exact?: boolean;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const active = routeIsActive(pathname, to, exact);

  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex min-h-11 items-center rounded-md px-3 font-fa text-sm font-semibold text-muted-foreground transition-colors hover:bg-interactive hover:text-foreground focus-visible:outline-none",
        active && "text-foreground",
      )}
    >
      {label}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-primary transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />
    </Link>
  );
}

export function DesktopNavigation() {
  return (
    <nav aria-label="ناوبری اصلی" className="hidden flex-1 items-center justify-center gap-1 md:flex">
      <NavigationLink to="/" label="خانه" exact />

      <div className="inline-flex items-center">
        <NavigationLink to="/products" label="فروشگاه" />
        <DropdownMenuPrimitive.Root dir="rtl">
          <DropdownMenuPrimitive.Trigger
            data-testid="desktop-menu-trigger"
            aria-label="بازکردن دسته‌بندی‌های فروشگاه"
            className="group inline-flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-interactive hover:text-foreground focus-visible:outline-none data-[state=open]:bg-interactive data-[state=open]:text-primary"
          >
            <ChevronDown
              aria-hidden="true"
              className="size-4 transition-transform motion-reduce:transition-none group-data-[state=open]:rotate-180"
            />
          </DropdownMenuPrimitive.Trigger>
          <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
              data-testid="desktop-menu-content"
              align="center"
              sideOffset={8}
              collisionPadding={16}
              className="z-[var(--z-popover)] w-[min(42rem,calc(100vw-2rem))] rounded-xl border border-border-strong bg-surface-elevated p-3 shadow-[var(--shadow-overlay)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out motion-reduce:animate-none"
            >
              <div className="mb-2 px-2 py-1">
                <p className="font-fa text-sm font-semibold text-foreground">دسته‌بندی‌های داده‌های نمونه</p>
                <p className="mt-1 font-fa text-xs text-muted-foreground">
                  انتخاب هر مورد، فیلتر واقعی صفحه فروشگاه را باز می‌کند.
                </p>
              </div>
              <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                {CATEGORIES.map((category) => (
                  <DropdownMenuPrimitive.Item key={category.id} asChild>
                    <Link
                      to="/products"
                      search={{ category: category.id, sort: "newest" } as never}
                      className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 font-fa text-sm outline-none transition-colors hover:bg-interactive focus:bg-interactive focus:text-primary"
                    >
                      <span aria-hidden="true" className="text-lg">
                        {category.icon}
                      </span>
                      <span className="min-w-0">
                        <bdi dir="ltr" className="block truncate font-display text-xs font-bold">
                          {category.label}
                        </bdi>
                        <span className="block text-xs text-muted-foreground">{category.fa}</span>
                      </span>
                    </Link>
                  </DropdownMenuPrimitive.Item>
                ))}
              </div>
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>
      </div>

      <NavigationLink to="/brands" label="برندها" />
      <NavigationLink to="/about" label="درباره SOLE" />
    </nav>
  );
}

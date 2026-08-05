import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect } from "react";

import { CATEGORIES } from "@/data/shoes";
import { useStore } from "@/store";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { IconButton } from "@/components/ui/commerce-primitives";
import { SoleLogo } from "@/components/navigation/SoleLogo";

const MOBILE_LINKS = [
  { to: "/", label: "خانه" },
  { to: "/products", label: "فروشگاه" },
  { to: "/brands", label: "برندها" },
  { to: "/about", label: "درباره SOLE" },
  { to: "/cart", label: "سبد خرید" },
  { to: "/auth", label: "ورود یا حساب کاربری" },
] as const;

function restoreMobileMenuTriggerFocus() {
  const trigger = document.querySelector<HTMLElement>('[data-testid="mobile-menu-trigger"]');
  trigger?.focus({ preventScroll: true });
}

export function MobileNavigation() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const open = useStore((state) => state.isMobileNavOpen);
  const setOpen = useStore((state) => state.setMobileNavOpen);

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <IconButton
          label="بازکردن منوی اصلی"
          variant="ghost"
          data-testid="mobile-menu-trigger"
          className="md:hidden"
        >
          <Menu aria-hidden="true" className="size-5" />
        </IconButton>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-testid="mobile-menu-overlay"
          className="fixed inset-0 z-[var(--z-overlay)] bg-overlay backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 motion-reduce:animate-none md:hidden"
        />
        <DialogPrimitive.Content
          data-testid="mobile-menu-content"
          dir="rtl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreMobileMenuTriggerFocus();
          }}
          className="fixed inset-y-0 right-0 z-[var(--z-modal)] flex w-[min(90vw,24rem)] flex-col border-l border-border-strong bg-surface-elevated shadow-[var(--shadow-overlay)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right motion-reduce:animate-none md:hidden"
        >
          <div className="flex min-h-16 items-center justify-between border-b border-border px-4 pt-[env(safe-area-inset-top)]">
            <SoleLogo />
            <DialogPrimitive.Close asChild>
              <IconButton
                label="بستن منوی اصلی"
                variant="ghost"
                data-testid="mobile-menu-close"
              >
                <X aria-hidden="true" className="size-5" />
              </IconButton>
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-[calc(6rem+env(safe-area-inset-bottom))]">
            <DialogPrimitive.Title className="font-fa text-lg font-bold text-foreground">
              منوی اصلی
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-1 font-fa text-sm text-muted-foreground">
              مسیرهای واقعی نسخه نمایشی فرانت‌اند SOLE
            </DialogPrimitive.Description>

            <nav aria-label="ناوبری موبایل" className="mt-5 space-y-1">
              {MOBILE_LINKS.map((item) => {
                const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className="relative flex min-h-11 items-center justify-between rounded-lg px-3 font-fa text-sm font-semibold text-foreground transition-colors hover:bg-interactive focus-visible:outline-none"
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={`size-2 rounded-full border border-current ${
                        active
                          ? "bg-primary text-primary"
                          : "bg-transparent text-muted-foreground"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            <Accordion type="single" collapsible className="mt-5 border-y border-border">
              <AccordionItem value="categories" className="border-0">
                <AccordionTrigger className="min-h-11 py-3 font-fa text-sm no-underline hover:no-underline">
                  دسته‌بندی‌های فروشگاه
                </AccordionTrigger>
                <AccordionContent className="grid gap-2 sm:grid-cols-2">
                  {CATEGORIES.map((category) => (
                    <Link
                      key={category.id}
                      to="/products"
                      search={{ category: category.id, sort: "newest" } as never}
                      className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 font-fa text-sm transition-colors hover:border-border-strong hover:bg-interactive focus-visible:outline-none"
                    >
                      <span aria-hidden="true">{category.icon}</span>
                      <span>
                        <bdi dir="ltr" className="block font-display text-xs font-bold">
                          {category.label}
                        </bdi>
                        <span className="block text-xs text-muted-foreground">{category.fa}</span>
                      </span>
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <p className="mt-5 rounded-lg border border-border bg-background p-3 font-fa text-xs leading-6 text-muted-foreground">
              این نسخه فقط رابط فرانت‌اند است و وضعیت واقعی حساب، ارسال یا موجودی تجاری را
              تأیید نمی‌کند.
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

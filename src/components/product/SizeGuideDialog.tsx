import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Footprints, Ruler, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/commerce-primitives";

type SizeGuideDialogProps = {
  sizes: number[];
};

export function SizeGuideDialog({ sizes }: SizeGuideDialogProps) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <Button
          variant="link"
          size="sm"
          data-testid="size-guide-trigger"
          className="px-0 font-fa"
        >
          <Ruler aria-hidden="true" />
          راهنمای انتخاب سایز
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-overlay backdrop-blur-sm" />
        <DialogPrimitive.Content
          data-testid="size-guide-dialog"
          dir="rtl"
          className="fixed inset-x-3 top-1/2 z-[var(--z-modal)] mx-auto max-h-[85dvh] max-w-xl -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-[var(--shadow-overlay)] outline-none sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="font-fa text-xl font-bold">
                راهنمای عمومی انتخاب سایز
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-2 font-fa text-sm leading-7 text-muted-foreground">
                Dataset فعلی نمودار یا جدول رسمی برند و طول داخلی کفش را ندارد؛ بنابراین این
                راهنما فقط روش اندازه‌گیری را توضیح می‌دهد و جایگزین جدول رسمی سازنده نیست.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <IconButton label="بستن راهنمای سایز" variant="ghost">
                <X aria-hidden="true" />
              </IconButton>
            </DialogPrimitive.Close>
          </div>

          <ol className="mt-6 space-y-4 font-fa text-sm leading-7">
            <li className="flex gap-3">
              <Footprints aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
              <span>پا را با جورابی که معمولاً با کفش می‌پوشید روی یک کاغذ قرار دهید.</span>
            </li>
            <li className="flex gap-3">
              <Ruler aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
              <span>از انتهای پاشنه تا بلندترین انگشت را اندازه بگیرید و پای بزرگ‌تر را مبنا قرار دهید.</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                ۳
              </span>
              <span>عدد به‌دست‌آمده را با جدول رسمی همان برند مقایسه کنید؛ قالب برندها یکسان نیست.</span>
            </li>
          </ol>

          <section className="mt-6 rounded-xl border border-border bg-surface p-4">
            <h3 className="font-fa text-sm font-bold">سایزهای ثبت‌شده برای این محصول</h3>
            <div className="mt-3 flex flex-wrap gap-2" aria-label="سایزهای قابل انتخاب">
              {sizes.map((size) => (
                <span
                  key={size}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-background px-3 font-mono-num text-sm"
                >
                  EU {size}
                </span>
              ))}
            </div>
          </section>

          <p className="mt-4 font-fa text-xs leading-6 text-muted-foreground">
            برای تصمیم قطعی، جدول رسمی برند و شرایط تعویض فروشنده باید از Backend یا محتوای
            تأییدشده دریافت شود.
          </p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

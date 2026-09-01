import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Footprints, Ruler, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/commerce-primitives";
import type { Shoe } from "@/data/shoes";

type Props = { sizes: number[]; sizeGuide?: Shoe["sizeGuide"] };

export function SizeGuideDialog({ sizes, sizeGuide }: Props) {
  const [footLength, setFootLength] = useState("");
  const recommendation = useMemo(() => {
    const mm = Number(footLength);
    if (!sizeGuide || !Number.isInteger(mm) || mm < 180 || mm > 340) return null;
    const exact = sizeGuide.entries.find(
      (entry) => mm >= entry.footLengthMinMm && mm <= entry.footLengthMaxMm,
    );
    if (exact)
      return {
        size: exact.euSize,
        confidence: sizeGuide.verifiedAt ? "زیاد" : "متوسط",
        reason: "اندازه داخل بازه ثبت‌شده است.",
      };
    const nearest = [...sizeGuide.entries].sort(
      (a, b) =>
        Math.min(Math.abs(mm - a.footLengthMinMm), Math.abs(mm - a.footLengthMaxMm)) -
        Math.min(Math.abs(mm - b.footLengthMinMm), Math.abs(mm - b.footLengthMaxMm)),
    )[0];
    if (!nearest) return null;
    const distance = Math.min(
      Math.abs(mm - nearest.footLengthMinMm),
      Math.abs(mm - nearest.footLengthMaxMm),
    );
    return distance <= 5
      ? { size: nearest.euSize, confidence: "کم", reason: "نزدیک‌ترین مرز جدول ثبت‌شده است." }
      : { size: null, confidence: "کم", reason: "اندازه خارج از بازه قابل پشتیبانی است." };
  }, [footLength, sizeGuide]);

  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <Button variant="link" size="sm" data-testid="size-guide-trigger" className="px-0 font-fa">
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
                راهنمای اندازه و تناسب
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-2 font-fa text-sm leading-7 text-muted-foreground">
                پیشنهاد سایز راهنمای تصمیم است و تضمین نیست؛ فرم پا، عرض و ترجیح شخصی می‌تواند نتیجه
                را تغییر دهد.
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
              <span>عصر، با جوراب معمول، هر دو پا را روی کاغذ اندازه بگیرید.</span>
            </li>
            <li className="flex gap-3">
              <Ruler aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
              <span>فاصله پاشنه تا بلندترین انگشت پای بزرگ‌تر را به میلی‌متر ثبت کنید.</span>
            </li>
          </ol>
          {sizeGuide ? (
            <section
              className="mt-6 rounded-xl border border-border bg-surface p-4"
              aria-labelledby="fit-recommendation-title"
            >
              <h3 id="fit-recommendation-title" className="font-fa text-sm font-bold">
                پیشنهاد مبتنی بر جدول ثبت‌شده
              </h3>
              <label
                htmlFor="foot-length"
                className="mt-3 block font-fa text-xs text-muted-foreground"
              >
                طول پای بزرگ‌تر (۱۸۰ تا ۳۴۰ میلی‌متر)
              </label>
              <input
                id="foot-length"
                inputMode="numeric"
                value={footLength}
                onChange={(event) =>
                  setFootLength(event.target.value.replace(/\D/g, "").slice(0, 3))
                }
                className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 font-mono-num outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
              <div
                aria-live="polite"
                data-testid="fit-recommendation"
                className="mt-3 font-fa text-sm leading-7"
              >
                {recommendation ? (
                  <>
                    <p className="font-bold">
                      {recommendation.size
                        ? `پیشنهاد: EU ${recommendation.size}`
                        : "پیشنهاد مطمئنی در دسترس نیست"}
                    </p>
                    <p>
                      اطمینان: {recommendation.confidence} — {recommendation.reason}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">برای دریافت راهنما، طول پا را وارد کنید.</p>
                )}
              </div>
              <p className="mt-3 font-fa text-xs text-muted-foreground">
                منبع: {sizeGuide.sourceLabel}. اندازه واردشده در مرورگر محاسبه می‌شود و در Analytics
                ذخیره نمی‌شود.
              </p>
            </section>
          ) : (
            <p className="mt-6 rounded-xl border border-border bg-surface p-4 font-fa text-sm leading-7">
              برای این مدل هنوز جدول منبع‌دار منتشر نشده است؛ انتخاب را فقط براساس جدول رسمی همان
              برند انجام دهید.
            </p>
          )}
          <section className="mt-6 rounded-xl border border-border bg-surface p-4">
            <h3 className="font-fa text-sm font-bold">سایزهای قابل انتخاب این محصول</h3>
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
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

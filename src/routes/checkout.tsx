import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, CheckCircle2, MapPin, ShoppingBag, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";

import { resolveCart } from "@/cart/cart-domain";
import {
  EMPTY_CHECKOUT_DRAFT,
  normalizeDigits,
  normalizePhone,
  sanitizeCheckoutDraft,
  validateCheckoutDraft,
  type CheckoutDraft,
  type CheckoutErrors,
  type CheckoutField,
} from "@/checkout/checkout-domain";
import { CartProductImage } from "@/components/cart/CartProductImage";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/commerce-primitives";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/data/shoes";
import { useStore } from "@/store";

const CHECKOUT_DRAFT_KEY = "sole-checkout-draft-v1";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout نمایشی — SOLE" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: CheckoutPage,
});

const FIELD_LABELS: Record<CheckoutField, string> = {
  firstName: "نام",
  lastName: "نام خانوادگی",
  phone: "شماره تماس",
  email: "ایمیل",
  province: "استان/منطقه",
  city: "شهر",
  address: "آدرس",
  plate: "پلاک",
  unit: "واحد",
  postalCode: "کدپستی",
};

function CheckoutPage() {
  const cart = useStore((state) => state.cart);
  const hasHydrated = useStore((state) => state.hasHydrated);
  const items = useMemo(() => resolveCart(cart), [cart]);
  const readyItems = items.filter((item) => item.status === "ready");
  const hasBlockingIssues = items.some((item) => item.status !== "ready");
  const subtotal = readyItems.reduce(
    (total, item) => total + (item.unitPrice ? item.unitPrice * item.qty : 0),
    0,
  );
  const [draft, setDraft] = useState<CheckoutDraft>(() => ({ ...EMPTY_CHECKOUT_DRAFT }));
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [reviewReady, setReviewReady] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);
  const reviewRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (raw) setDraft(sanitizeCheckoutDraft(JSON.parse(raw)));
    } catch {
      // Session persistence is optional and must never crash Checkout.
    } finally {
      setDraftHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!draftHydrated) return;
    try {
      window.sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Validation and Review remain available if storage is blocked.
    }
  }, [draft, draftHydrated]);

  const updateField = (field: CheckoutField, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setReviewReady(false);
  };

  const submitForReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateCheckoutDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setReviewReady(false);
      window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }
    setReviewReady(true);
    window.requestAnimationFrame(() => reviewRef.current?.focus());
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main
        data-testid="f7-checkout-page"
        className="page-container-wide pb-36 pt-8 md:pb-16"
        aria-labelledby="checkout-heading"
      >
        <div className="max-w-3xl">
          <p className="eyebrow text-primary">Frontend-only Checkout</p>
          <h1 id="checkout-heading" className="mt-2 font-display text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
            Checkout نمایشی
          </h1>
          <p className="mt-4 font-fa text-sm leading-7 text-muted-foreground">
            این صفحه اطلاعات را فقط در مرورگر اعتبارسنجی و برای Review آماده می‌کند. هیچ سفارش واقعی ایجاد نمی‌شود و هیچ سرویس ارسال یا پرداختی متصل نیست.
          </p>
        </div>

        {!hasHydrated || !draftHydrated ? (
          <div data-testid="checkout-hydrating" className="mt-10 flex min-h-72 items-center justify-center rounded-2xl border border-border bg-surface">
            <Spinner label="در حال آماده‌سازی Checkout محلی" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            data-testid="checkout-empty-state"
            className="mt-10 min-h-[24rem]"
            icon={<ShoppingBag className="size-10" />}
            title="برای Checkout محصولی در سبد نیست"
            description="Checkout با سبد خالی ادامه پیدا نمی‌کند. ابتدا محصول و سایز را انتخاب کنید."
            action={<Link to="/products" className="btn-hype">مشاهده محصولات</Link>}
          />
        ) : hasBlockingIssues ? (
          <ErrorState
            data-testid="checkout-blocked-state"
            className="mt-10 min-h-[24rem]"
            icon={<AlertCircle className="size-10" />}
            title="سبد برای Review آماده نیست"
            description="یک یا چند آیتم ذخیره‌شده با Dataset فعلی هماهنگ نیست. ابتدا سبد را اصلاح کنید."
            action={<Link to="/cart" className="btn-hype">بازگشت به سبد</Link>}
          />
        ) : (
          <div className="mt-10 grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
            <form noValidate onSubmit={submitForReview} className="min-w-0 space-y-6" data-testid="checkout-form">
              {Object.keys(errors).length ? (
                <div
                  ref={errorSummaryRef}
                  tabIndex={-1}
                  role="alert"
                  aria-labelledby="checkout-error-summary-title"
                  data-testid="checkout-error-summary"
                  className="rounded-2xl border border-danger/60 bg-danger/10 p-4 outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <h2 id="checkout-error-summary-title" className="font-fa font-bold">بعضی اطلاعات نیاز به اصلاح دارند</h2>
                  <ul className="mt-2 space-y-1 font-fa text-sm">
                    {(Object.entries(errors) as Array<[CheckoutField, string]>).map(([field, message]) => (
                      <li key={field}>
                        <button type="button" className="min-h-11 text-start underline underline-offset-4" onClick={() => document.getElementById(`checkout-${field}`)?.focus()}>
                          {FIELD_LABELS[field]}: {message}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <section aria-labelledby="customer-information-heading" className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
                <SectionHeading icon={<UserRound />} eyebrow="Customer information" id="customer-information-heading">اطلاعات تماس</SectionHeading>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="نام" required inputId="checkout-firstName" error={errors.firstName}>
                    <Input id="checkout-firstName" name="firstName" autoComplete="given-name" dir="auto" value={draft.firstName} onChange={(event) => updateField("firstName", event.target.value)} aria-invalid={Boolean(errors.firstName)} aria-describedby={errors.firstName ? "checkout-firstName-error" : undefined} className="h-11 min-h-11" data-testid="checkout-first-name" />
                  </Field>
                  <Field label="نام خانوادگی" optional inputId="checkout-lastName">
                    <Input id="checkout-lastName" name="lastName" autoComplete="family-name" dir="auto" value={draft.lastName} onChange={(event) => updateField("lastName", event.target.value)} className="h-11 min-h-11" />
                  </Field>
                  <Field label="شماره تماس" required inputId="checkout-phone" error={errors.phone} help="ارقام فارسی و لاتین پذیرفته می‌شوند.">
                    <Input id="checkout-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={draft.phone} onChange={(event) => updateField("phone", event.target.value)} onBlur={(event) => updateField("phone", normalizePhone(event.target.value))} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "checkout-phone-error" : "checkout-phone-help"} className="h-11 min-h-11 text-left" data-testid="checkout-phone" />
                  </Field>
                  <Field label="ایمیل" optional inputId="checkout-email" error={errors.email}>
                    <Input id="checkout-email" name="email" type="email" inputMode="email" autoComplete="email" dir="ltr" value={draft.email} onChange={(event) => updateField("email", event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "checkout-email-error" : undefined} className="h-11 min-h-11 text-left" />
                  </Field>
                </div>
              </section>

              <section aria-labelledby="checkout-address-heading" className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
                <SectionHeading icon={<MapPin />} eyebrow="Address" id="checkout-address-heading">نشانی</SectionHeading>
                <p className="mt-2 font-fa text-xs leading-6 text-muted-foreground">
                  Dataset یا API معتبر استان/شهر در پروژه وجود ندارد؛ بنابراین فیلدها آزاد هستند و هیچ فهرست ساختگی نمایش داده نمی‌شود.
                </p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="استان/منطقه" required inputId="checkout-province" error={errors.province}>
                    <Input id="checkout-province" name="province" autoComplete="address-level1" dir="auto" value={draft.province} onChange={(event) => updateField("province", event.target.value)} aria-invalid={Boolean(errors.province)} aria-describedby={errors.province ? "checkout-province-error" : undefined} className="h-11 min-h-11" data-testid="checkout-province" />
                  </Field>
                  <Field label="شهر" required inputId="checkout-city" error={errors.city}>
                    <Input id="checkout-city" name="city" autoComplete="address-level2" dir="auto" value={draft.city} onChange={(event) => updateField("city", event.target.value)} aria-invalid={Boolean(errors.city)} aria-describedby={errors.city ? "checkout-city-error" : undefined} className="h-11 min-h-11" data-testid="checkout-city" />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="آدرس" required inputId="checkout-address" error={errors.address} help="آدرس‌های طولانی فارسی و متن ترکیبی RTL/LTR پشتیبانی می‌شوند.">
                      <Textarea id="checkout-address" name="address" autoComplete="street-address" dir="auto" rows={4} maxLength={600} value={draft.address} onChange={(event) => updateField("address", event.target.value)} aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? "checkout-address-error" : "checkout-address-help"} className="min-h-28 resize-y" data-testid="checkout-address" />
                    </Field>
                  </div>
                  <Field label="پلاک" optional inputId="checkout-plate"><Input id="checkout-plate" name="plate" dir="auto" value={draft.plate} onChange={(event) => updateField("plate", event.target.value)} className="h-11 min-h-11" /></Field>
                  <Field label="واحد" optional inputId="checkout-unit"><Input id="checkout-unit" name="unit" dir="auto" value={draft.unit} onChange={(event) => updateField("unit", event.target.value)} className="h-11 min-h-11" /></Field>
                  <Field label="کدپستی" optional inputId="checkout-postalCode" error={errors.postalCode}>
                    <Input id="checkout-postalCode" name="postalCode" autoComplete="postal-code" dir="ltr" value={draft.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} onBlur={(event) => updateField("postalCode", normalizeDigits(event.target.value))} aria-invalid={Boolean(errors.postalCode)} aria-describedby={errors.postalCode ? "checkout-postalCode-error" : undefined} className="h-11 min-h-11 text-left" />
                  </Field>
                </div>
              </section>

              <Boundary id="checkout-delivery-heading" testId="checkout-delivery-boundary" eyebrow="Delivery boundary" title="ارسال">
                هیچ گزینه، هزینه یا زمان تحویل در این نسخه ساخته نمی‌شود. انتخاب ارسال زمانی فعال می‌شود که Backend یا سیاست معتبر فروشگاه داده واقعی ارائه کند.
              </Boundary>
              <Boundary id="checkout-payment-heading" testId="checkout-payment-boundary" eyebrow="Payment boundary" title="پرداخت">
                هیچ کارت بانکی، درگاه، لوگوی پرداخت یا تراکنش نمایشی ساخته نشده است. اتصال پرداخت واقعی به Backend آینده وابسته است.
              </Boundary>

              <button type="submit" className="btn-hype min-h-14 w-full justify-center font-fa" data-testid="checkout-review-submit">
                بررسی اطلاعات واردشده <ArrowLeft aria-hidden="true" className="size-4" />
              </button>
            </form>

            <aside className="min-w-0 space-y-6 xl:sticky xl:top-28 xl:self-start">
              <section aria-labelledby="checkout-cart-summary-heading" className="rounded-2xl border border-border bg-surface p-5 sm:p-6" data-testid="checkout-cart-summary">
                <p className="eyebrow text-primary">Current cart</p>
                <h2 id="checkout-cart-summary-heading" className="mt-1 font-display text-2xl font-bold">اقلام Review</h2>
                <div className="mt-5 space-y-4">
                  {readyItems.map((item) => {
                    if (!item.shoe || !item.unitPrice) return null;
                    const label = `${item.shoe.brand} ${item.shoe.name}`;
                    return (
                      <article key={item.key} data-testid="checkout-review-item" className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0">
                        <CartProductImage src={item.shoe.image} alt={label} testId="checkout-item-image" className="size-[4.5rem] rounded-xl object-cover" />
                        <div className="min-w-0">
                          <p className="break-words font-display text-sm font-bold leading-5" dir="auto">{item.shoe.name}</p>
                          <p className="mt-1 font-fa text-xs text-muted-foreground">سایز <bdi dir="ltr">{item.size}</bdi> · تعداد <bdi dir="ltr">{item.qty}</bdi></p>
                          <p className="mt-2 font-mono-num text-sm font-semibold">{formatPrice(item.unitPrice * item.qty)}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
                  <span className="font-fa text-sm text-muted-foreground">جمع جزء</span>
                  <span className="font-mono-num text-lg font-bold" data-testid="checkout-subtotal">{formatPrice(subtotal)}</span>
                </div>
                <p className="mt-3 font-fa text-[11px] leading-5 text-muted-foreground">این عدد فقط جمع قیمت فعلی اقلام Dataset است؛ هزینه ارسال، مالیات احتمالی و مبلغ نهایی سفارش را شامل نمی‌شود.</p>
              </section>

              {reviewReady ? (
                <section ref={reviewRef} tabIndex={-1} aria-labelledby="checkout-review-heading" data-testid="checkout-review" className="rounded-2xl border border-primary/50 bg-primary/5 p-5 outline-none focus-visible:ring-2 focus-visible:ring-focus sm:p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
                    <div><p className="eyebrow text-primary">Validated locally</p><h2 id="checkout-review-heading" className="mt-1 font-display text-2xl font-bold">مرور نهایی اطلاعات</h2></div>
                  </div>
                  <dl className="mt-5 space-y-4 font-fa text-sm">
                    <div><dt className="font-bold">مشتری</dt><dd className="mt-1 break-words text-muted-foreground" dir="auto">{draft.firstName.trim()} {draft.lastName.trim()}</dd><dd className="mt-1 text-muted-foreground"><bdi dir="ltr">{normalizePhone(draft.phone)}</bdi>{draft.email.trim() ? <> · <bdi dir="ltr">{draft.email.trim()}</bdi></> : null}</dd></div>
                    <div className="border-t border-border pt-4"><dt className="font-bold">نشانی</dt><dd className="mt-1 whitespace-pre-wrap break-words text-muted-foreground" dir="auto">{draft.province.trim()}، {draft.city.trim()}، {draft.address.trim()}{draft.plate.trim() ? `، پلاک ${draft.plate.trim()}` : ""}{draft.unit.trim() ? `، واحد ${draft.unit.trim()}` : ""}</dd>{draft.postalCode.trim() ? <dd className="mt-1 text-muted-foreground">کدپستی: <bdi dir="ltr">{normalizeDigits(draft.postalCode.trim())}</bdi></dd> : null}</div>
                    <div className="border-t border-border pt-4"><dt className="font-bold">ارسال</dt><dd className="mt-1 text-muted-foreground">هنوز روش، هزینه یا زمان معتبر از Backend دریافت نشده است.</dd></div>
                    <div className="border-t border-border pt-4"><dt className="font-bold">پرداخت</dt><dd className="mt-1 text-muted-foreground">سرویس پرداخت واقعی متصل نیست و هیچ تراکنشی آغاز نمی‌شود.</dd></div>
                  </dl>
                  <button type="button" disabled aria-describedby="checkout-final-action-help" className="mt-6 min-h-14 w-full rounded-full border border-border bg-interactive px-5 font-fa font-bold text-muted-foreground" data-testid="checkout-final-action">ادامه پس از اتصال سرویس سفارش</button>
                  <p id="checkout-final-action-help" className="mt-2 font-fa text-xs leading-6 text-muted-foreground">این کنترل عمداً غیرفعال است؛ در این فاز سفارش واقعی ثبت نمی‌شود.</p>
                </section>
              ) : (
                <section aria-labelledby="checkout-review-placeholder-heading" className="rounded-2xl border border-dashed border-border bg-surface p-5 sm:p-6" data-testid="checkout-review-placeholder">
                  <h2 id="checkout-review-placeholder-heading" className="font-display text-xl font-bold">Review هنوز آماده نیست</h2>
                  <p className="mt-2 font-fa text-sm leading-7 text-muted-foreground">فرم را کامل و «بررسی اطلاعات واردشده» را انتخاب کنید تا خلاصه مشتری، آدرس و مرزهای ارسال/پرداخت نمایش داده شود.</p>
                </section>
              )}
            </aside>
          </div>
        )}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

function SectionHeading({ icon, eyebrow, id, children }: { icon: ReactNode; eyebrow: string; id: string; children: ReactNode }) {
  return <div className="flex items-start gap-3"><span aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary">{icon}</span><div><p className="eyebrow text-primary">{eyebrow}</p><h2 id={id} className="mt-1 font-display text-2xl font-bold">{children}</h2></div></div>;
}

function Boundary({ id, testId, eyebrow, title, children }: { id: string; testId: string; eyebrow: string; title: string; children: ReactNode }) {
  return <section aria-labelledby={id} className="rounded-2xl border border-border bg-surface p-4 sm:p-6" data-testid={testId}><p className="eyebrow text-primary">{eyebrow}</p><h2 id={id} className="mt-1 font-display text-2xl font-bold">{title}</h2><p className="mt-3 font-fa text-sm leading-7 text-muted-foreground">{children}</p></section>;
}

function Field({ label, inputId, error, required = false, optional = false, help, children }: { label: string; inputId: string; error?: string; required?: boolean; optional?: boolean; help?: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={inputId} className="flex min-h-6 items-center gap-2 font-fa text-sm font-bold">{label}{required ? <span className="text-danger">الزامی</span> : null}{optional ? <span className="font-normal text-muted-foreground">اختیاری</span> : null}</label>
      <div className="mt-2">{children}</div>
      {error ? <p id={`${inputId}-error`} className="mt-1 font-fa text-xs leading-5 text-danger"><span aria-hidden="true">● </span>{error}</p> : help ? <p id={`${inputId}-help`} className="mt-1 font-fa text-xs leading-5 text-muted-foreground">{help}</p> : null}
    </div>
  );
}

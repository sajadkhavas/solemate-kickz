import { Link } from "@tanstack/react-router";
import { CheckCircle2, CreditCard, ShieldCheck, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  getAddresses,
  getCustomerSession,
  type CustomerAddress,
  type CustomerSession,
} from "@/auth/customer-auth";
import {
  createCommerceOrder,
  getCommerceCart,
  getCommerceOrders,
  getCommerceShippingQuotes,
  initiateCommercePayment,
  verifyCommercePayment,
  type CommerceCart,
  type CommerceOrder,
  type CommercePayment,
  type CommerceShippingQuote,
} from "@/commerce/commerce-api";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/shoes";

const PAYMENT_DISABLED_MESSAGE =
  "پرداخت هنوز فعال نیست؛ Provider یا تنظیمات Production باید در مرحله فعال‌سازی کنترل‌شده تکمیل شود.";

type PaymentCallback = {
  payment_attempt?: string;
  Authority?: string;
  Status?: string;
};

export function ProductionCheckoutPage({
  paymentCallback,
}: {
  paymentCallback: PaymentCallback;
}) {
  const [session, setSession] = useState<CustomerSession | null>();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [cart, setCart] = useState<CommerceCart | null>();
  const [addressId, setAddressId] = useState<number>();
  const [quotes, setQuotes] = useState<CommerceShippingQuote[]>([]);
  const [quoteId, setQuoteId] = useState<string>();
  const [order, setOrder] = useState<CommerceOrder>();
  const [payment, setPayment] = useState<CommercePayment>();
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [verifyingCallback, setVerifyingCallback] = useState(false);
  const orderKey = useRef(crypto.randomUUID());
  const paymentKey = useRef(crypto.randomUUID());
  const callbackHandled = useRef(false);

  useEffect(() => {
    void Promise.all([getCustomerSession(), getCommerceCart()])
      .then(async ([current, currentCart]) => {
        setSession(current);
        setCart(currentCart);
        if (current) {
          const next = await getAddresses();
          setAddresses(next);
          setAddressId(next.find((item) => item.is_default)?.id ?? next[0]?.id);
        }
      })
      .catch(() => {
        setSession(null);
        setCart(null);
        setStatus("Checkout در دسترس نیست.");
      });
  }, []);

  useEffect(() => {
    if (!session || !addressId || !cart?.summary.checkout_ready || order) return;
    let active = true;
    setLoadingQuotes(true);
    setQuotes([]);
    setQuoteId(undefined);
    void getCommerceShippingQuotes(addressId)
      .then((next) => {
        if (!active) return;
        setQuotes(next);
        setQuoteId(next[0]?.id);
        if (!next.length) setStatus("برای این آدرس روش ارسال معتبری در دسترس نیست.");
      })
      .catch(() => {
        if (!active) return;
        setQuotes([]);
        setStatus("دریافت هزینه و روش ارسال از Backend انجام نشد.");
      })
      .finally(() => {
        if (active) setLoadingQuotes(false);
      });
    return () => {
      active = false;
    };
  }, [addressId, cart?.summary.checkout_ready, order, session]);

  useEffect(() => {
    const attempt = paymentCallback.payment_attempt;
    const authority = paymentCallback.Authority;
    const callbackStatus = paymentCallback.Status;
    if (!session || !attempt || !authority || !callbackStatus || callbackHandled.current) return;

    callbackHandled.current = true;
    setVerifyingCallback(true);
    setStatus("در حال بررسی نتیجه پرداخت با Backend و Provider…");
    void verifyCommercePayment(attempt, authority, callbackStatus)
      .then(async (verified) => {
        setPayment(verified);
        if (verified.status !== "paid") {
          setStatus("پرداخت توسط Backend تأیید نشد. سفارش paid نشده است.");
          return;
        }

        const orders = await getCommerceOrders();
        setOrder(orders.find((item) => item.id === verified.order_id));
        setStatus("پرداخت پس از Verify سروری تأیید شد و سفارش به وضعیت پرداخت‌شده رسید.");
        window.history.replaceState({}, "", "/checkout");
      })
      .catch(() => {
        setStatus("تأیید سروری پرداخت انجام نشد؛ نتیجه مرورگر به‌تنهایی معتبر نیست.");
      })
      .finally(() => setVerifyingCallback(false));
  }, [paymentCallback.Authority, paymentCallback.Status, paymentCallback.payment_attempt, session]);

  const submit = async () => {
    if (!addressId || !quoteId) return;
    setSubmitting(true);
    setStatus("");
    try {
      const created = await createCommerceOrder(addressId, quoteId, orderKey.current);
      setOrder(created);
      setStatus("سفارش و رزرو موجودی با هزینه ارسال تأییدشده توسط Backend ثبت شد.");
    } catch {
      setStatus("ثبت سفارش انجام نشد؛ سبد، آدرس، quote ارسال و موجودی را دوباره بررسی کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  const startPayment = async () => {
    if (!order) return;
    setPaymentBusy(true);
    setStatus("");
    try {
      const attempt = await initiateCommercePayment(order.id, paymentKey.current);
      setPayment(attempt);
      if (attempt.status === "paid") {
        setStatus("این پرداخت قبلاً توسط Backend تأیید شده است.");
        return;
      }
      if (!attempt.redirect_url) {
        setStatus("Backend پرداخت را ایجاد کرد اما URL امن انتقال به درگاه ارائه نشد.");
        return;
      }

      const target = new URL(attempt.redirect_url);
      const trustedZarinPal =
        target.protocol === "https:" &&
        (target.hostname === "zarinpal.com" || target.hostname.endsWith(".zarinpal.com"));
      if (!trustedZarinPal) {
        setStatus("URL درگاه با Provider مورد انتظار مطابقت ندارد؛ انتقال متوقف شد.");
        return;
      }
      window.location.assign(target.toString());
    } catch (error) {
      const providerUnavailable =
        error instanceof Error &&
        "status" in error &&
        (error as Error & { status?: number }).status === 503;
      setStatus(
        providerUnavailable
          ? PAYMENT_DISABLED_MESSAGE
          : "شروع پرداخت انجام نشد؛ وضعیت سفارش و Provider را دوباره بررسی کنید.",
      );
    } finally {
      setPaymentBusy(false);
    }
  };

  const selectedQuote = quotes.find((quote) => quote.id === quoteId);

  return (
    <Shell>
      <main
        className="page-container-wide pb-36 pt-8 md:pb-16"
        data-testid="production-checkout-page"
      >
        <p className="eyebrow text-primary">Authoritative checkout</p>
        <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">بررسی، ارسال و پرداخت</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          قیمت، موجودی، هزینه ارسال و نتیجه پرداخت فقط از Backend معتبر هستند. برگشت از درگاه هرگز
          به‌تنهایی پرداخت موفق محسوب نمی‌شود.
        </p>
        {status ? (
          <p role="status" className="mt-4 rounded-xl border border-border p-3">
            {status}
          </p>
        ) : null}
        {verifyingCallback ? (
          <div role="status" className="mt-6 rounded-xl border border-primary/30 p-4">
            در حال Verify سروری پرداخت…
          </div>
        ) : null}
        {session === undefined || cart === undefined ? (
          <div role="status" className="mt-10">
            در حال آماده‌سازی Checkout…
          </div>
        ) : null}
        {session === null ? (
          <div className="mt-10 rounded-2xl border border-border bg-surface p-8 text-center">
            <h2 className="text-2xl font-bold">برای ثبت سفارش وارد شوید</h2>
            <p className="mt-3 text-muted-foreground">
              سبد مهمان حفظ می‌شود و پس از ورود امن به حساب متصل خواهد شد.
            </p>
            <Button asChild className="mt-5">
              <Link to="/auth">ورود به SOLE</Link>
            </Button>
          </div>
        ) : null}
        {session && !order && !paymentCallback.payment_attempt ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]">
            <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
              <div>
                <h2 className="text-2xl font-bold">آدرس ارسال</h2>
                {addresses.length ? (
                  <fieldset className="mt-5 space-y-3">
                    <legend className="sr-only">انتخاب آدرس</legend>
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className="flex min-h-14 cursor-pointer gap-3 rounded-xl border border-border p-4"
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={addressId === address.id}
                          onChange={() => setAddressId(address.id)}
                        />
                        <span>
                          <strong>{address.recipient_name}</strong>
                          <span className="mt-1 block text-sm text-muted-foreground">
                            {address.province}، {address.city}، {address.address_line1}
                          </span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                ) : (
                  <div className="mt-5 rounded-xl border border-warning/40 p-4">
                    <p>برای ادامه یک آدرس معتبر ثبت کنید.</p>
                    <Button asChild variant="outline" className="mt-4">
                      <Link to="/account" search={{ section: "addresses" }}>
                        مدیریت آدرس‌ها
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-6" data-testid="p07-shipping-quotes">
                <div className="flex items-center gap-2">
                  <Truck className="size-5 text-primary" aria-hidden="true" />
                  <h2 className="text-xl font-bold">روش ارسال</h2>
                </div>
                {loadingQuotes ? (
                  <p role="status" className="mt-4 text-sm text-muted-foreground">
                    در حال دریافت quote سروری…
                  </p>
                ) : quotes.length ? (
                  <fieldset className="mt-4 space-y-3">
                    <legend className="sr-only">انتخاب روش ارسال</legend>
                    {quotes.map((quote) => (
                      <label
                        key={quote.id}
                        className="flex min-h-14 cursor-pointer items-start justify-between gap-4 rounded-xl border border-border p-4"
                      >
                        <span className="flex gap-3">
                          <input
                            type="radio"
                            name="shipping-quote"
                            checked={quoteId === quote.id}
                            onChange={() => setQuoteId(quote.id)}
                          />
                          <span>
                            <strong>{quote.label}</strong>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {etaLabel(quote)} · {quote.provider}
                            </span>
                          </span>
                        </span>
                        <strong>{formatMinor(quote.amount_minor, quote.currency)}</strong>
                      </label>
                    ))}
                  </fieldset>
                ) : addressId ? (
                  <p className="mt-4 text-sm text-muted-foreground">روش ارسال معتبری دریافت نشده است.</p>
                ) : null}
              </div>
            </section>

            <aside className="h-fit rounded-2xl border border-border bg-surface p-6">
              <ShieldCheck className="size-6 text-primary" />
              <h2 className="mt-3 text-xl font-bold">تأیید سروری</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Checkout فقط quote معتبر همین سبد، مشتری و آدرس را مصرف می‌کند. هزینه ارسال از Client
                قابل تغییر نیست.
              </p>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt>کالاها</dt>
                  <dd className="font-bold">
                    {cart ? formatMinor(cart.summary.subtotal_minor, cart.summary.currency) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>ارسال انتخاب‌شده</dt>
                  <dd className="font-bold">
                    {selectedQuote ? formatMinor(selectedQuote.amount_minor, selectedQuote.currency) : "—"}
                  </dd>
                </div>
              </dl>
              <Button
                size="lg"
                className="mt-6 w-full"
                disabled={!addressId || !quoteId || !cart?.summary.checkout_ready || submitting}
                onClick={() => void submit()}
              >
                {submitting ? "در حال ثبت…" : "ثبت سفارش و رزرو موجودی"}
              </Button>
            </aside>
          </div>
        ) : null}

        {order ? (
          <section className="mt-10 rounded-2xl border border-primary/40 bg-surface p-8">
            <CheckCircle2 className="size-10 text-primary" />
            <h2 className="mt-4 text-3xl font-black">
              {payment?.status === "paid" || order.status !== "awaiting_payment"
                ? "سفارش پرداخت‌شده"
                : "سفارش ثبت شد"}
            </h2>
            <p className="mt-3">
              شناسه: <bdi dir="ltr">{order.id}</bdi>
            </p>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <div>
                <dt>مبلغ کالاها</dt>
                <dd className="font-bold">{formatMinor(order.subtotal_minor, order.currency)}</dd>
              </div>
              <div>
                <dt>ارسال</dt>
                <dd className="font-bold">{formatMinor(order.shipping_minor, order.currency)}</dd>
              </div>
              <div>
                <dt>مبلغ نهایی</dt>
                <dd className="font-bold">{formatMinor(order.total_minor, order.currency)}</dd>
              </div>
              <div>
                <dt>وضعیت</dt>
                <dd className="font-bold">{order.status}</dd>
              </div>
            </dl>

            {payment?.status === "paid" || order.status !== "awaiting_payment" ? (
              <p className="mt-6 rounded-xl border border-primary/40 p-4 text-sm leading-6">
                نتیجه پرداخت از پاسخ Verify سروری گرفته شده است. شناسه مرجع فقط پس از تأیید Backend
                قابل نمایش است.
              </p>
            ) : (
              <div className="mt-6 rounded-xl border border-warning/40 p-4">
                <div className="flex items-center gap-2 font-bold">
                  <CreditCard className="size-5" aria-hidden="true" />
                  پرداخت
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  شروع پرداخت از Backend انجام می‌شود؛ مرورگر فقط به URL امن Provider منتقل می‌شود و
                  پس از بازگشت، وضعیت دوباره روی سرور Verify خواهد شد.
                </p>
                <Button
                  type="button"
                  className="mt-4"
                  loading={paymentBusy}
                  loadingLabel="در حال ایجاد پرداخت"
                  onClick={() => void startPayment()}
                >
                  پرداخت امن
                </Button>
              </div>
            )}

            <Button asChild variant="outline" className="mt-5">
              <Link to="/account" search={{ section: "orders", order: order.id }}>
                مشاهده سفارش
              </Link>
            </Button>
          </section>
        ) : null}

        {session && paymentCallback.payment_attempt && !order && !verifyingCallback ? (
          <section className="mt-10 rounded-2xl border border-border bg-surface p-8 text-center">
            <h2 className="text-2xl font-black">نتیجه پرداخت هنوز قطعی نیست</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              اگر Verify سروری موفق نباشد، SOLE هرگز صرفاً بر اساس پارامترهای URL پرداخت را موفق اعلام
              نمی‌کند.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/account" search={{ section: "orders" }}>
                بررسی سفارش‌ها
              </Link>
            </Button>
          </section>
        ) : null}
      </main>
    </Shell>
  );
}

function etaLabel(quote: CommerceShippingQuote): string {
  if (quote.eta_min_days === null && quote.eta_max_days === null) return "زمان تحویل اعلام نشده";
  if (quote.eta_min_days === quote.eta_max_days) return `${quote.eta_min_days ?? quote.eta_max_days} روز`;
  if (quote.eta_min_days === null) return `حداکثر ${quote.eta_max_days} روز`;
  if (quote.eta_max_days === null) return `حداقل ${quote.eta_min_days} روز`;
  return `${quote.eta_min_days} تا ${quote.eta_max_days} روز`;
}

function formatMinor(amountMinor: number, currency: string): string {
  if (currency === "IRR" && amountMinor % 10 === 0) return formatPrice(amountMinor / 10);
  return `${new Intl.NumberFormat("fa-IR").format(amountMinor)} ${currency}`;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      {children}
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

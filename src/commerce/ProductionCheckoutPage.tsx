import { Link } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck } from "lucide-react";
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
  type CommerceCart,
  type CommerceOrder,
} from "@/commerce/commerce-api";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/shoes";

export function ProductionCheckoutPage() {
  const [session, setSession] = useState<CustomerSession | null>();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [cart, setCart] = useState<CommerceCart | null>();
  const [addressId, setAddressId] = useState<number>();
  const [order, setOrder] = useState<CommerceOrder>();
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const key = useRef(crypto.randomUUID());
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
  const submit = async () => {
    if (!addressId) return;
    setSubmitting(true);
    try {
      setOrder(await createCommerceOrder(addressId, key.current));
      setStatus("سفارش و رزرو موجودی با موفقیت ثبت شد.");
    } catch {
      setStatus("ثبت سفارش انجام نشد؛ سبد، آدرس و موجودی را دوباره بررسی کنید.");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Shell>
      <main
        className="page-container-wide pb-36 pt-8 md:pb-16"
        data-testid="production-checkout-page"
      >
        <p className="eyebrow text-primary">Authoritative checkout</p>
        <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">بررسی و ثبت سفارش</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          مبلغ نهایی، صلاحیت ارسال و رزرو موجودی فقط توسط Backend تعیین می‌شود.
        </p>
        {status ? (
          <p role="status" className="mt-4 rounded-xl border border-border p-3">
            {status}
          </p>
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
        {session && !order ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]">
            <section className="rounded-2xl border border-border bg-surface p-6">
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
            </section>
            <aside className="h-fit rounded-2xl border border-border bg-surface p-6">
              <ShieldCheck className="size-6 text-primary" />
              <h2 className="mt-3 text-xl font-bold">تأیید سروری</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                مبلغ نمایش‌داده‌شده در سبد تخمینی است؛ پاسخ ثبت سفارش شامل هزینه ارسال و total قطعی
                این مرحله است.
              </p>
              <Button
                size="lg"
                className="mt-6 w-full"
                disabled={!addressId || !cart?.summary.checkout_ready || submitting}
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
            <h2 className="mt-4 text-3xl font-black">سفارش ثبت شد</h2>
            <p className="mt-3">
              شناسه: <bdi dir="ltr">{order.id}</bdi>
            </p>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <div>
                <dt>مبلغ کالاها</dt>
                <dd className="font-bold">{formatPrice(order.subtotal_minor / 10)}</dd>
              </div>
              <div>
                <dt>ارسال</dt>
                <dd className="font-bold">{formatPrice(order.shipping_minor / 10)}</dd>
              </div>
              <div>
                <dt>مبلغ نهایی</dt>
                <dd className="font-bold">{formatPrice(order.total_minor / 10)}</dd>
              </div>
              <div>
                <dt>وضعیت</dt>
                <dd className="font-bold">در انتظار پرداخت</dd>
              </div>
            </dl>
            <p className="mt-6 rounded-xl border border-warning/40 p-4 text-sm leading-6">
              پرداخت هنوز فعال نیست و در P07 اضافه می‌شود. رزرو موجودی تا زمان اعلام‌شده معتبر است و
              سپس خودکار آزاد می‌شود.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/account" search={{ section: "orders", order: order.id }}>
                مشاهده سفارش
              </Link>
            </Button>
          </section>
        ) : null}
      </main>
    </Shell>
  );
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

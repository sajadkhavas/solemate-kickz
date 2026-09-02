import { Link } from "@tanstack/react-router";
import {
  CreditCard,
  Headphones,
  MapPin,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { getCustomerSession, type CustomerSession } from "@/auth/customer-auth";
import { ProductionFooter } from "@/auth/ProductionFooter";
import { ProductionMobileBottomNav } from "@/auth/ProductionMobileBottomNav";
import { ProductionNavbar } from "@/auth/ProductionNavbar";
import {
  getCommerceOrders,
  requestCommerceRefund,
  requestCommerceReturn,
  type CommerceOrder,
} from "@/commerce/commerce-api";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/shoes";
import {
  getOrderTracking,
  submitVerifiedReview,
  type OrderTracking,
} from "@/postpurchase/postpurchase-api";

export function ProductionOrdersPage({ orderId }: { orderId?: string }) {
  const [session, setSession] = useState<CustomerSession | null>();
  const [orders, setOrders] = useState<CommerceOrder[]>();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [returnReason, setReturnReason] = useState("size_or_fit");
  const [returnText, setReturnText] = useState("");
  const [refundReason, setRefundReason] = useState("approved_return");
  const refundKey = useRef(crypto.randomUUID());

  const refreshOrders = useCallback(async () => {
    const next = await getCommerceOrders();
    setOrders(next);
  }, []);

  useEffect(() => {
    void getCustomerSession()
      .then(async (current) => {
        setSession(current);
        if (current) await refreshOrders();
      })
      .catch(() => {
        setSession(null);
        setOrders([]);
      });
  }, [refreshOrders]);

  const selected = orderId ? orders?.find((item) => item.id === orderId) : undefined;

  const submitReturn = async () => {
    if (!selected) return;
    setBusy(true);
    setStatus("");
    try {
      await requestCommerceReturn(selected.id, returnReason, returnText);
      await refreshOrders();
      setStatus("درخواست مرجوعی روی Backend ثبت شد.");
    } catch {
      setStatus("ثبت مرجوعی انجام نشد؛ وضعیت تحویل و مالکیت سفارش را بررسی کنید.");
    } finally {
      setBusy(false);
    }
  };

  const submitRefund = async () => {
    if (!selected) return;
    setBusy(true);
    setStatus("");
    try {
      const refund = await requestCommerceRefund(selected.id, refundKey.current, refundReason);
      await refreshOrders();
      setStatus(
        `درخواست بازپرداخت ${formatMinor(refund.amount_minor, selected.currency)} ثبت شد. مبلغ توسط Backend محاسبه شده و اجرای پولی Provider جداگانه کنترل می‌شود.`,
      );
    } catch {
      setStatus(
        "درخواست بازپرداخت ثبت نشد؛ پرداخت تأییدشده یا مبلغ قابل بازپرداخت باقی نمانده است.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      data-testid="p07-production-orders-page"
    >
      <ProductionNavbar />
      <main className="px-[var(--space-page-gutter)] py-10 pb-[calc(var(--safe-bottom-nav)+env(safe-area-inset-bottom)+3rem)] md:py-16">
        <section className="mx-auto max-w-[1280px]">
          <div className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="eyebrow text-primary">Payment · Shipping · Returns</div>
              <h1 className="mt-3 font-display text-[length:var(--text-h1)] font-black leading-[1.05]">
                سفارش‌های من
              </h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                وضعیت پرداخت، ارسال، مرجوعی و بازپرداخت مستقیماً از Backend نمایش داده می‌شود.
              </p>
            </div>
          </div>

          {status ? (
            <p role="status" className="mt-4 rounded-xl border border-border p-3 text-sm">
              {status}
            </p>
          ) : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <AccountNav />
            <div className="min-w-0">
              {session === undefined || orders === undefined ? (
                <div role="status" className="rounded-2xl border border-border p-8">
                  در حال دریافت سفارش‌ها…
                </div>
              ) : null}
              {session === null ? (
                <div className="rounded-2xl border border-border p-8 text-center">
                  <h2 className="text-2xl font-black">برای مشاهده سفارش‌ها وارد شوید</h2>
                  <Button asChild className="mt-5">
                    <Link to="/auth">ورود به SOLE</Link>
                  </Button>
                </div>
              ) : null}
              {session && orders ? (
                selected ? (
                  <OrderDetail
                    order={selected}
                    busy={busy}
                    returnReason={returnReason}
                    returnText={returnText}
                    refundReason={refundReason}
                    onReturnReason={setReturnReason}
                    onReturnText={setReturnText}
                    onRefundReason={setRefundReason}
                    onReturn={() => void submitReturn()}
                    onRefund={() => void submitRefund()}
                  />
                ) : (
                  <OrderList orders={orders} />
                )
              ) : null}
            </div>
          </div>
        </section>
      </main>
      <ProductionFooter />
      <ProductionMobileBottomNav />
    </div>
  );
}

function AccountNav() {
  const links = [
    { section: "overview", label: "داشبورد", icon: ShieldCheck },
    { section: "profile", label: "پروفایل", icon: UserRound },
    { section: "addresses", label: "آدرس‌ها", icon: MapPin },
    { section: "orders", label: "سفارش‌ها", icon: PackageCheck },
    { section: "support", label: "پشتیبانی", icon: Headphones },
  ] as const;
  return (
    <aside className="rounded-2xl border border-border bg-surface p-3 lg:sticky lg:top-28 lg:self-start">
      <nav aria-label="بخش‌های حساب" className="grid gap-1">
        {links.map(({ section, label, icon: Icon }) => (
          <Link
            key={section}
            to="/account"
            search={{ section }}
            aria-current={section === "orders" ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm ${
              section === "orders"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-interactive"
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function OrderList({ orders }: { orders: CommerceOrder[] }) {
  if (!orders.length)
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <PackageCheck className="mx-auto size-12 text-muted-foreground" />
        <h2 className="mt-4 text-2xl font-black">هنوز سفارشی ثبت نشده است</h2>
        <Button asChild className="mt-5">
          <Link to="/products">مشاهده محصولات</Link>
        </Button>
      </div>
    );

  return (
    <section>
      <h2 className="font-display text-3xl font-black">تاریخچه واقعی سفارش</h2>
      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            to="/account"
            search={{ section: "orders", order: order.id }}
            className="block min-h-11 rounded-2xl border border-border bg-surface p-5"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <strong>
                  <bdi dir="ltr">{order.id}</bdi>
                </strong>
                <p className="mt-2 text-sm text-muted-foreground">
                  سفارش: {statusLabel(order.status)} · پرداخت:{" "}
                  {order.payment?.status ?? "شروع نشده"} · ارسال:{" "}
                  {order.shipment?.status ?? "شروع نشده"}
                </p>
              </div>
              <strong>{formatMinor(order.total_minor, order.currency)}</strong>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function OrderDetail({
  order,
  busy,
  returnReason,
  returnText,
  refundReason,
  onReturnReason,
  onReturnText,
  onRefundReason,
  onReturn,
  onRefund,
}: {
  order: CommerceOrder;
  busy: boolean;
  returnReason: string;
  returnText: string;
  refundReason: string;
  onReturnReason: (value: string) => void;
  onReturnText: (value: string) => void;
  onRefundReason: (value: string) => void;
  onReturn: () => void;
  onRefund: () => void;
}) {
  const delivered = order.status === "fulfilled" && order.shipment?.status === "delivered";
  const returnExists = Boolean(order.return);
  const refundable =
    Boolean(order.payment?.status === "paid") &&
    !order.refunds.some((item) =>
      ["requested", "processing", "manual_review", "completed"].includes(item.status),
    );

  return (
    <section className="space-y-6" data-testid="p07-order-lifecycle">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <Link to="/account" search={{ section: "orders" }} className="text-sm text-primary">
          بازگشت به سفارش‌ها
        </Link>
        <h2 className="mt-4 font-display text-2xl font-black">
          سفارش <bdi dir="ltr">{order.id}</bdi>
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <TruthCard icon={<PackageCheck />} title="سفارش" value={statusLabel(order.status)} />
          <TruthCard
            icon={<CreditCard />}
            title="پرداخت"
            value={order.payment?.status ?? "شروع نشده"}
          />
          <TruthCard icon={<Truck />} title="ارسال" value={order.shipment?.status ?? "شروع نشده"} />
          <TruthCard
            icon={<RotateCcw />}
            title="مرجوعی"
            value={order.return?.status ?? "ثبت نشده"}
          />
        </div>
        {order.shipment?.tracking_number ? (
          <p className="mt-5 rounded-xl border border-border p-3 text-sm">
            کد رهگیری: <bdi dir="ltr">{order.shipment.tracking_number}</bdi>
          </p>
        ) : null}
        <TrackingTimeline orderId={order.id} />
        <div className="mt-6 space-y-3">
          {order.items.map((item) => (
            <div key={item.sku} className="rounded-xl border border-border p-4">
              <strong>{item.product_name}</strong>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.variant_title} · EU {item.size ?? "—"} · {item.quantity} عدد
              </p>
            </div>
          ))}
        </div>
        <dl className="mt-6 grid gap-2 text-sm sm:max-w-md">
          <div className="flex justify-between gap-4">
            <dt>کالاها</dt>
            <dd>{formatMinor(order.subtotal_minor, order.currency)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>ارسال</dt>
            <dd>{formatMinor(order.shipping_minor, order.currency)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2 font-bold">
            <dt>مبلغ نهایی</dt>
            <dd>{formatMinor(order.total_minor, order.currency)}</dd>
          </div>
        </dl>
      </div>

      {delivered ? <VerifiedReview order={order} /> : null}

      {delivered && !returnExists ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="text-xl font-black">درخواست مرجوعی</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            فقط سفارش تحویل‌شده قابل ثبت است. تصمیم و transition نهایی روی Backend انجام می‌شود.
          </p>
          <label className="mt-4 block text-sm font-medium">
            دلیل
            <select
              value={returnReason}
              onChange={(event) => onReturnReason(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-input bg-background px-3"
            >
              <option value="size_or_fit">سایز یا فیت</option>
              <option value="damaged">آسیب‌دیده</option>
              <option value="wrong_item">کالای اشتباه</option>
              <option value="not_as_expected">مطابق انتظار نیست</option>
              <option value="other">سایر</option>
            </select>
          </label>
          {returnReason === "other" ? (
            <label className="mt-4 block text-sm font-medium">
              توضیح
              <textarea
                value={returnText}
                onChange={(event) => onReturnText(event.target.value)}
                maxLength={1000}
                className="mt-2 min-h-24 w-full rounded-xl border border-input bg-background p-3"
              />
            </label>
          ) : null}
          <Button className="mt-4" loading={busy} onClick={onReturn}>
            ثبت مرجوعی
          </Button>
        </div>
      ) : null}

      {returnExists ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="text-xl font-black">مرجوعی</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            وضعیت ثبت‌شده: {order.return?.status}
          </p>
        </div>
      ) : null}

      {refundable ? (
        <div className="rounded-2xl border border-warning/40 bg-warning/5 p-6">
          <h3 className="text-xl font-black">درخواست بازپرداخت</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            مبلغ از Client ارسال نمی‌شود؛ Backend remaining refundable amount را از پرداخت تأییدشده
            محاسبه می‌کند. ثبت درخواست به معنی اجرای پولی Provider نیست.
          </p>
          <label className="mt-4 block text-sm font-medium">
            دلیل
            <select
              value={refundReason}
              onChange={(event) => onRefundReason(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-input bg-background px-3"
            >
              <option value="approved_return">مرجوعی تأییدشده</option>
              <option value="customer_cancellation">لغو توسط مشتری</option>
              <option value="damaged">آسیب‌دیده</option>
              <option value="wrong_item">کالای اشتباه</option>
              <option value="other">سایر</option>
            </select>
          </label>
          <Button variant="outline" className="mt-4" loading={busy} onClick={onRefund}>
            ثبت درخواست بازپرداخت
          </Button>
        </div>
      ) : null}

      {order.refunds.length ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="text-xl font-black">بازپرداخت‌ها</h3>
          <div className="mt-4 space-y-3">
            {order.refunds.map((refund) => (
              <div
                key={refund.id}
                className="flex flex-wrap justify-between gap-3 rounded-xl border border-border p-4 text-sm"
              >
                <span>{refund.status}</span>
                <strong>{formatMinor(refund.amount_minor, order.currency)}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function TrackingTimeline({ orderId }: { orderId: string }) {
  const [tracking, setTracking] = useState<OrderTracking>();
  useEffect(() => {
    void getOrderTracking(orderId)
      .then(setTracking)
      .catch(() => setTracking(undefined));
  }, [orderId]);
  return (
    <section className="mt-6" data-testid="p08-order-tracking">
      <h3 className="text-lg font-black">مسیر واقعی سفارش</h3>
      {tracking?.events.length ? (
        <ol className="mt-3 space-y-2">
          {tracking.events.map((event, index) => (
            <li
              key={`${event.type}-${event.at}-${index}`}
              className="rounded-xl border border-border p-3 text-sm"
            >
              <strong>{event.status}</strong> · {event.reason}
              {event.at ? (
                <time className="mr-2 text-muted-foreground">
                  {new Date(event.at).toLocaleString("fa-IR")}
                </time>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          هنوز رویداد رهگیری بیشتری ثبت نشده است.
        </p>
      )}
    </section>
  );
}

function VerifiedReview({ order }: { order: CommerceOrder }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const item = order.items[0];
  const submit = async () => {
    if (!item) return;
    setBusy(true);
    setStatus("");
    try {
      await submitVerifiedReview({ order_item_id: item.id, rating, body });
      setBody("");
      setStatus("نظر خرید تأییدشده برای بررسی moderation ثبت شد و هنوز عمومی نیست.");
    } catch {
      setStatus("ثبت نظر انجام نشد یا این قلم قبلاً بررسی شده است.");
    } finally {
      setBusy(false);
    }
  };
  if (!item) return null;
  return (
    <section
      className="rounded-2xl border border-border bg-surface p-6"
      data-testid="p08-verified-review"
    >
      <h3 className="text-xl font-black">نظر خرید تأییدشده</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        نظر ابتدا pending است و فقط پس از moderation می‌تواند منتشر شود.
      </p>
      <label className="mt-4 block text-sm">
        امتیاز
        <select
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          className="mt-2 min-h-11 w-full rounded-xl border border-input bg-background px-3"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-4 block text-sm">
        متن
        <textarea
          required
          maxLength={5000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="mt-2 min-h-24 w-full rounded-xl border border-input bg-background p-3"
        />
      </label>
      <Button disabled={busy || !body.trim()} onClick={() => void submit()} className="mt-4">
        {busy ? "در حال ثبت…" : "ارسال برای بررسی"}
      </Button>
      {status ? (
        <p role="status" className="mt-3 text-sm">
          {status}
        </p>
      ) : null}
    </section>
  );
}

function TruthCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 text-primary">{icon}</div>
      <p className="mt-3 text-xs text-muted-foreground">{title}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}

function statusLabel(status: CommerceOrder["status"]): string {
  return {
    awaiting_payment: "در انتظار پرداخت",
    paid: "پرداخت‌شده",
    processing: "در حال پردازش/ارسال",
    fulfilled: "تحویل‌شده",
    cancelled: "لغوشده",
    expired: "منقضی‌شده",
  }[status];
}

function formatMinor(amountMinor: number, currency: string): string {
  if (currency === "IRR" && amountMinor % 10 === 0) return formatPrice(amountMinor / 10);
  return `${new Intl.NumberFormat("fa-IR").format(amountMinor)} ${currency}`;
}

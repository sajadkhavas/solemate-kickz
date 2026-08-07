import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  CircleUserRound,
  Clock3,
  Heart,
  Home,
  LogOut,
  MapPin,
  PackageCheck,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShoppingBag,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type InputHTMLAttributes } from "react";

import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/commerce-primitives";
import { SHOES } from "@/data/shoes";
import { type DemoAccountProfile, useStore } from "@/store";

const ACCOUNT_SECTIONS = ["overview", "profile", "addresses", "orders"] as const;
type AccountSection = (typeof ACCOUNT_SECTIONS)[number];

type AccountSearch = {
  section: AccountSection;
  order?: string;
};

export const Route = createFileRoute("/account")({
  validateSearch: (search: Record<string, unknown>): AccountSearch => ({
    section: ACCOUNT_SECTIONS.includes(search.section as AccountSection)
      ? (search.section as AccountSection)
      : "overview",
    order: typeof search.order === "string" && search.order.trim() ? search.order : undefined,
  }),
  head: () => ({
    meta: [
      { title: "حساب نمایشی — SOLE" },
      {
        name: "description",
        content: "داشبورد حساب محلی SOLE برای بررسی رابط پروفایل، آدرس و سفارش بدون Backend واقعی.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountPage,
});

const DEMO_ORDERS = [
  {
    id: "SOLE-DEMO-2401",
    status: "در حال آماده‌سازی نمایشی",
    placedAt: "۱۴۰۵/۰۵/۱۴",
    productId: 2,
    size: 43,
    qty: 1,
  },
  {
    id: "SOLE-DEMO-2392",
    status: "تحویل‌شده نمایشی",
    placedAt: "۱۴۰۵/۰۴/۲۱",
    productId: 11,
    size: 42,
    qty: 1,
  },
] as const;

function AccountPage() {
  const { section, order } = Route.useSearch();
  const accountMode = useStore((state) => state.demoAccountMode);
  const startDemoSession = useStore((state) => state.startDemoSession);
  const expireDemoSession = useStore((state) => state.expireDemoSession);
  const resetDemoSession = useStore((state) => state.resetDemoSession);
  const wishlistCount = useStore((state) => state.wishlist.length);
  const addressCount = useStore((state) => state.demoAddresses.length);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const resolvedMode = mounted ? accountMode : "guest";

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="account-page">
      <Navbar />
      <main className="px-[var(--space-page-gutter)] py-10 pb-[calc(var(--safe-bottom-nav)+env(safe-area-inset-bottom)+3rem)] md:py-16">
        <section className="mx-auto max-w-[1280px]">
          <div className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="eyebrow text-primary">Frontend-only account</div>
              <h1 className="mt-3 font-display text-[length:var(--text-h1)] font-black leading-[1.05]">
                حساب نمایشی
              </h1>
              <p className="mt-4 max-w-3xl font-fa leading-7 text-muted-foreground">
                این بخش برای ارزیابی تجربه حساب کاربری ساخته شده است. حساب، احراز هویت، سفارش،
                پرداخت یا داده سروری واقعی ایجاد نمی‌شود.
              </p>
            </div>
            {resolvedMode === "active" ? (
              <Button
                type="button"
                variant="outline"
                onClick={expireDemoSession}
                data-testid="account-expire-session"
              >
                <Clock3 aria-hidden="true" />
                شبیه‌سازی انقضای نشست
              </Button>
            ) : null}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-lg)] border border-warning/40 bg-warning/5 p-4">
            <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
            <p className="font-fa text-sm leading-6 text-muted-foreground">
              هر تغییری در پروفایل، آدرس یا وضعیت نشست فقط در localStorage همین مرورگر ثبت می‌شود
              و نباید به‌عنوان داده حساب واقعی برداشت شود.
            </p>
          </div>

          {!mounted ? (
            <div role="status" className="mt-8 rounded-[var(--radius-xl)] border border-border bg-surface p-8 text-center font-fa text-muted-foreground">
              در حال خواندن وضعیت محلی حساب…
            </div>
          ) : resolvedMode === "guest" ? (
            <GuestState onStart={startDemoSession} />
          ) : resolvedMode === "expired" ? (
            <ExpiredState onRestart={startDemoSession} onReset={resetDemoSession} />
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
              <AccountSidebar section={section} onSignOut={resetDemoSession} />
              <div className="min-w-0">
                {section === "overview" ? (
                  <OverviewSection wishlistCount={wishlistCount} addressCount={addressCount} />
                ) : null}
                {section === "profile" ? <ProfileSection /> : null}
                {section === "addresses" ? <AddressesSection /> : null}
                {section === "orders" ? <OrdersSection orderId={order} /> : null}
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

function GuestState({ onStart }: { onStart: () => void }) {
  return (
    <div
      data-testid="account-guest-state"
      className="mt-8 grid min-h-[25rem] place-items-center rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface p-8 text-center"
    >
      <div className="max-w-2xl">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-interactive text-primary">
          <CircleUserRound aria-hidden="true" className="size-8" />
        </span>
        <h2 className="mt-5 font-display text-3xl font-black">حالت مهمان</h2>
        <p className="mt-3 font-fa leading-7 text-muted-foreground">
          برای تست Dashboard می‌توانید یک نشست کاملاً محلی و نمایشی فعال کنید. این کار ورود واقعی
          نیست و هیچ اعتبارنامه‌ای درخواست یا ارسال نمی‌کند.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" size="lg" onClick={onStart} data-testid="account-start-demo">
            <UserRound aria-hidden="true" />
            فعال‌کردن نشست نمایشی
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">مشاهده فرم ورود نمایشی</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ExpiredState({ onRestart, onReset }: { onRestart: () => void; onReset: () => void }) {
  return (
    <div
      data-testid="account-expired-state"
      className="mt-8 grid min-h-[25rem] place-items-center rounded-[var(--radius-xl)] border border-warning/40 bg-warning/5 p-8 text-center"
    >
      <div className="max-w-2xl">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-warning/10 text-warning">
          <AlertTriangle aria-hidden="true" className="size-8" />
        </span>
        <h2 className="mt-5 font-display text-3xl font-black">نشست نمایشی منقضی شده</h2>
        <p className="mt-3 font-fa leading-7 text-muted-foreground">
          این وضعیت فقط برای تست UI خطای session-expired است؛ هیچ نشست Backend وجود ندارد.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" size="lg" onClick={onRestart} data-testid="account-restart-demo">
            <RotateCcw aria-hidden="true" />
            شروع دوباره نشست نمایشی
          </Button>
          <Button type="button" size="lg" variant="outline" onClick={onReset}>
            بازگشت به حالت مهمان
          </Button>
        </div>
      </div>
    </div>
  );
}

function AccountSidebar({ section, onSignOut }: { section: AccountSection; onSignOut: () => void }) {
  const links = [
    { id: "overview", label: "داشبورد", icon: Home },
    { id: "profile", label: "پروفایل", icon: UserRound },
    { id: "addresses", label: "آدرس‌ها", icon: MapPin },
    { id: "orders", label: "سفارش‌های نمایشی", icon: PackageCheck },
  ] as const;

  return (
    <aside className="rounded-[var(--radius-xl)] border border-border bg-surface p-3 lg:sticky lg:top-28 lg:self-start">
      <nav aria-label="بخش‌های حساب" className="grid gap-1">
        {links.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <Link
              key={item.id}
              to="/account"
              search={{ section: item.id }}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 font-fa text-sm transition-colors ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-interactive hover:text-foreground"
              }`}
            >
              <Icon aria-hidden="true" className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-3 border-t border-border pt-3">
        <Button type="button" variant="ghost" className="w-full justify-start" onClick={onSignOut}>
          <LogOut aria-hidden="true" />
          پایان نشست نمایشی
        </Button>
      </div>
    </aside>
  );
}

function OverviewSection({ wishlistCount, addressCount }: { wishlistCount: number; addressCount: number }) {
  const cards = [
    {
      label: "علاقه‌مندی محلی",
      value: wishlistCount.toLocaleString("fa-IR"),
      helper: "آیتم ذخیره‌شده در مرورگر",
      icon: Heart,
      to: "/wishlist" as const,
    },
    {
      label: "آدرس نمایشی",
      value: addressCount.toLocaleString("fa-IR"),
      helper: "رکورد local-only",
      icon: MapPin,
      search: { section: "addresses" as const },
    },
    {
      label: "سفارش نمایشی",
      value: DEMO_ORDERS.length.toLocaleString("fa-IR"),
      helper: "برای تست رابط؛ نه خرید واقعی",
      icon: PackageCheck,
      search: { section: "orders" as const },
    },
  ];

  return (
    <section data-testid="account-overview">
      <div className="eyebrow text-primary">Dashboard</div>
      <h2 className="mt-2 font-display text-3xl font-black">نمای کلی حساب</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const content = (
            <div className="h-full rounded-[var(--radius-xl)] border border-border bg-surface p-5 transition-colors hover:border-primary/60">
              <span className="grid size-11 place-items-center rounded-full bg-interactive text-primary">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <div className="mt-5 font-mono-num text-3xl font-bold">{card.value}</div>
              <p className="mt-1 font-fa font-semibold">{card.label}</p>
              <p className="mt-2 font-fa text-xs leading-5 text-muted-foreground">{card.helper}</p>
            </div>
          );

          return card.to ? (
            <Link key={card.label} to={card.to} className="block min-h-11 rounded-[var(--radius-xl)]">
              {content}
            </Link>
          ) : (
            <Link
              key={card.label}
              to="/account"
              search={card.search!}
              className="block min-h-11 rounded-[var(--radius-xl)]"
            >
              {content}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-6">
          <BookOpenCheck aria-hidden="true" className="size-6 text-primary" />
          <h3 className="mt-4 font-display text-xl font-bold">مرز داده روشن است</h3>
          <p className="mt-2 font-fa text-sm leading-6 text-muted-foreground">
            پروفایل و آدرس‌ها برای تست تعامل ذخیره محلی هستند. تاریخچه سفارش ثابت و نمونه است و
            هیچ تراکنش واقعی را نمایش نمی‌دهد.
          </p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-6">
          <ShoppingBag aria-hidden="true" className="size-6 text-primary" />
          <h3 className="mt-4 font-display text-xl font-bold">ادامه تجربه خرید</h3>
          <p className="mt-2 font-fa text-sm leading-6 text-muted-foreground">
            Wishlist به Dataset واقعی همین فرانت متصل است و با کارت‌های محصول همگام می‌ماند.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/products">رفتن به فروشگاه</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ProfileSection() {
  const profile = useStore((state) => state.demoProfile);
  const updateProfile = useStore((state) => state.updateDemoProfile);
  const [draft, setDraft] = useState<DemoAccountProfile>(profile);
  const [status, setStatus] = useState("");

  useEffect(() => setDraft(profile), [profile]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (draft.name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
      setStatus("نام و ایمیل معتبر را کامل کنید.");
      return;
    }
    updateProfile({
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
    });
    setStatus("پروفایل نمایشی در همین مرورگر ذخیره شد.");
  };

  return (
    <section data-testid="account-profile">
      <div className="eyebrow text-primary">Profile</div>
      <h2 className="mt-2 font-display text-3xl font-black">پروفایل محلی</h2>
      <p className="mt-3 font-fa text-sm leading-6 text-muted-foreground">
        این اطلاعات برای تست UI است و به سرور ارسال نمی‌شود.
      </p>
      <form onSubmit={submit} className="mt-6 max-w-2xl space-y-5 rounded-[var(--radius-xl)] border border-border bg-surface p-6">
        <LabeledInput
          id="demo-profile-name"
          label="نام نمایشی"
          value={draft.name}
          onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
          autoComplete="name"
        />
        <LabeledInput
          id="demo-profile-email"
          label="ایمیل نمایشی"
          value={draft.email}
          onChange={(value) => setDraft((current) => ({ ...current, email: value }))}
          autoComplete="email"
          dir="ltr"
          inputMode="email"
        />
        <LabeledInput
          id="demo-profile-phone"
          label="موبایل نمایشی"
          value={draft.phone}
          onChange={(value) => setDraft((current) => ({ ...current, phone: value }))}
          autoComplete="tel"
          dir="ltr"
          inputMode="tel"
        />
        <Button type="submit" data-testid="account-profile-save">ذخیره محلی</Button>
        {status ? <p role="status" className="font-fa text-sm text-muted-foreground">{status}</p> : null}
      </form>
    </section>
  );
}

function AddressesSection() {
  const addresses = useStore((state) => state.demoAddresses);
  const addAddress = useStore((state) => state.addDemoAddress);
  const removeAddress = useStore((state) => state.removeDemoAddress);
  const [recipient, setRecipient] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (recipient.trim().length < 2 || city.trim().length < 2 || address.trim().length < 5) {
      setStatus("نام گیرنده، شهر و نشانی نمایشی را کامل کنید.");
      return;
    }
    addAddress({ recipient: recipient.trim(), city: city.trim(), address: address.trim() });
    setRecipient("");
    setCity("");
    setAddress("");
    setStatus("آدرس نمایشی در همین مرورگر ذخیره شد.");
  };

  return (
    <section data-testid="account-addresses">
      <div className="eyebrow text-primary">Addresses</div>
      <h2 className="mt-2 font-display text-3xl font-black">آدرس‌های نمایشی</h2>
      <p className="mt-3 font-fa text-sm leading-6 text-muted-foreground">
        این آدرس‌ها فقط local-only هستند و برای ارسال کالا استفاده نمی‌شوند.
      </p>

      <div className="mt-6 grid gap-4">
        {addresses.length ? (
          addresses.map((item) => (
            <article key={item.id} className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-surface p-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-fa font-bold">{item.recipient}</p>
                <p className="mt-2 font-fa text-sm text-muted-foreground">{item.city}</p>
                <p className="mt-1 font-fa text-sm leading-6 text-muted-foreground">{item.address}</p>
                <span className="mt-3 inline-flex rounded-full border border-border px-2 py-1 font-fa text-xs text-muted-foreground">
                  local-only
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                aria-label={`حذف آدرس ${item.recipient}`}
                onClick={() => removeAddress(item.id)}
              >
                <Trash2 aria-hidden="true" />
                حذف
              </Button>
            </article>
          ))
        ) : (
          <div data-testid="account-address-empty" className="rounded-[var(--radius-xl)] border border-dashed border-border-strong p-6 font-fa text-sm text-muted-foreground">
            هنوز آدرس نمایشی ذخیره نشده است.
          </div>
        )}
      </div>

      <form onSubmit={submit} className="mt-6 max-w-2xl space-y-5 rounded-[var(--radius-xl)] border border-border bg-surface p-6">
        <div className="flex items-center gap-2">
          <Plus aria-hidden="true" className="size-5 text-primary" />
          <h3 className="font-display text-xl font-bold">افزودن آدرس محلی</h3>
        </div>
        <LabeledInput id="demo-address-recipient" label="نام گیرنده نمایشی" value={recipient} onChange={setRecipient} />
        <LabeledInput id="demo-address-city" label="شهر" value={city} onChange={setCity} />
        <div>
          <label htmlFor="demo-address-line" className="mb-2 block font-fa text-sm font-medium">نشانی نمایشی</label>
          <textarea
            id="demo-address-line"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            rows={3}
            className="w-full rounded-[var(--radius-md)] border border-input bg-background px-4 py-3 font-fa outline-none focus:border-primary"
          />
        </div>
        <Button type="submit" data-testid="account-address-add">ذخیره آدرس محلی</Button>
        {status ? <p role="status" className="font-fa text-sm text-muted-foreground">{status}</p> : null}
      </form>
    </section>
  );
}

function OrdersSection({ orderId }: { orderId?: string }) {
  const selectedOrder = useMemo(
    () => DEMO_ORDERS.find((item) => item.id === orderId),
    [orderId],
  );

  if (orderId) {
    if (!selectedOrder) {
      return (
        <section data-testid="account-order-missing">
          <div className="eyebrow text-primary">Order detail</div>
          <h2 className="mt-2 font-display text-3xl font-black">سفارش نمایشی پیدا نشد</h2>
          <p className="mt-3 font-fa leading-7 text-muted-foreground">
            شناسه خواسته‌شده در Dataset نمونه F9 وجود ندارد؛ هیچ درخواست Backend انجام نشد.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/account" search={{ section: "orders" }}>
              <ArrowLeft aria-hidden="true" />
              بازگشت به فهرست
            </Link>
          </Button>
        </section>
      );
    }

    const shoe = SHOES.find((item) => item.id === selectedOrder.productId);
    const unitPrice = shoe?.sale_price ?? shoe?.price ?? 0;
    return (
      <section data-testid="account-order-detail">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="eyebrow text-primary">Order detail / Demo</div>
            <h2 className="mt-2 font-display text-3xl font-black">{selectedOrder.id}</h2>
          </div>
          <Button asChild variant="outline">
            <Link to="/account" search={{ section: "orders" }}>
              <ArrowLeft aria-hidden="true" />
              همه سفارش‌ها
            </Link>
          </Button>
        </div>

        <div className="mt-6 rounded-[var(--radius-xl)] border border-warning/40 bg-warning/5 p-5 font-fa text-sm leading-6 text-muted-foreground">
          این رسید کاملاً نمونه است؛ شماره سفارش، تاریخ و وضعیت آن تراکنش واقعی نیستند.
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <article className="rounded-[var(--radius-xl)] border border-border bg-surface p-6">
            <h3 className="font-display text-xl font-bold">آیتم نمایشی</h3>
            <div className="mt-5 flex gap-4">
              <div className="size-24 shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-surface-2">
                {shoe ? <img src={shoe.image} alt="" width={96} height={96} className="size-full object-cover" /> : null}
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg font-bold"><bdi dir="ltr">{shoe?.brand} {shoe?.name}</bdi></p>
                <p className="mt-2 font-fa text-sm text-muted-foreground">سایز نمایشی: {selectedOrder.size}</p>
                <p className="mt-1 font-fa text-sm text-muted-foreground">تعداد: {selectedOrder.qty.toLocaleString("fa-IR")}</p>
                <Price value={unitPrice * selectedOrder.qty} className="mt-3 font-bold" />
              </div>
            </div>
          </article>
          <aside className="rounded-[var(--radius-xl)] border border-border bg-surface p-6">
            <dl className="space-y-4 font-fa text-sm">
              <div><dt className="text-muted-foreground">تاریخ نمونه</dt><dd className="mt-1 font-semibold">{selectedOrder.placedAt}</dd></div>
              <div><dt className="text-muted-foreground">وضعیت نمونه</dt><dd className="mt-1 font-semibold">{selectedOrder.status}</dd></div>
              <div><dt className="text-muted-foreground">پرداخت</dt><dd className="mt-1 font-semibold">انجام نشده — UI فقط نمایشی</dd></div>
              <div><dt className="text-muted-foreground">ارسال</dt><dd className="mt-1 font-semibold">اطلاعات واقعی موجود نیست</dd></div>
            </dl>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section data-testid="account-orders">
      <div className="eyebrow text-primary">Orders / Demo dataset</div>
      <h2 className="mt-2 font-display text-3xl font-black">سفارش‌های نمایشی</h2>
      <p className="mt-3 font-fa text-sm leading-6 text-muted-foreground">
        این فهرست ثابت برای تست List/Detail است و به خرید، پرداخت یا API واقعی متصل نیست.
      </p>
      <div className="mt-6 grid gap-4">
        {DEMO_ORDERS.map((item) => {
          const shoe = SHOES.find((candidate) => candidate.id === item.productId);
          return (
            <article key={item.id} className="rounded-[var(--radius-xl)] border border-border bg-surface p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono-num text-sm font-bold">{item.id}</p>
                  <p className="mt-2 font-fa text-sm text-muted-foreground">{item.placedAt} — {item.status}</p>
                  <p className="mt-1 text-sm"><bdi dir="ltr">{shoe?.brand} {shoe?.name}</bdi></p>
                </div>
                <Button asChild variant="outline">
                  <Link to="/account" search={{ section: "orders", order: item.id }} data-testid="account-order-open">
                    جزئیات نمونه
                  </Link>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function LabeledInput({
  id,
  label,
  value,
  onChange,
  ...props
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange">) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-fa text-sm font-medium">{label}</label>
      <input
        {...props}
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-[var(--radius-md)] border border-input bg-background px-4 outline-none focus:border-primary"
      />
    </div>
  );
}

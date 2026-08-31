import { Link } from "@tanstack/react-router";
import {
  CircleUserRound,
  Download,
  LogOut,
  MapPin,
  PackageCheck,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import {
  accountExportUrl,
  cancelAccountDeletion,
  deleteAddress,
  getAddresses,
  getConsents,
  getCustomerSession,
  logoutCustomer,
  recordConsent,
  requestAccountDeletion,
  saveAddress,
  updateCustomerProfile,
  type ConsentRecord,
  type CustomerAddress,
  type CustomerSession,
} from "@/auth/customer-auth";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";

export type ProductionAccountSection = "overview" | "profile" | "addresses" | "orders";

export function ProductionAccountPage({ section }: { section: ProductionAccountSection }) {
  const [session, setSession] = useState<CustomerSession | null | undefined>(undefined);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [status, setStatus] = useState("");

  const refresh = useCallback(async () => {
    try {
      const current = await getCustomerSession();
      setSession(current);
      if (current) {
        const [nextAddresses, nextConsents] = await Promise.all([getAddresses(), getConsents()]);
        setAddresses(nextAddresses);
        setConsents(nextConsents);
      }
    } catch {
      setStatus("دریافت اطلاعات حساب انجام نشد. دوباره تلاش کنید.");
      setSession(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (session === undefined) {
    return <AccountShell><div role="status" className="grid min-h-[24rem] place-items-center font-fa text-muted-foreground">در حال دریافت حساب…</div></AccountShell>;
  }

  if (!session) {
    return (
      <AccountShell>
        <div className="grid min-h-[26rem] place-items-center rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface p-8 text-center">
          <div className="max-w-xl">
            <CircleUserRound aria-hidden="true" className="mx-auto size-14 text-primary" />
            <h1 className="mt-5 font-display text-3xl font-black">برای مشاهده حساب وارد شوید</h1>
            <p className="mt-3 font-fa leading-7 text-muted-foreground">اطلاعات حساب فقط پس از ورود امن Google از سرور دریافت می‌شود.</p>
            <Button asChild size="lg" className="mt-6"><Link to="/auth">ورود به SOLE</Link></Button>
          </div>
        </div>
      </AccountShell>
    );
  }

  if (!session.account_complete) {
    return (
      <AccountShell>
        <div className="grid min-h-[26rem] place-items-center rounded-[var(--radius-xl)] border border-warning/40 bg-warning/5 p-8 text-center">
          <div className="max-w-xl">
            <MapPin aria-hidden="true" className="mx-auto size-12 text-warning" />
            <h1 className="mt-5 font-display text-3xl font-black">حساب را تکمیل کنید</h1>
            <p className="mt-3 font-fa leading-7 text-muted-foreground">برای استفاده از بخش حساب، شماره همراه خود را تکمیل کنید.</p>
            <Button asChild size="lg" className="mt-6"><a href="/auth?complete=phone">تکمیل شماره همراه</a></Button>
          </div>
        </div>
      </AccountShell>
    );
  }

  const signOut = async () => {
    try {
      await logoutCustomer();
    } finally {
      window.location.assign("/auth");
    }
  };

  return (
    <AccountShell>
      <div className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow text-primary">Customer account</div>
          <h1 className="mt-3 font-display text-[length:var(--text-h1)] font-black leading-[1.05]">حساب من</h1>
          <p className="mt-3 font-fa text-muted-foreground">{session.email}</p>
        </div>
        <Button type="button" variant="outline" onClick={signOut}><LogOut aria-hidden="true" />خروج امن</Button>
      </div>

      {status ? <p role="status" className="mt-4 rounded-[var(--radius-md)] border border-warning/40 bg-warning/5 p-3 text-sm">{status}</p> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <AccountNav section={section} />
        <div className="min-w-0">
          {section === "overview" ? (
            <Overview session={session} consents={consents} onRefresh={refresh} onStatus={setStatus} />
          ) : null}
          {section === "profile" ? <Profile session={session} onRefresh={refresh} onStatus={setStatus} /> : null}
          {section === "addresses" ? (
            <Addresses addresses={addresses} onRefresh={refresh} onStatus={setStatus} />
          ) : null}
          {section === "orders" ? <OrdersDeferred /> : null}
        </div>
      </div>
    </AccountShell>
  );
}

function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="production-account-page">
      <Navbar />
      <main className="px-[var(--space-page-gutter)] py-10 pb-[calc(var(--safe-bottom-nav)+env(safe-area-inset-bottom)+3rem)] md:py-16">
        <section className="mx-auto max-w-[1280px]">{children}</section>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

function AccountNav({ section }: { section: ProductionAccountSection }) {
  const links = [
    { id: "overview", label: "داشبورد", icon: ShieldCheck },
    { id: "profile", label: "پروفایل", icon: UserRound },
    { id: "addresses", label: "آدرس‌ها", icon: MapPin },
    { id: "orders", label: "سفارش‌ها", icon: PackageCheck },
  ] as const;

  return (
    <aside className="rounded-[var(--radius-xl)] border border-border bg-surface p-3 lg:sticky lg:top-28 lg:self-start">
      <nav aria-label="بخش‌های حساب" className="grid gap-1">
        {links.map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            to="/account"
            search={{ section: id }}
            aria-current={section === id ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 font-fa text-sm transition-colors ${section === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-interactive hover:text-foreground"}`}
          >
            <Icon aria-hidden="true" className="size-4" />{label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function Overview({
  session,
  consents,
  onRefresh,
  onStatus,
}: {
  session: CustomerSession;
  consents: ConsentRecord[];
  onRefresh: () => Promise<void>;
  onStatus: (value: string) => void;
}) {
  const privacy = consents.find((item) => item.type === "privacy");
  const deletionPending = session.account_status === "deletion_requested";

  const setPrivacy = async () => {
    try {
      await recordConsent({ type: "privacy", granted: true, policy_version: "2026-08-31" });
      await onRefresh();
      onStatus("ثبت رضایت‌نامه با موفقیت انجام شد.");
    } catch {
      onStatus("ثبت رضایت‌نامه انجام نشد.");
    }
  };

  const deletion = async () => {
    try {
      if (deletionPending) await cancelAccountDeletion();
      else await requestAccountDeletion();
      await onRefresh();
      onStatus(deletionPending ? "درخواست حذف حساب لغو شد." : "درخواست حذف حساب ثبت شد و تا زمان اجرای کنترل‌شده قابل لغو است.");
    } catch {
      onStatus("تغییر وضعیت حذف حساب انجام نشد.");
    }
  };

  return (
    <div className="space-y-6" data-testid="production-account-overview">
      <div className="grid gap-4 sm:grid-cols-2">
        <Summary title="نام" value={session.name} />
        <Summary title="شماره همراه" value={session.phone_e164 ?? "ثبت نشده"} />
      </div>

      <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-6">
        <h2 className="font-display text-2xl font-black">حریم خصوصی و داده حساب</h2>
        <p className="mt-2 font-fa leading-7 text-muted-foreground">تاریخچه رضایت‌ها append-only است و خروجی داده حساب مستقیماً از Backend ساخته می‌شود.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline"><a href={accountExportUrl()}><Download aria-hidden="true" />دریافت خروجی حساب</a></Button>
          {!privacy?.granted ? <Button type="button" variant="outline" onClick={setPrivacy}><ShieldCheck aria-hidden="true" />ثبت رضایت حریم خصوصی</Button> : null}
        </div>
      </section>

      <section className="rounded-[var(--radius-xl)] border border-danger/30 bg-danger/5 p-6">
        <h2 className="font-display text-2xl font-black">مدیریت حذف حساب</h2>
        <p className="mt-2 font-fa leading-7 text-muted-foreground">
          {deletionPending ? "درخواست حذف ثبت شده است. تا قبل از اجرای نهایی می‌توانید آن را لغو کنید." : "درخواست حذف، حساب را بلافاصله پاک نمی‌کند؛ اجرای نهایی به‌صورت کنترل‌شده و قابل حسابرسی انجام می‌شود."}
        </p>
        <Button type="button" variant={deletionPending ? "outline" : "destructive"} className="mt-5" onClick={deletion}>
          <Trash2 aria-hidden="true" />{deletionPending ? "لغو درخواست حذف" : "درخواست حذف حساب"}
        </Button>
      </section>
    </div>
  );
}

function Profile({
  session,
  onRefresh,
  onStatus,
}: {
  session: CustomerSession;
  onRefresh: () => Promise<void>;
  onStatus: (value: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await updateCustomerProfile({
        name: String(data.get("name") ?? "").trim(),
        phone: String(data.get("phone") ?? "").trim(),
        locale: "fa-IR",
      });
      await onRefresh();
      onStatus("پروفایل ذخیره شد.");
    } catch {
      onStatus("ذخیره پروفایل انجام نشد؛ شماره همراه را بررسی کنید.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-[var(--radius-xl)] border border-border bg-surface p-6" data-testid="production-profile-form">
      <h2 className="font-display text-2xl font-black">پروفایل</h2>
      <div className="mt-6 grid gap-5">
        <Field label="نام" name="name" defaultValue={session.name} autoComplete="name" />
        <Field label="ایمیل Google" name="email" defaultValue={session.email} type="email" disabled dir="ltr" />
        <Field label="شماره همراه" name="phone" defaultValue={session.phone_e164 ?? ""} type="tel" autoComplete="tel" dir="ltr" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">تغییر شماره، وضعیت تأیید قبلی آن را پاک می‌کند. OTP تا فعال‌سازی رسمی سرویس غیرفعال است.</p>
      <Button type="submit" className="mt-6" loading={saving} loadingLabel="در حال ذخیره">ذخیره پروفایل</Button>
    </form>
  );
}

function Addresses({
  addresses,
  onRefresh,
  onStatus,
}: {
  addresses: CustomerAddress[];
  onRefresh: () => Promise<void>;
  onStatus: (value: string) => void;
}) {
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await saveAddress({
        id: editing?.id,
        label: String(data.get("label") ?? "").trim() || null,
        recipient_name: String(data.get("recipient_name") ?? "").trim(),
        phone: String(data.get("phone") ?? "").trim(),
        country_code: "IR",
        province: String(data.get("province") ?? "").trim(),
        city: String(data.get("city") ?? "").trim(),
        postal_code: String(data.get("postal_code") ?? "").trim() || null,
        address_line1: String(data.get("address_line1") ?? "").trim(),
        address_line2: String(data.get("address_line2") ?? "").trim() || null,
        is_default: data.get("is_default") === "on",
      });
      setEditing(null);
      event.currentTarget.reset();
      await onRefresh();
      onStatus("آدرس ذخیره شد.");
    } catch {
      onStatus("ذخیره آدرس انجام نشد.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await deleteAddress(id);
      await onRefresh();
      onStatus("آدرس حذف شد.");
    } catch {
      onStatus("حذف آدرس انجام نشد.");
    }
  };

  return (
    <div className="space-y-6" data-testid="production-addresses">
      <div className="grid gap-4 md:grid-cols-2">
        {addresses.map((address) => (
          <article key={address.id} className="rounded-[var(--radius-xl)] border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-semibold">{address.label || "آدرس"}</p><p className="mt-1 text-sm text-muted-foreground">{address.recipient_name}</p></div>
              {address.is_default ? <span className="rounded-full bg-interactive px-2 py-1 text-xs text-primary">پیش‌فرض</span> : null}
            </div>
            <p className="mt-4 font-fa text-sm leading-6 text-muted-foreground">{address.province}، {address.city}، {address.address_line1}</p>
            <div className="mt-4 flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setEditing(address)}>ویرایش</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => remove(address.id)}>حذف</Button>
            </div>
          </article>
        ))}
      </div>

      <form key={editing?.id ?? "new"} onSubmit={submit} className="rounded-[var(--radius-xl)] border border-border bg-surface p-6">
        <h2 className="flex items-center gap-2 font-display text-2xl font-black"><Plus aria-hidden="true" />{editing ? "ویرایش آدرس" : "افزودن آدرس"}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="عنوان" name="label" defaultValue={editing?.label ?? ""} />
          <Field label="نام گیرنده" name="recipient_name" defaultValue={editing?.recipient_name ?? ""} required />
          <Field label="شماره همراه گیرنده" name="phone" defaultValue={editing?.phone_e164 ?? ""} required dir="ltr" />
          <Field label="استان" name="province" defaultValue={editing?.province ?? ""} required />
          <Field label="شهر" name="city" defaultValue={editing?.city ?? ""} required />
          <Field label="کدپستی" name="postal_code" defaultValue={editing?.postal_code ?? ""} dir="ltr" />
          <div className="sm:col-span-2"><Field label="نشانی" name="address_line1" defaultValue={editing?.address_line1 ?? ""} required /></div>
          <div className="sm:col-span-2"><Field label="توضیحات تکمیلی" name="address_line2" defaultValue={editing?.address_line2 ?? ""} /></div>
        </div>
        <label className="mt-4 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name="is_default" defaultChecked={editing?.is_default ?? addresses.length === 0} />آدرس پیش‌فرض</label>
        <div className="mt-5 flex gap-3">
          <Button type="submit" loading={saving} loadingLabel="در حال ذخیره">ذخیره آدرس</Button>
          {editing ? <Button type="button" variant="outline" onClick={() => setEditing(null)}>انصراف</Button> : null}
        </div>
      </form>
    </div>
  );
}

function OrdersDeferred() {
  return (
    <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-8 text-center">
      <PackageCheck aria-hidden="true" className="mx-auto size-12 text-muted-foreground" />
      <h2 className="mt-4 font-display text-2xl font-black">سفارش‌های واقعی هنوز متصل نشده‌اند</h2>
      <p className="mt-3 font-fa leading-7 text-muted-foreground">حساب و آدرس‌ها اکنون واقعی‌اند؛ order truth در P06 به همین حساب متصل می‌شود. این صفحه سفارش ساختگی نمایش نمی‌دهد.</p>
    </div>
  );
}

function Summary({ title, value }: { title: string; value: string }) {
  return <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-5"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 font-semibold" dir={title.includes("همراه") ? "ltr" : undefined}>{value}</p></div>;
}

function Field({ label, name, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return <label className="block text-sm font-medium">{label}<input {...props} name={name} className="mt-2 min-h-12 w-full rounded-[var(--radius-md)] border border-input bg-background px-4 outline-none focus:border-primary disabled:opacity-60" /></label>;
}

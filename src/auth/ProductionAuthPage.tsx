import { CheckCircle2, CircleUserRound, ShieldCheck, Smartphone } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import {
  getCustomerSession,
  updateCustomerProfile,
  type CustomerSession,
} from "@/auth/customer-auth";

type Props = { completePhone: boolean };

export function ProductionAuthPage({ completePhone }: Props) {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(completePhone);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!completePhone) return;
    let active = true;
    void getCustomerSession()
      .then((value) => {
        if (active) setSession(value);
      })
      .catch(() => {
        if (active) setStatus("دریافت وضعیت حساب ممکن نشد. دوباره تلاش کنید.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [completePhone]);

  const submitPhone = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || submitting) return;
    const data = new FormData(event.currentTarget);
    const phone = String(data.get("phone") ?? "").trim();
    const name = String(data.get("name") ?? "").trim();
    if (name.length < 2 || phone.length < 10) {
      setStatus("نام و شماره همراه معتبر را وارد کنید.");
      return;
    }

    setSubmitting(true);
    setStatus("");
    try {
      await updateCustomerProfile({ name, phone, locale: "fa-IR" });
      window.location.assign("/account");
    } catch {
      setStatus("ذخیره اطلاعات حساب انجام نشد. شماره همراه را بررسی و دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  const needsPhone = completePhone && session !== null && !session.account_complete;

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="production-auth-page">
      <Navbar />
      <main className="px-[var(--space-page-gutter)] py-10 pb-[calc(var(--safe-bottom-nav)+env(safe-area-inset-bottom)+3rem)] md:py-16">
        <section className="mx-auto grid max-w-[74rem] gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 lg:p-10">
            <div className="eyebrow text-primary">Secure customer account</div>
            <h1 className="mt-4 font-display text-[length:var(--text-h1)] font-black leading-[1.05]">
              ورود امن به SOLE
            </h1>
            <p className="mt-4 font-fa leading-8 text-muted-foreground">
              ورود مشتری با حساب Google انجام می‌شود. بعد از اولین ورود، شماره همراه برای تکمیل حساب
              لازم است.
            </p>
            <div className="mt-8 space-y-4">
              <TrustRow icon={ShieldCheck} title="نشست امن" text="نشست با کوکی امن و HttpOnly مدیریت می‌شود." />
              <TrustRow icon={CircleUserRound} title="بدون رمز عبور SOLE" text="رمز Google شما هرگز به SOLE ارسال نمی‌شود." />
              <TrustRow icon={Smartphone} title="شماره همراه لازم" text="شماره برای تکمیل پروفایل و ارتباطات ضروری حساب استفاده می‌شود." />
            </div>
          </aside>

          <div className="rounded-[var(--radius-xl)] border border-border bg-background p-6 shadow-sm lg:p-10">
            {loading ? (
              <div role="status" className="grid min-h-[22rem] place-items-center font-fa text-muted-foreground">
                در حال بررسی نشست…
              </div>
            ) : needsPhone ? (
              <form onSubmit={submitPhone} className="mx-auto max-w-xl space-y-5" data-testid="production-phone-completion">
                <div className="eyebrow text-primary">Complete account</div>
                <h2 className="font-display text-3xl font-black">تکمیل اطلاعات حساب</h2>
                <p className="font-fa leading-7 text-muted-foreground">
                  ورود Google موفق بود. برای ادامه، نام و شماره همراه خود را ثبت کنید.
                </p>
                <label className="block text-sm font-medium" htmlFor="customer-name">
                  نام
                </label>
                <input
                  id="customer-name"
                  name="name"
                  defaultValue={session.name}
                  autoComplete="name"
                  required
                  minLength={2}
                  className="min-h-12 w-full rounded-[var(--radius-md)] border border-input bg-surface px-4 outline-none focus:border-primary"
                />
                <label className="block text-sm font-medium" htmlFor="customer-phone">
                  شماره همراه
                </label>
                <input
                  id="customer-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                  placeholder="09121234567"
                  required
                  className="min-h-12 w-full rounded-[var(--radius-md)] border border-input bg-surface px-4 text-left outline-none focus:border-primary"
                />
                <p className="text-sm leading-6 text-muted-foreground">
                  زیرساخت تأیید پیامکی به‌صورت امن نگه‌داری می‌شود؛ تا زمان فعال‌سازی رسمی سرویس،
                  وضعیت تأیید شماره به‌دروغ نمایش داده نمی‌شود.
                </p>
                {status ? <p role="alert" className="text-sm text-danger">{status}</p> : null}
                <Button type="submit" size="lg" loading={submitting} loadingLabel="در حال ذخیره" className="w-full">
                  <CheckCircle2 aria-hidden="true" />
                  تکمیل حساب
                </Button>
              </form>
            ) : session && completePhone ? (
              <div className="grid min-h-[22rem] place-items-center text-center">
                <div>
                  <CheckCircle2 aria-hidden="true" className="mx-auto size-12 text-success" />
                  <h2 className="mt-4 font-display text-3xl font-black">حساب شما کامل است</h2>
                  <Button className="mt-6" asChild>
                    <a href="/account">رفتن به حساب</a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid min-h-[22rem] place-items-center text-center">
                <div className="max-w-md">
                  <span className="mx-auto grid size-16 place-items-center rounded-full bg-interactive text-primary">
                    <CircleUserRound aria-hidden="true" className="size-8" />
                  </span>
                  <h2 className="mt-5 font-display text-3xl font-black">ادامه با Google</h2>
                  <p className="mt-3 font-fa leading-7 text-muted-foreground">
                    با ادامه‌دادن، فقط اطلاعات هویتی موردنیاز حساب از Google دریافت می‌شود.
                  </p>
                  <Button asChild size="lg" className="mt-7 w-full">
                    <a href="/api/auth/google/start?return_to=%2Faccount" data-testid="google-login-link">
                      ورود با Google
                    </a>
                  </Button>
                  {status ? <p role="alert" className="mt-4 text-sm text-danger">{status}</p> : null}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

function TrustRow({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-interactive text-primary">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 font-fa text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

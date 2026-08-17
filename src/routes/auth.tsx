import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff, Info, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes } from "react";

import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "ورود نمایشی — SOLE" },
      { name: "description", content: "رابط نمایشی احراز هویت SOLE بدون Backend یا حساب واقعی." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "register";
type FieldName = "name" | "email" | "password";
type Errors = Partial<Record<FieldName, string>>;

function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const busyRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const changeMode = (next: Mode) => {
    if (busyRef.current) return;
    setMode(next);
    setErrors({});
    setStatus("");
    setShowPassword(false);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busyRef.current) return;

    const nextErrors = validate(mode, new FormData(event.currentTarget));
    setErrors(nextErrors);
    setStatus("");
    const firstInvalid = (["name", "email", "password"] as const).find(
      (field) => nextErrors[field],
    );
    if (firstInvalid) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus(),
      );
      return;
    }

    busyRef.current = true;
    setSubmitting(true);
    timerRef.current = window.setTimeout(() => {
      setStatus("ورود واقعی انجام نمی‌شود؛ این نمونه به سرویس احراز هویت متصل نیست.");
      setSubmitting(false);
      busyRef.current = false;
      timerRef.current = null;
    }, 450);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="outline-none">
        <section className="px-[var(--space-page-gutter)] py-10 pb-[calc(var(--safe-bottom-nav)+env(safe-area-inset-bottom)+3rem)] md:py-16">
          <div className="mx-auto grid max-w-[80rem] gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <aside className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 lg:p-10">
              <div className="eyebrow text-primary">Authentication boundary</div>
              <p className="mt-4 text-2xl font-bold">حساب واقعی هنوز فعال نیست</p>
              <p className="mt-4 font-fa leading-8 text-muted-foreground">
                این صفحه فقط رفتار فرم، اعتبارسنجی و دسترسی‌پذیری را نمایش می‌دهد. هیچ حساب، نشست،
                OTP یا بازیابی رمزی ساخته نمی‌شود.
              </p>
              <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-lg)] border border-warning/40 bg-warning/5 p-4 text-sm">
                <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
                <p className="font-fa leading-6 text-muted-foreground">
                  اطلاعات واردشده ارسال یا در localStorage و sessionStorage ذخیره نمی‌شوند.
                </p>
              </div>
            </aside>

            <div className="mx-auto w-full max-w-[40rem]">
              <div className="eyebrow text-primary">Account UI</div>
              <h1 className="mt-3 font-display text-[length:var(--text-h1)] font-black leading-[1.05]">
                {mode === "login" ? "ورود نمایشی" : "ثبت‌نام نمایشی"}
              </h1>
              <p className="mt-4 font-fa leading-7 text-muted-foreground">
                فرم را می‌توانید با کیبورد کامل کنید؛ نتیجه همیشه مرز واقعی Backend را اعلام می‌کند.
              </p>

              <div
                role="group"
                aria-label="انتخاب نوع فرم"
                className="mt-8 grid grid-cols-2 gap-2 rounded-[var(--radius-pill)] bg-surface p-1"
              >
                {(["login", "register"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={mode === item}
                    disabled={submitting}
                    onClick={() => changeMode(item)}
                    className="min-h-11 rounded-[var(--radius-pill)] px-4 text-sm font-semibold transition-colors aria-pressed:bg-primary aria-pressed:text-primary-foreground hover:bg-interactive disabled:opacity-[var(--opacity-disabled)] motion-reduce:transition-none"
                  >
                    {item === "login" ? "ورود" : "ثبت‌نام"}
                  </button>
                ))}
              </div>

              <form
                ref={formRef}
                noValidate
                onSubmit={onSubmit}
                aria-busy={submitting}
                data-testid="auth-form"
                className="mt-6 space-y-5"
              >
                {mode === "register" ? (
                  <Field
                    id="auth-name"
                    name="name"
                    label="نام نمایشی"
                    autoComplete="name"
                    error={errors.name}
                  />
                ) : null}
                <Field
                  id="auth-email"
                  name="email"
                  type="email"
                  label="ایمیل"
                  autoComplete="email"
                  inputMode="email"
                  dir="ltr"
                  placeholder="name@example.com"
                  error={errors.email}
                />

                <div>
                  <label htmlFor="auth-password" className="mb-2 block text-sm font-medium">
                    رمز عبور
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      minLength={8}
                      dir="ltr"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={
                        errors.password
                          ? "auth-password-hint auth-password-error"
                          : "auth-password-hint"
                      }
                      className="min-h-12 w-full rounded-[var(--radius-md)] border border-input bg-surface px-4 pe-14 text-left font-mono outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "پنهان‌کردن رمز عبور" : "نمایش رمز عبور"}
                      aria-controls="auth-password"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute inset-y-0 end-0 flex w-12 items-center justify-center rounded-e-[var(--radius-md)] text-muted-foreground hover:bg-interactive hover:text-foreground"
                    >
                      {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
                  </div>
                  <p id="auth-password-hint" className="mt-2 text-sm text-muted-foreground">
                    حداقل ۸ کاراکتر؛ فقط برای اعتبارسنجی همین فرم.
                  </p>
                  {errors.password ? (
                    <p id="auth-password-error" role="alert" className="mt-2 text-sm text-danger">
                      {errors.password}
                    </p>
                  ) : null}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  loading={submitting}
                  loadingLabel="در حال بررسی محلی"
                  className="w-full"
                >
                  بررسی فرم {mode === "login" ? "ورود" : "ثبت‌نام"}
                </Button>

                {status ? (
                  <div
                    id="auth-backend-status"
                    role="status"
                    aria-live="polite"
                    className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-warning/40 bg-warning/5 p-4"
                  >
                    <ShieldAlert
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 text-warning"
                    />
                    <p className="font-fa text-sm leading-6 text-muted-foreground">{status}</p>
                  </div>
                ) : null}
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

function validate(mode: Mode, data: FormData): Errors {
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const password = String(data.get("password") ?? "");
  const errors: Errors = {};
  if (mode === "register" && name.length < 2) errors.name = "نام باید دست‌کم ۲ کاراکتر باشد.";
  if (!email) errors.email = "ایمیل را وارد کنید.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "ساختار ایمیل معتبر نیست.";
  if (!password) errors.password = "رمز عبور را وارد کنید.";
  else if (password.length < 8) errors.password = "رمز عبور باید دست‌کم ۸ کاراکتر باشد.";
  return errors;
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  name: FieldName;
  label: string;
  error?: string;
};

function Field({ id, name, label, error, ...props }: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <input
        {...props}
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="min-h-12 w-full rounded-[var(--radius-md)] border border-input bg-surface px-4 outline-none focus:border-primary"
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

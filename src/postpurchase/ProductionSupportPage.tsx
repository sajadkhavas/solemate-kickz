import { Link } from "@tanstack/react-router";
import { Bell, CircleHelp, Headphones, PackageCheck, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { ProductionFooter } from "@/auth/ProductionFooter";
import { ProductionMobileBottomNav } from "@/auth/ProductionMobileBottomNav";
import { ProductionNavbar } from "@/auth/ProductionNavbar";
import { Button } from "@/components/ui/button";
import {
  createSupportCase,
  getCommunications,
  getSupportCases,
  getTrustContent,
  type SupportCase,
  type TrustContent,
} from "@/postpurchase/postpurchase-api";

export function ProductionSupportPage() {
  const [content, setContent] = useState<TrustContent[]>([]);
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [communications, setCommunications] = useState<
    Array<{ id: string; template: string; status: string; sent_at: string | null }>
  >([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const [nextContent, nextCases, nextCommunications] = await Promise.all([
      getTrustContent(),
      getSupportCases(),
      getCommunications(),
    ]);
    setContent(nextContent);
    setCases(nextCases);
    setCommunications(nextCommunications);
  };
  useEffect(() => {
    void refresh().catch(() =>
      setStatus("اطلاعات پشتیبانی در دسترس نیست؛ هیچ وعده‌ای از داده محلی نمایش داده نشد."),
    );
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      await createSupportCase({ subject, category: "other", message });
      setSubject("");
      setMessage("");
      await refresh();
      setStatus("پرونده پشتیبانی روی Backend ثبت شد.");
    } catch {
      setStatus("ثبت پرونده انجام نشد؛ لطفاً دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      data-testid="p08-production-support-page"
    >
      <ProductionNavbar />
      <main className="px-[var(--space-page-gutter)] py-10 pb-[calc(var(--safe-bottom-nav)+env(safe-area-inset-bottom)+3rem)] md:py-16">
        <section className="mx-auto max-w-[1280px]">
          <div className="eyebrow text-primary">Trust · Support · Post-purchase</div>
          <h1 className="mt-3 font-display text-[length:var(--text-h1)] font-black">
            مرکز اعتماد و پشتیبانی
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            فقط محتوای تأییدشده، پرونده‌های متعلق به حساب شما و وضعیت واقعی پیام‌ها نمایش داده
            می‌شود.
          </p>
          {status ? (
            <p role="status" className="mt-5 rounded-xl border border-border p-3 text-sm">
              {status}
            </p>
          ) : null}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="flex items-center gap-2 text-2xl font-black">
                <CircleHelp className="size-5" /> راهنما و سیاست‌های تأییدشده
              </h2>
              {content.length ? (
                <div className="mt-5 space-y-4">
                  {content.map((item) => (
                    <article key={item.slug} className="rounded-xl border border-border p-4">
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                        {item.body}
                      </p>
                      <a
                        className="mt-3 inline-block text-xs text-primary"
                        href={item.provenance_url}
                        rel="noreferrer"
                      >
                        منبع و نسخه {item.version}
                      </a>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  محتوای تأییدشده‌ای منتشر نشده است.
                </p>
              )}
            </section>
            <form
              onSubmit={(event) => void submit(event)}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <h2 className="flex items-center gap-2 text-2xl font-black">
                <Headphones className="size-5" /> پرونده جدید
              </h2>
              <label className="mt-5 block text-sm font-medium">
                موضوع
                <input
                  required
                  maxLength={180}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-input bg-background px-3"
                />
              </label>
              <label className="mt-4 block text-sm font-medium">
                پیام
                <textarea
                  required
                  maxLength={5000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-2 min-h-28 w-full rounded-xl border border-input bg-background p-3"
                />
              </label>
              <Button disabled={busy} className="mt-4 min-h-11">
                {busy ? "در حال ثبت…" : "ثبت پرونده"}
              </Button>
            </form>
            <section className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <ShieldCheck className="size-5" /> پرونده‌های من
              </h2>
              <div className="mt-4 space-y-3">
                {cases.length ? (
                  cases.map((item) => (
                    <article key={item.id} className="rounded-xl border border-border p-4">
                      <div className="flex justify-between gap-3">
                        <strong>{item.subject}</strong>
                        <span>{item.status}</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {item.sla_due_at
                          ? `مهلت پاسخ طبق سیاست فعال: ${new Date(item.sla_due_at).toLocaleString("fa-IR")}`
                          : "مهلت پاسخ رسمی پیکربندی نشده است."}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">پرونده‌ای ثبت نشده است.</p>
                )}
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <Bell className="size-5" /> وضعیت ارتباطات
              </h2>
              <div className="mt-4 space-y-3">
                {communications.length ? (
                  communications.map((item) => (
                    <p key={item.id} className="rounded-xl border border-border p-4 text-sm">
                      {item.template}: <strong>{item.status}</strong>
                      {item.sent_at
                        ? ` · ${new Date(item.sent_at).toLocaleString("fa-IR")}`
                        : " · ارسال تأیید نشده"}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">پیامی ثبت نشده است.</p>
                )}
              </div>
            </section>
          </div>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/account" search={{ section: "orders" }}>
              <PackageCheck className="size-4" /> پیگیری سفارش‌ها
            </Link>
          </Button>
        </section>
      </main>
      <ProductionFooter />
      <ProductionMobileBottomNav />
    </div>
  );
}

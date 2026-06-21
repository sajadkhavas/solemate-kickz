import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store";
import { Navbar } from "@/components/Navbar";
import heroShoe from "@/assets/hero-shoe.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "ورود / ثبت‌نام — SOLE" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const signIn = useStore((s) => s.signIn);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = (data.get("name") as string) || "کاربر سول";
    const email = (data.get("email") as string) || "";
    if (!email) {
      toast.error("ایمیل/موبایل لازمه");
      return;
    }
    signIn({ name, email });
    toast.success(mode === "login" ? `خوش اومدی ${name}! 👟` : "ثبت‌نام موفق بود 🎉");
    navigate({ to: "/" });
  }

  return (
    <div className="bg-ink min-h-screen">
      <Navbar />
      <main className="grid lg:grid-cols-2 min-h-[calc(100vh-100px)]">
        {/* Left visual */}
        <div className="relative hidden lg:block overflow-hidden">
          <img src={heroShoe} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-tr from-ink via-ink/60 to-transparent" />
          <div className="relative h-full flex flex-col justify-between p-12">
            <Link to="/" className="font-display font-black text-3xl">
              SOLE<span className="text-neon">.</span>
            </Link>
            <div>
              <div className="eyebrow text-neon mb-3">قدم بعدی تو</div>
              <h2 className="font-display font-black text-5xl leading-[0.95]">
                ONE STEP <br />
                AHEAD<span className="text-neon">.</span>
              </h2>
              <p className="text-muted-foreground mt-4 max-w-sm">
                به خانواده سول بپیوند. تخفیف‌های اختصاصی، اولویت در drop ها، و یه دنیا کفش باحال.
              </p>
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md">
            <div className="flex gap-1 bg-surface rounded-full p-1 mb-8">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2.5 rounded-full font-display uppercase tracking-wider text-sm transition ${
                    mode === m ? "bg-neon text-ink" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "login" ? "ورود" : "ثبت‌نام"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                onSubmit={onSubmit}
                initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <h1 className="font-display font-black text-3xl mb-2">
                  {mode === "login" ? "خوش برگشتی 👋" : "بریم با هم 🚀"}
                </h1>

                {mode === "register" && (
                  <Field name="name" label="نام" placeholder="علی رضایی" />
                )}
                <Field name="email" label="ایمیل یا موبایل" placeholder="you@sole.ir / 0912..." />
                <div>
                  <label className="eyebrow text-muted-foreground block mb-2">رمز عبور</label>
                  <div className="relative">
                    <input
                      type={show ? "text" : "password"}
                      name="password"
                      placeholder="حداقل ۸ کاراکتر"
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:border-neon outline-none font-mono-num"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-neon"
                      aria-label="Toggle password"
                    >
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {mode === "login" && (
                  <div className="text-left">
                    <button type="button" className="text-xs text-neon hover:underline">
                      فراموشی رمز؟
                    </button>
                  </div>
                )}

                <button type="submit" className="btn-hype w-full justify-center h-12">
                  {mode === "login" ? "ورود" : "ثبت‌نام"}
                </button>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex-1 h-px bg-border" />
                  OR
                  <span className="flex-1 h-px bg-border" />
                </div>

                <button
                  type="button"
                  onClick={() => toast("به زودی")}
                  className="w-full h-12 rounded-full border border-border hover:border-neon flex items-center justify-center gap-2 text-sm font-display uppercase tracking-wider"
                >
                  <span className="inline-block w-4 h-4 rounded-full bg-white" /> ورود با گوگل
                </button>
              </motion.form>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ name, label, placeholder }: { name: string; label: string; placeholder?: string }) {
  return (
    <div>
      <label className="eyebrow text-muted-foreground block mb-2">{label}</label>
      <input
        name={name}
        placeholder={placeholder}
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:border-neon outline-none"
      />
    </div>
  );
}

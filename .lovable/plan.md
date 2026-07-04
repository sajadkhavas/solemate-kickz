# SOLE — مرور کامل پروژه و نقشه راه تکمیل

## ۱. معرفی سایت

**SOLE** یک فروشگاه آنلاین کفش لوکس و استریت‌ویر (Sneaker Store) است با تمرکز روی برندهای Nike, Jordan, Adidas, Yeezy و... . زبان اصلی رابط کاربری فارسی (RTL) با المان‌های تایپوگرافی انگلیسی (Space Grotesk) و فارسی (Vazirmatn) است. هویت بصری: تم تیره (ink)، رنگ اکسنت نئون سبز-لیمویی (#c8f135) و نارنجی برای هایلایت، حس Streetwear/Hype.

## ۲. Stack فنی فعلی

**Frontend Framework**
- React 19 + TypeScript (strict)
- TanStack Start v1 (SSR + file-based routing)
- Vite 7 + Cloudflare Workers runtime

**Styling & UI**
- Tailwind CSS v4 (design tokens در `src/styles.css` با `oklch`)
- shadcn/ui (کامپوننت‌های کامل UI)
- Framer Motion (انیمیشن)
- Lucide Icons

**State & Data**
- Zustand (store سبد خرید + wishlist در `src/store/index.ts`) — همه local
- TanStack Query (نصب شده ولی هنوز داده‌ای fetch نمی‌شود)
- داده محصولات mock در `src/data/shoes.ts`

**Backend**
- در حال حاضر **هیچ backend فعالی نیست** — Lovable Cloud هنوز enable نشده
- server functions پشتیبانی می‌شود ولی استفاده نشده

## ۳. صفحات و قابلیت‌های موجود

| مسیر | وضعیت | توضیح |
|---|---|---|
| `/` | ✅ | Hero, Marquee, FeaturedDrops, Categories, HypeSection, BrandWall, TrustBadges, Newsletter |
| `/products` | ✅ | فیلتر برند/دسته/سایز/قیمت، جستجو، sort، Grid/List view، Quick filters |
| `/product/$id` | ✅ | صفحه جزئیات محصول |
| `/cart` | ✅ | صفحه سبد خرید کامل |
| `/brands` | ✅ | صفحه برندها |
| `/about` | ✅ | داستان + timeline + فرم تماس |
| `/auth` | ✅ | فرم لاگین/ثبت‌نام (local، غیرفعال) |

**کامپوننت‌های کلیدی**: Navbar (مگا-منو + سرچ overlay)، MobileBottomNav (با Cart FAB وسط)، ShoeCard (grid+list variant، wishlist)، CartDrawer، Footer (accordion موبایل).

## ۴. نقاط قوت فعلی
- طراحی بصری قوی و متمایز (نئون + تیره + typography دوگانه)
- ساختار route درست طبق TanStack
- کامپوننت‌های قابل استفاده مجدد
- تجربه موبایل مناسب (bottom nav + accordion footer + mega menu)
- SSR + SEO tags در هر route

## ۵. کاستی‌ها و نقاط بهبود

**Backend & Data**
- کل داده mock است — بدون DB واقعی
- سبد خرید و wishlist فقط در localStorage — با پاک کردن مرورگر می‌رود
- Auth ظاهری است، هیچ session واقعی نیست
- بدون سیستم سفارش، پرداخت، مدیریت موجودی

**Feature-gaps**
- بدون Checkout واقعی (آدرس، ارسال، پرداخت)
- بدون صفحه Account/Profile/سفارش‌های من
- بدون Wishlist page مستقل
- بدون Review/Rating قابل ثبت توسط کاربر
- بدون جستجوی پیشرفته (autocomplete با API)
- بدون فیلتر پیشرفته (رنگ، جنسیت، تخفیف بازه‌ای)
- بدون Compare محصولات
- بدون Size Guide interactive
- بدون Admin panel

**فنی/کیفیت**
- بدون Loading skeletons یکپارچه
- بدون Error boundaries کامل روی همه route ها
- بدون تست (unit / e2e)
- بدون Analytics
- بدون i18n واقعی (فقط فارسی hardcode)
- تصاویر بهینه نشده (بدون responsive srcset / blur placeholder)
- بدون PWA / offline

---

## ۶. نقشه راه پیشنهادی (فازبندی مدرن)

### فاز A — Backend واقعی (Lovable Cloud)
**هدف**: تبدیل به یک فروشگاه واقعی
- فعال‌سازی Lovable Cloud (Postgres + Auth + Storage)
- جداول: `products`, `variants`, `orders`, `order_items`, `addresses`, `wishlist`, `reviews`, `user_roles`
- RLS policies + user roles table (طبق الگوی امن)
- Auth واقعی (Email + Google OAuth)
- Migration داده‌های mock به DB
- Server functions برای عملیات محافظت‌شده (createOrder، updateProfile، ...)

### فاز B — Checkout و Account
- Multi-step Checkout: Address → Shipping → Payment → Review
- درگاه پرداخت (Stripe یا زرین‌پال از طریق server route)
- صفحه Account: سفارش‌ها، آدرس‌ها، wishlist، پروفایل
- Order tracking + email notifications (Resend / Lovable AI Gateway)

### فاز C — تجربه و کشف محصول
- Search پیشرفته با autocomplete (سمت سرور + debounce)
- فیلترهای پیشرفته: رنگ، جنسیت، تخفیف، برند-چندتایی
- صفحه Wishlist مستقل
- Compare (تا ۳ محصول کنار هم)
- Size Guide تعاملی + AR try-on (اختیاری با model-viewer)
- Product Reviews + امتیاز واقعی از خریداران
- Recently Viewed (client-side)

### فاز D — Admin & Ops
- داشبورد ادمین: محصولات، سفارش‌ها، کاربران، کوپن‌ها
- Inventory management + هشدار موجودی
- Discount / Coupon engine
- Export گزارش (CSV)

### فاز E — کیفیت و بهینه‌سازی
- **Performance**: تصاویر با `<img srcset>` + blurhash، lazy loading، Route-level code splitting، Preload critical fonts
- **SEO**: JSON-LD (Product, BreadcrumbList, Organization)، sitemap.xml، robots.txt، og:image واقعی برای هر محصول
- **UX**: Skeleton loaders یکپارچه، Optimistic updates، Toast feedback، Error boundaries در هر route
- **Testing**: Vitest برای store و utils، Playwright برای flow های خرید
- **Analytics**: PostHog یا Plausible + event tracking (add_to_cart, purchase)
- **A11y**: focus management، ARIA labels، keyboard nav در مگا-منو
- **PWA**: manifest + service worker + offline cart

### فاز F — Growth features
- Newsletter واقعی (Resend + double opt-in)
- Referral / loyalty program
- Gift cards
- Restock notifications
- Blog / Editorial section (برای SEO)
- i18n دوزبانه (fa/en) با URL segment
- Dark/Light mode toggle
- AI-powered recommendations (Lovable AI Gateway → embeddings)

---

## ۷. پیشنهاد اولویت اول

توصیه می‌کنم با **فاز A (Backend واقعی)** شروع کنیم چون بدون آن، همه فازهای بعدی روی داده mock ساخته می‌شوند و بعداً دوباره‌کاری دارد. بلافاصله بعد از آن **فاز B (Checkout)** بیشترین ارزش تجاری را می‌دهد.

---

## سوال قبل از شروع
کدام فاز را اول بسازم؟ اگر A را انتخاب کنی، ابتدا Lovable Cloud را فعال می‌کنم و schema کامل + migration داده‌های mock را می‌نویسم.

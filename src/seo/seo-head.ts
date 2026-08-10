import { SHOES } from "@/data/shoes";
import { Route as AboutRoute } from "@/routes/about";
import { Route as AccountRoute } from "@/routes/account";
import { Route as AuthRoute } from "@/routes/auth";
import { Route as BrandsRoute } from "@/routes/brands";
import { Route as CartRoute } from "@/routes/cart";
import { Route as CheckoutRoute } from "@/routes/checkout";
import { Route as HomeRoute } from "@/routes/index";
import { Route as ProductRoute } from "@/routes/product.$id";
import { Route as ProductsRoute } from "@/routes/products";
import { Route as WishlistRoute } from "@/routes/wishlist";
import { getConfiguredSiteUrl, safeJsonLd, toSiteUrl } from "./seo-config";

export const SEO_INDEXATION_MATRIX = {
  "/": "public",
  "/about": "public",
  "/brands": "public",
  "/products": "demo-catalog",
  "/product/$id": "demo-product",
  "/auth": "utility",
  "/cart": "utility",
  "/checkout": "utility",
  "/wishlist": "utility",
  "/account": "utility",
} as const;

const PUBLIC_COPY = {
  "/": {
    title: "SOLE — ویترین نمایشی کفش و استریت‌ویر",
    description:
      "نمونه فرانت‌اند فارسی SOLE برای مرور دسته‌ها، برندها و محصولات Dataset پروژه؛ بدون ادعای فروشگاه یا سرویس تجاری فعال.",
  },
  "/products": {
    title: "کاتالوگ نمایشی کفش — SOLE",
    description:
      "مرور و فیلتر محصولات Dataset نمایشی SOLE بر اساس برند، دسته، سایز و ویژگی‌های ثبت‌شده در پروژه.",
  },
  "/brands": {
    title: "برندهای موجود در Dataset — SOLE",
    description:
      "مرور برندهایی که در Dataset نمایشی SOLE ثبت شده‌اند؛ حضور نام برند به معنی نمایندگی، همکاری یا موجودی تجاری نیست.",
  },
  "/about": {
    title: "درباره نمونه فرانت‌اند SOLE",
    description:
      "معرفی محدوده فعلی پروژه SOLE، ماهیت نمایشی آن و اصول تجربه کاربری بدون ادعای سرویس فروش، پرداخت یا ارسال واقعی.",
  },
} as const;

const UTILITY_COPY = {
  "/auth": ["ورود نمایشی — SOLE", "رابط نمایشی احراز هویت SOLE بدون حساب یا Backend واقعی."],
  "/cart": [
    "سبد خرید نمایشی — SOLE",
    "سبد خرید محلی نمونه SOLE؛ سفارش، ارسال و پرداخت واقعی متصل نیستند.",
  ],
  "/checkout": [
    "Checkout نمایشی — SOLE",
    "مرور رابط Checkout نمونه SOLE بدون ثبت سفارش، ارسال یا پرداخت واقعی.",
  ],
  "/wishlist": [
    "علاقه‌مندی‌ها — SOLE",
    "فهرست علاقه‌مندی‌های محلی نسخه نمایشی SOLE در همین مرورگر.",
  ],
  "/account": [
    "حساب نمایشی — SOLE",
    "داشبورد محلی نمونه SOLE برای رابط پروفایل، آدرس و سفارش بدون Backend واقعی.",
  ],
} as const;

type PublicPath = keyof typeof PUBLIC_COPY;
type UtilityPath = keyof typeof UTILITY_COPY;

type HeadResult = {
  meta: Array<Record<string, string>>;
  links?: Array<Record<string, string>>;
  scripts?: Array<Record<string, string>>;
};

function routeHead(pathname: PublicPath): HeadResult {
  const copy = PUBLIC_COPY[pathname];
  const siteUrl = getConfiguredSiteUrl();
  const canonical = toSiteUrl(pathname, siteUrl);
  const indexable = Boolean(siteUrl) && pathname !== "/products";
  const meta: Array<Record<string, string>> = [
    { title: copy.title },
    { name: "description", content: copy.description },
    { name: "robots", content: indexable ? "index, follow" : "noindex, follow" },
    { property: "og:title", content: copy.title },
    { property: "og:description", content: copy.description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: copy.title },
    { name: "twitter:description", content: copy.description },
  ];
  const links: Array<Record<string, string>> = [];
  const scripts: Array<Record<string, string>> = [];

  if (canonical) {
    links.push({ rel: "canonical", href: canonical });
    meta.push({ property: "og:url", content: canonical });
  }

  if (pathname === "/" && siteUrl && canonical) {
    scripts.push({
      type: "application/ld+json",
      children: safeJsonLd({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "SOLE",
        url: canonical,
      }),
    });
  }

  if (pathname !== "/" && siteUrl && canonical && indexable) {
    const home = toSiteUrl("/", siteUrl);
    if (home) {
      scripts.push({
        type: "application/ld+json",
        children: safeJsonLd({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "SOLE", item: home },
            { "@type": "ListItem", position: 2, name: copy.title, item: canonical },
          ],
        }),
      });
    }
  }

  return { meta, links, scripts };
}

function utilityHead(pathname: UtilityPath): HeadResult {
  const [title, description] = UTILITY_COPY[pathname];
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "twitter:card", content: "summary" },
    ],
  };
}

function productHead(id: string): HeadResult {
  const shoe = SHOES.find((item) => item.id === Number(id));
  if (!shoe) {
    return {
      meta: [
        { title: "محصول پیدا نشد — SOLE" },
        { name: "description", content: "شناسه محصول در Dataset فعلی SOLE وجود ندارد." },
        { name: "robots", content: "noindex, follow" },
      ],
    };
  }

  const title = `${shoe.brand} ${shoe.name} — نمونه محصول SOLE`;
  const description = `${shoe.brand} ${shoe.name} با رنگ ${shoe.colorway} و سایزهای ثبت‌شده در Dataset نمایشی SOLE؛ این صفحه به موجودی یا فروش واقعی متصل نیست.`;
  const siteUrl = getConfiguredSiteUrl();
  const canonical = toSiteUrl(`/product/${shoe.id}`, siteUrl);
  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "noindex, follow" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
  const links: Array<Record<string, string>> = [];

  if (canonical) {
    links.push({ rel: "canonical", href: canonical });
    meta.push({ property: "og:url", content: canonical });
  }
  if (/^https?:\/\//i.test(shoe.image)) {
    meta.push({ property: "og:image", content: shoe.image });
  } else if (siteUrl) {
    const imageUrl = toSiteUrl(shoe.image, siteUrl);
    if (imageUrl) meta.push({ property: "og:image", content: imageUrl });
  }

  return { meta, links };
}

export function installSeoRouteHeads() {
  HomeRoute.update({ head: () => routeHead("/") });
  AboutRoute.update({ head: () => routeHead("/about") });
  BrandsRoute.update({ head: () => routeHead("/brands") });
  ProductsRoute.update({ head: () => routeHead("/products") });
  ProductRoute.update({ head: ({ params }) => productHead(params.id) });
  AuthRoute.update({ head: () => utilityHead("/auth") });
  CartRoute.update({ head: () => utilityHead("/cart") });
  CheckoutRoute.update({ head: () => utilityHead("/checkout") });
  WishlistRoute.update({ head: () => utilityHead("/wishlist") });
  AccountRoute.update({ head: () => utilityHead("/account") });
}

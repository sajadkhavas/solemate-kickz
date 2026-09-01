import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

import type { DiscoveryShoe } from "@/catalog/discovery-types";
import { catalogForRuntime, relatedCatalogForRuntime } from "@/catalog/production-catalog";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";
import { ShoeCard } from "@/components/ShoeCard";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/commerce-primitives";
import { SHOES, formatPrice, type Shoe } from "@/data/shoes";
import { useStore } from "@/store";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ params }) => {
    const catalog = await catalogForRuntime(SHOES);
    const productId = Number(params.id);
    const fixtureShoe = !import.meta.env.PROD
      ? SHOES.find((item) => item.id === productId)
      : undefined;
    const shoe = fixtureShoe ?? catalog.find((item) => item.id === productId);
    if (!shoe) throw notFound();
    const related = await relatedCatalogForRuntime(shoe as DiscoveryShoe, catalog);
    return { shoe, catalog, related };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.shoe.brand} ${loaderData.shoe.name} — SOLE` },
          {
            name: "description",
            content: `${loaderData.shoe.brand} ${loaderData.shoe.name}، رنگ ${loaderData.shoe.colorway}، قیمت ${formatPrice(loaderData.shoe.sale_price ?? loaderData.shoe.price)}`,
          },
          { property: "og:title", content: `${loaderData.shoe.brand} ${loaderData.shoe.name}` },
          {
            property: "og:description",
            content: `مشاهده تصاویر، سایزهای ثبت‌شده و قیمت ${loaderData.shoe.brand} ${loaderData.shoe.name}`,
          },
          { property: "og:image", content: loaderData.shoe.image },
        ]
      : [],
  }),
  notFoundComponent: ProductNotFound,
  component: ProductPage,
});

function ProductNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <EmptyState
        title="این محصول پیدا نشد"
        description="این محصول در کاتالوگ فعلی در دسترس نیست."
        action={
          <Button asChild>
            <Link to="/products">بازگشت به فروشگاه</Link>
          </Button>
        }
      />
    </main>
  );
}

function ProductCollection({
  eyebrow,
  title,
  products,
  testId,
}: {
  eyebrow: string;
  title: string;
  products: Shoe[];
  testId: string;
}) {
  if (!products.length) return null;

  return (
    <section data-testid={testId} className="mt-20" aria-labelledby={`${testId}-title`}>
      <p className="font-display text-xs font-bold uppercase tracking-[0.22em] text-primary">
        {eyebrow}
      </p>
      <h2
        id={`${testId}-title`}
        className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl"
      >
        {title}
      </h2>
      <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.map((product, index) => (
          <ShoeCard key={product.id} shoe={product} index={index} />
        ))}
      </div>
    </section>
  );
}

function ProductPage() {
  const { shoe, catalog, related } = Route.useLoaderData() as {
    shoe: Shoe;
    catalog: Shoe[];
    related: Shoe[];
  };
  const addRecentlyViewed = useStore((state) => state.addRecentlyViewed);
  const recentlyViewedIds = useStore((state) => state.recentlyViewed);

  useEffect(() => {
    addRecentlyViewed(shoe.id);
  }, [addRecentlyViewed, shoe.id]);

  const recentlyViewed = useMemo(
    () =>
      recentlyViewedIds
        .filter((id) => id !== shoe.id)
        .map((id) => catalog.find((item) => item.id === id))
        .filter((item): item is Shoe => Boolean(item))
        .slice(0, 4),
    [catalog, recentlyViewedIds, shoe.id],
  );

  const shareProduct = async () => {
    const title = `${shoe.brand} ${shoe.name}`;
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("لینک محصول کپی شد.");
        return;
      }
      toast.error("اشتراک‌گذاری در این مرورگر در دسترس نیست.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("اشتراک‌گذاری انجام نشد.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto max-w-[1400px] px-4 pb-36 pt-8 sm:px-6 md:pb-16 lg:px-8">
        <nav
          aria-label="مسیر صفحه"
          className="mb-7 flex flex-wrap items-center gap-2 font-fa text-xs text-muted-foreground"
        >
          <Link to="/" className="inline-flex min-h-11 min-w-6 items-center justify-center hover:text-foreground">
            خانه
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/products" className="inline-flex min-h-11 min-w-6 items-center justify-center hover:text-foreground">
            فروشگاه
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="max-w-full truncate text-foreground">
            <bdi dir="ltr">{shoe.name}</bdi>
          </span>
        </nav>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] xl:gap-14">
          <ProductGallery shoe={shoe} />
          <ProductPurchasePanel shoe={shoe} onShare={shareProduct} />
        </div>

        <ProductCollection
          eyebrow="Related products"
          title="محصولات مرتبط"
          products={related}
          testId="related-products"
        />
        <ProductCollection
          eyebrow="Recently viewed on this device"
          title="بازدیدهای اخیر"
          products={recentlyViewed}
          testId="recently-viewed-products"
        />
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}

import { createFileRoute, notFound } from "@tanstack/react-router";

import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { safeJsonLd, toSiteUrl } from "@/seo/seo-config";

export const Route = createFileRoute("/pages/$slug")({
  loader: async ({ params }) => {
    if (!import.meta.env.PROD) throw notFound();
    const { contentPageForRuntime } = await import("@/seo/p10-seo");
    const page = await contentPageForRuntime(params.slug);
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ name: "robots", content: "noindex, follow" }] };
    }
    const canonical = toSiteUrl(loaderData.seo.canonical_path);
    const schema = canonical
      ? safeJsonLd({
          "@context": "https://schema.org",
          "@type": loaderData.seo.schema_type,
          name: loaderData.title,
          description: loaderData.seo.description,
          url: canonical,
        })
      : null;
    return {
      meta: [
        { title: loaderData.seo.title },
        { name: "description", content: loaderData.seo.description },
        { name: "robots", content: loaderData.seo.robots.replace(",", ", ") },
        { property: "og:title", content: loaderData.seo.title },
        { property: "og:description", content: loaderData.seo.description },
      ],
      links: canonical ? [{ rel: "canonical", href: canonical }] : [],
      scripts: schema ? [{ type: "application/ld+json", children: schema }] : [],
    };
  },
  notFoundComponent: () => (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <h1 className="text-3xl font-black">صفحه منتشرشده‌ای پیدا نشد</h1>
        <p className="mt-3 text-muted-foreground">این نشانی منتشر نشده یا دیگر در دسترس نیست.</p>
      </div>
    </main>
  ),
  component: GovernedContentPage,
});

function GovernedContentPage() {
  const page = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-20">
        <header className="border-b border-border pb-8">
          <p className="eyebrow text-primary">Governed content · v{page.version}</p>
          <h1 className="mt-3 font-display text-4xl font-black leading-tight md:text-6xl">
            {page.title}
          </h1>
          {page.summary ? (
            <p className="mt-5 max-w-3xl font-fa text-lg leading-8 text-muted-foreground">
              {page.summary}
            </p>
          ) : null}
        </header>
        <div className="mt-10 space-y-7">
          {page.blocks.map((block, index) => (
            <section
              key={`${block.type}-${index}`}
              className={
                block.type === "callout"
                  ? "rounded-2xl border border-primary/30 bg-primary/5 p-6"
                  : "rounded-2xl border border-border bg-surface p-6"
              }
            >
              {block.heading ? <h2 className="text-2xl font-bold">{block.heading}</h2> : null}
              <p className="mt-3 whitespace-pre-line font-fa leading-8 text-muted-foreground">
                {block.body}
              </p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

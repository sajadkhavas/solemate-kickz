import { z } from "zod";

const sitemapEntrySchema = z.object({
  path: z.string().startsWith("/"),
  last_modified: z.string().nullable(),
});

const sitemapSchema = z.object({
  data: z.object({
    segments: z.object({
      core: z.array(sitemapEntrySchema),
      content: z.array(sitemapEntrySchema),
      products: z.array(sitemapEntrySchema),
    }),
  }),
});

const contentPageSchema = z.object({
  data: z.object({
    slug: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().nullable(),
    blocks: z.array(
      z.object({
        type: z.enum(["prose", "callout", "faq"]),
        heading: z.string().nullable().optional(),
        body: z.string().min(1),
      }),
    ),
    version: z.number().int().positive(),
    published_at: z.string().min(1),
    seo: z.object({
      title: z.string().min(1).max(70),
      description: z.string().min(1).max(180),
      canonical_path: z.string().startsWith("/"),
      robots: z.enum(["index,follow", "noindex,follow", "noindex,nofollow"]),
      schema_type: z.enum(["WebPage", "AboutPage", "ContactPage", "FAQPage"]),
      sitemap_segment: z.enum(["content", "legal"]),
    }),
  }),
});

const redirectSchema = z.object({
  source_path: z.string().startsWith("/"),
  destination_path: z.string().startsWith("/"),
  status_code: z.union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)]),
});

const manifestSchema = z.object({
  data: z.object({ redirects: z.array(redirectSchema) }),
});

export type P10ContentPage = z.infer<typeof contentPageSchema>["data"];
export type P10Sitemap = z.infer<typeof sitemapSchema>["data"]["segments"];

function apiRoot(): string | null {
  const raw = process.env.SOLE_API_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") return null;
    const root = url.toString().replace(/\/+$/, "");
    return root.endsWith("/api") ? root : `${root}/api`;
  } catch {
    return null;
  }
}

async function backendJson(path: string): Promise<unknown> {
  const root = apiRoot();
  if (!root) throw new Error("P10_BACKEND_UNAVAILABLE");
  const response = await fetch(`${root}${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`P10_BACKEND_${response.status}`);
  return response.json();
}

export async function fetchP10Sitemap(): Promise<P10Sitemap> {
  return sitemapSchema.parse(await backendJson("/v1/seo/sitemap")).data.segments;
}

export async function fetchP10ContentPage(slug: string): Promise<P10ContentPage> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("P10_INVALID_SLUG");
  return contentPageSchema.parse(await backendJson(`/v1/content/pages/${encodeURIComponent(slug)}`))
    .data;
}

export async function fetchP10Redirect(pathname: string) {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) return null;
  const manifest = manifestSchema.parse(await backendJson("/v1/seo/manifest"));
  return manifest.data.redirects.find(
    (entry) =>
      entry.source_path === pathname &&
      entry.destination_path !== pathname &&
      !entry.destination_path.startsWith("//"),
  );
}

export async function fetchP10MerchantFeed(): Promise<unknown> {
  return backendJson("/v1/merchant/products");
}

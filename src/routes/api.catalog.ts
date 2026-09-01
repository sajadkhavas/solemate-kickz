import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { catalogSearchSchema } from "@/catalog/catalog-state";

const backInStockRequestSchema = z.object({
  action: z.literal("back_in_stock"),
  slug: z.string().trim().min(1).max(255),
  variantId: z.number().int().positive(),
  email: z.string().email().max(254),
  consent: z.literal(true),
});

function discoverySearch(request: Request) {
  const url = new URL(request.url);
  return catalogSearchSchema.parse({
    q: url.searchParams.get("q") ?? undefined,
    brand: url.searchParams.get("brand") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    sizes: url.searchParams.get("sizes") ?? undefined,
    priceMax: url.searchParams.get("priceMax") ?? undefined,
    availability: url.searchParams.get("availability") ?? undefined,
    quick: url.searchParams.get("quick") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    view: "grid",
  });
}

export const Route = createFileRoute("/api/catalog")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const mode = url.searchParams.get("mode");
          const { fetchProductionCatalogP05, fetchProductionDiscovery, fetchProductionRelated } =
            await import("@/catalog/p05-discovery.server");

          if (mode === "all") {
            return Response.json(await fetchProductionCatalogP05(), {
              headers: { "Cache-Control": "private, no-store" },
            });
          }

          if (mode === "related") {
            const slug = url.searchParams.get("slug")?.trim();
            if (!slug) return Response.json({ error: "invalid_slug" }, { status: 422 });
            return Response.json(await fetchProductionRelated(slug), {
              headers: { "Cache-Control": "private, no-store" },
            });
          }

          return Response.json(await fetchProductionDiscovery(discoverySearch(request)), {
            headers: { "Cache-Control": "private, no-store" },
          });
        } catch {
          return Response.json(
            { error: "catalog_unavailable" },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
      POST: async ({ request }) => {
        try {
          const parsed = backInStockRequestSchema.safeParse(await request.json());
          if (!parsed.success) return Response.json({ status: "invalid" }, { status: 422 });

          const { registerProductionBackInStock } = await import("@/catalog/p05-discovery.server");
          const result = await registerProductionBackInStock({
            slug: parsed.data.slug,
            variantId: parsed.data.variantId,
            email: parsed.data.email,
            consent: true,
          });
          const status =
            result.status === "already_available"
              ? 409
              : result.status === "invalid"
                ? 422
                : result.status === "unavailable"
                  ? 503
                  : 200;

          return Response.json(result, {
            status,
            headers: { "Cache-Control": "no-store" },
          });
        } catch {
          return Response.json(
            { status: "unavailable" },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});

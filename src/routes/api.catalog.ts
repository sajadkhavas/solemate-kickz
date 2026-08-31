import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/catalog")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { fetchProductionCatalog } = await import("@/catalog/production-catalog.server");
          const catalog = await fetchProductionCatalog();

          return Response.json(catalog, {
            headers: {
              "Cache-Control": "private, no-store",
            },
          });
        } catch {
          return Response.json(
            { error: "catalog_unavailable" },
            {
              status: 503,
              headers: {
                "Cache-Control": "no-store",
              },
            },
          );
        }
      },
    },
  },
});

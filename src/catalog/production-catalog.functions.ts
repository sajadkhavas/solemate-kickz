import { createServerFn } from "@tanstack/react-start";

export const getProductionCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchProductionCatalog } = await import("@/catalog/production-catalog.server");
  return fetchProductionCatalog();
});

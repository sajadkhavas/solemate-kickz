import { createServerFn } from "@tanstack/react-start";

import type { ResponsiveShoe } from "@/catalog/responsive-media";
import type { Shoe } from "@/data/shoes";

export const getProductionCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchProductionCatalog } = await import("@/catalog/production-catalog.server");
  return fetchProductionCatalog();
});

export async function catalogForRuntime(fixtures: Shoe[]): Promise<Shoe[]> {
  if (!import.meta.env.PROD) return fixtures;
  return (await getProductionCatalog()) as ResponsiveShoe[];
}

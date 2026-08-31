import type { ResponsiveShoe } from "@/catalog/responsive-media";
import type { Shoe } from "@/data/shoes";

export async function catalogForRuntime(fixtures: Shoe[]): Promise<Shoe[]> {
  if (!import.meta.env.PROD) return fixtures;

  const { getProductionCatalog } = await import("@/catalog/production-catalog.functions");
  return (await getProductionCatalog()) as ResponsiveShoe[];
}

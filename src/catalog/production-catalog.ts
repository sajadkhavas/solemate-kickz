import type { ResponsiveShoe } from "@/catalog/responsive-media";
import type { Shoe } from "@/data/shoes";

async function fetchClientCatalog(): Promise<ResponsiveShoe[]> {
  try {
    const response = await fetch("/api/catalog", {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    if (!response.ok) return [];

    const payload: unknown = await response.json();
    return Array.isArray(payload) ? (payload as ResponsiveShoe[]) : [];
  } catch {
    return [];
  }
}

export async function catalogForRuntime(fixtures: Shoe[]): Promise<Shoe[]> {
  if (!import.meta.env.PROD) return fixtures;

  if (import.meta.env.SSR) {
    const { fetchProductionCatalog } = await import("@/catalog/production-catalog.server");
    return fetchProductionCatalog();
  }

  return fetchClientCatalog();
}

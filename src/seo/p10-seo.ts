import type { P10ContentPage } from "./p10-seo.server";

export async function contentPageForRuntime(slug: string): Promise<P10ContentPage | null> {
  if (!import.meta.env.PROD) return null;

  if (import.meta.env.SSR) {
    const { fetchP10ContentPage } = await import("./p10-seo.server");
    try {
      return await fetchP10ContentPage(slug);
    } catch {
      return null;
    }
  }

  try {
    const response = await fetch(`/api/seo?mode=content&slug=${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    if (!response.ok) return null;
    return (await response.json()) as P10ContentPage;
  } catch {
    return null;
  }
}

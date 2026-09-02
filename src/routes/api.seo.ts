import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/seo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("mode") !== "content") {
          return Response.json({ error: "unsupported_mode" }, { status: 404 });
        }
        const slug = url.searchParams.get("slug")?.trim() ?? "";
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
          return Response.json({ error: "invalid_slug" }, { status: 422 });
        }
        try {
          const { fetchP10ContentPage } = await import("@/seo/p10-seo.server");
          return Response.json(await fetchP10ContentPage(slug), {
            headers: { "cache-control": "public, max-age=60" },
          });
        } catch {
          return Response.json(
            { error: "content_unavailable" },
            { status: 404, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } },
          );
        }
      },
    },
  },
});

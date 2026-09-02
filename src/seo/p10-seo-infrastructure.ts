import { escapeXml, getConfiguredSiteUrl, toSiteUrl } from "./seo-config";
import {
  fetchP10MerchantFeed,
  fetchP10Redirect,
  fetchP10Sitemap,
  type P10Sitemap,
} from "./p10-seo.server";

function xmlResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "cache-control": status === 200 ? "public, max-age=300" : "no-store",
      "content-type": "application/xml; charset=utf-8",
      ...(status >= 400 ? { "x-robots-tag": "noindex, follow" } : {}),
    },
  });
}

function urlset(entries: P10Sitemap[keyof P10Sitemap]) {
  const siteUrl = getConfiguredSiteUrl();
  if (!siteUrl) return null;
  const rows = entries
    .map((entry) => {
      const url = toSiteUrl(entry.path, siteUrl);
      if (!url) return null;
      const modified = entry.last_modified
        ? `<lastmod>${escapeXml(entry.last_modified)}</lastmod>`
        : "";
      return `  <url><loc>${escapeXml(url)}</loc>${modified}</url>`;
    })
    .filter((row): row is string => Boolean(row));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...rows,
    "</urlset>",
    "",
  ].join("\n");
}

function sitemapIndex() {
  const siteUrl = getConfiguredSiteUrl();
  if (!siteUrl) return null;
  const rows = ["core", "content", "products"].map(
    (segment) =>
      `  <sitemap><loc>${escapeXml(`${siteUrl}/sitemap-${segment}.xml`)}</loc></sitemap>`,
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...rows,
    "</sitemapindex>",
    "",
  ].join("\n");
}

export async function createP10InfrastructureResponse(request: Request): Promise<Response | null> {
  if (!process.env.SOLE_API_URL) return null;
  const url = new URL(request.url);
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  if (url.pathname === "/merchant-feed.json") {
    try {
      return Response.json(await fetchP10MerchantFeed(), {
        headers: { "cache-control": "public, max-age=300", "x-robots-tag": "noindex" },
      });
    } catch {
      return Response.json(
        { error: "merchant_feed_unavailable" },
        { status: 503, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } },
      );
    }
  }

  const match = url.pathname.match(/^\/sitemap-(core|content|products)\.xml$/);
  if (url.pathname === "/sitemap.xml" || match) {
    try {
      const segments = await fetchP10Sitemap();
      const body = match ? urlset(segments[match[1] as keyof P10Sitemap]) : sitemapIndex();
      return body ? xmlResponse(body) : xmlResponse("", 503);
    } catch {
      return xmlResponse("", 503);
    }
  }

  try {
    const redirect = await fetchP10Redirect(url.pathname);
    if (!redirect) return null;
    return Response.redirect(new URL(redirect.destination_path, url.origin), redirect.status_code);
  } catch {
    return null;
  }
}

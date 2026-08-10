import { escapeXml, getConfiguredSiteUrl, toSiteUrl } from "./seo-config";

export const SITEMAP_PATHS = ["/", "/about", "/brands"] as const;

function textResponse(body: string, contentType: string) {
  return new Response(body, {
    status: 200,
    headers: {
      "cache-control": "public, max-age=300",
      "content-type": contentType,
    },
  });
}

export function renderRobotsTxt(): string {
  const siteUrl = getConfiguredSiteUrl();
  const lines = ["User-agent: *", "Allow: /"];
  if (siteUrl) lines.push(`Sitemap: ${siteUrl}/sitemap.xml`);
  return `${lines.join("\n")}\n`;
}

export function renderSitemapXml(): string {
  const siteUrl = getConfiguredSiteUrl();
  const urls = siteUrl
    ? SITEMAP_PATHS.map((pathname) => toSiteUrl(pathname, siteUrl)).filter(
        (value): value is string => Boolean(value),
      )
    : [];
  const entries = urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    "</urlset>",
    "",
  ]
    .filter((line, index, lines) => line !== "" || index === lines.length - 1)
    .join("\n");
}

export function createSeoInfrastructureResponse(request: Request): Response | null {
  const url = new URL(request.url);
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  if (url.pathname === "/robots.txt") {
    return textResponse(renderRobotsTxt(), "text/plain; charset=utf-8");
  }
  if (url.pathname === "/sitemap.xml") {
    return textResponse(renderSitemapXml(), "application/xml; charset=utf-8");
  }
  return null;
}

export function withErrorNoindex(response: Response): Response {
  if (response.status < 400) return response;
  const headers = new Headers(response.headers);
  headers.set("x-robots-tag", "noindex, follow");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

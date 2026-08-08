export const SITE_URL_ENV_NAME = "VITE_SITE_URL";

const LOCAL_HOSTNAMES = new Set(["localhost", "0.0.0.0", "127.0.0.1", "::1"]);

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

export function normalizeSiteUrl(value: string | undefined | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password || url.search || url.hash) return null;
    if (url.pathname !== "/" && url.pathname !== "") return null;
    if (
      LOCAL_HOSTNAMES.has(hostname) ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      isPrivateIpv4(hostname)
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function getConfiguredSiteUrl(): string | null {
  return normalizeSiteUrl(import.meta.env.VITE_SITE_URL);
}

export function toSiteUrl(pathname: string, siteUrl = getConfiguredSiteUrl()): string | null {
  if (!siteUrl) return null;
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPath, `${siteUrl}/`).toString();
}

export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const SITE_URL_ENV_NAME = "VITE_SITE_URL";

const LOCAL_HOSTNAMES = new Set(["localhost", "0.0.0.0", "127.0.0.1", "::1", "::"]);

function normalizeHostname(hostname: string) {
  let normalized = hostname.trim().toLowerCase();
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    normalized = normalized.slice(1, -1);
  }
  return normalized.endsWith(".") ? normalized.slice(0, -1) : normalized;
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  const [a, b, c] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isNonPublicIpv6(hostname: string) {
  if (!hostname.includes(":")) return false;
  if (hostname === "::" || hostname === "::1" || hostname.startsWith("::ffff:")) return true;

  const firstHextet = Number.parseInt(hostname.split(":", 1)[0] || "0", 16);
  if (!Number.isFinite(firstHextet)) return true;

  return (
    (firstHextet & 0xfe00) === 0xfc00 ||
    (firstHextet & 0xffc0) === 0xfe80 ||
    (firstHextet & 0xff00) === 0xff00 ||
    hostname.startsWith("2001:db8:")
  );
}

export function normalizeSiteUrl(value: string | undefined | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const hostname = normalizeHostname(url.hostname);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password || url.search || url.hash) return null;
    if (url.pathname !== "/" && url.pathname !== "") return null;
    if (
      LOCAL_HOSTNAMES.has(hostname) ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      isPrivateIpv4(hostname) ||
      isNonPublicIpv6(hostname)
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
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

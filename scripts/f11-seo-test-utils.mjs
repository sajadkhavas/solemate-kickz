import fs from "node:fs";
import path from "node:path";

export const ROOT = process.cwd();

export function extractHead(html) {
  return html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? "";
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match?.[1] ?? null;
}

export function metaValues(head, attributeName, attributeValue) {
  return [...head.matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => attribute(tag, attributeName) === attributeValue)
    .map((tag) => attribute(tag, "content"))
    .filter((value) => value !== null);
}

export function canonicalValues(head) {
  return [...head.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => attribute(tag, "rel") === "canonical")
    .map((tag) => attribute(tag, "href"))
    .filter((value) => value !== null);
}

export function titleValues(head) {
  return [...head.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((match) => match[1].trim());
}

export function jsonLdValues(head) {
  return [
    ...head.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ].map((match) => match[1].trim());
}

export function hrefValues(html) {
  return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
}

function relativeUrl(url) {
  return `${url.pathname}${url.search}${url.hash}`;
}

export async function fetchPage(baseUrl, pathname, { maxRedirects = 5 } = {}) {
  const base = new URL(baseUrl);
  let current = new URL(pathname, base);
  const redirects = [];

  for (let index = 0; index <= maxRedirects; index += 1) {
    const response = await fetch(current, { redirect: "manual" });
    const location = response.headers.get("location");
    const isRedirect = response.status >= 300 && response.status < 400 && Boolean(location);

    if (isRedirect) {
      if (index === maxRedirects) {
        throw new Error(`Too many redirects while fetching ${pathname}`);
      }
      const target = new URL(location, current);
      if (target.origin !== base.origin) {
        throw new Error(
          `Unsafe cross-origin redirect while fetching ${pathname}: ${current.toString()} -> ${target.toString()}`,
        );
      }
      redirects.push({
        status: response.status,
        from: relativeUrl(current),
        to: relativeUrl(target),
      });
      current = target;
      continue;
    }

    const body = await response.text();
    return {
      response,
      body,
      head: extractHead(body),
      redirects,
      finalUrl: current.toString(),
      finalPath: relativeUrl(current),
    };
  }

  throw new Error(`Redirect resolution failed for ${pathname}`);
}

export function createRecorder() {
  const results = [];
  const record = (name, pass, evidence = null) => {
    results.push({ name, pass: Boolean(pass), evidence });
    if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
  };
  return { results, record };
}

export function writeReport(relativePath, suite, results, extra = {}) {
  const file = path.join(ROOT, relativePath);
  const failed = results.filter((result) => !result.pass);
  const report = {
    schemaVersion: 1,
    suite,
    generatedAt: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
    },
    pass: failed.length === 0,
    ...extra,
  };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary));
  if (!report.pass) process.exitCode = 1;
  return report;
}

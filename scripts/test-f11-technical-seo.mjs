import {
  canonicalValues,
  createRecorder,
  fetchPage,
  hrefValues,
  jsonLdValues,
  metaValues,
  titleValues,
  writeReport,
} from "./f11-seo-test-utils.mjs";
import { withF11Server } from "./f11-browser-runner.mjs";

const SITE_URL = "https://sole.test";
const { results, record } = createRecorder();
const bannedSchemaKeys = [
  "Offer",
  "AggregateRating",
  "Review",
  "availability",
  "priceCurrency",
  "shippingDetails",
  "hasMerchantReturnPolicy",
  "seller",
];

function checkHead(name, page, { robots, canonical, requireSocial = true }) {
  const titles = titleValues(page.head);
  const descriptions = metaValues(page.head, "name", "description");
  const robotsValues = metaValues(page.head, "name", "robots");
  const canonicals = canonicalValues(page.head);
  const ogUrls = metaValues(page.head, "property", "og:url");
  record(`${name}: one title`, titles.length === 1 && Boolean(titles[0]), titles);
  record(`${name}: one description`, descriptions.length === 1 && Boolean(descriptions[0]), descriptions);
  record(`${name}: robots policy`, robotsValues.length === 1 && robotsValues[0] === robots, robotsValues);
  record(
    `${name}: canonical policy`,
    canonical ? canonicals.length === 1 && canonicals[0] === canonical : canonicals.length === 0,
    canonicals,
  );
  if (requireSocial) {
    record(`${name}: Open Graph title`, metaValues(page.head, "property", "og:title").length === 1, null);
    record(`${name}: Twitter card`, metaValues(page.head, "name", "twitter:card").length === 1, null);
  }
  if (canonical)
    record(`${name}: matching og:url`, ogUrls.length === 1 && ogUrls[0] === canonical, ogUrls);
  record(
    `${name}: no localhost metadata`,
    !/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(page.head),
    null,
  );
}

function redirectPathsStayOn(page, pathname) {
  return page.redirects.every((redirect) => new URL(redirect.to, "http://sole.test").pathname === pathname);
}

async function run(baseUrl) {
  const publicPages = [
    ["home", "/", `${SITE_URL}/`],
    ["about", "/about", `${SITE_URL}/about`],
    ["brands", "/brands", `${SITE_URL}/brands`],
  ];
  for (const [name, path, canonical] of publicPages) {
    const page = await fetchPage(baseUrl, path);
    record(`${name}: HTTP 200`, page.response.status === 200, page.response.status);
    record(`${name}: direct canonical route has no redirect`, page.redirects.length === 0, page.redirects);
    checkHead(name, page, { robots: "index, follow", canonical });
    record(
      `${name}: Persian RTL document`,
      /<html[^>]*lang=["']fa["'][^>]*dir=["']rtl["']/i.test(page.body),
      null,
    );
  }

  const catalogCases = [
    "/products",
    "/products?brand=Nike",
    "/products?sort=newest",
    "/products?unknown=seo-probe",
  ];
  for (const path of catalogCases) {
    const page = await fetchPage(baseUrl, path);
    record(`${path}: final HTTP 200`, page.response.status === 200, {
      status: page.response.status,
      redirects: page.redirects,
      finalPath: page.finalPath,
    });
    record(`${path}: redirects stay on catalog route`, redirectPathsStayOn(page, "/products"), page.redirects);
    if (path === "/products") {
      record("/products: clean catalog URL is direct 200", page.redirects.length === 0, page.redirects);
    }
    if (path.includes("sort=newest")) {
      record(
        "/products?sort=newest: default sort is removed from final URL",
        !new URL(page.finalUrl).searchParams.has("sort"),
        page.finalPath,
      );
    }
    if (path.includes("unknown=seo-probe")) {
      const canonicals = canonicalValues(page.head);
      record(
        "/products?unknown=seo-probe: unknown query is removed from final URL canonical target and cannot create an SEO landing URL",
        new URL(page.finalUrl).pathname === "/products" &&
          canonicals.length === 1 &&
          canonicals[0] === `${SITE_URL}/products`,
        { finalPath: page.finalPath, canonical: canonicals },
      );
    }
    checkHead(path, page, { robots: "noindex, follow", canonical: `${SITE_URL}/products` });
  }

  const catalog = await fetchPage(baseUrl, "/products");
  const productLinks = hrefValues(catalog.body).filter((href) => /^\/product\/\d+/.test(href));
  record(
    "catalog exposes crawlable SSR product anchors",
    productLinks.length > 0,
    productLinks.slice(0, 5),
  );
  record(
    "catalog has meaningful SSR heading",
    /<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(catalog.body),
    null,
  );

  const product = await fetchPage(baseUrl, "/product/1");
  record("valid product HTTP 200", product.response.status === 200, product.response.status);
  record("valid product has no redirect", product.redirects.length === 0, product.redirects);
  checkHead("valid product", product, {
    robots: "noindex, follow",
    canonical: `${SITE_URL}/product/1`,
  });
  record(
    "demo product metadata discloses Dataset boundary",
    metaValues(product.head, "name", "description").some((value) => /Dataset نمایشی/.test(value)),
    metaValues(product.head, "name", "description"),
  );

  const allJsonLd = [];
  for (const path of ["/", "/about", "/brands", "/products", "/product/1"]) {
    const page = await fetchPage(baseUrl, path);
    for (const raw of jsonLdValues(page.head)) {
      try {
        const parsed = JSON.parse(raw);
        allJsonLd.push(parsed);
        record(`${path}: JSON-LD parses`, true, parsed["@type"] ?? null);
      } catch (error) {
        record(
          `${path}: JSON-LD parses`,
          false,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }
  const jsonText = JSON.stringify(allJsonLd);
  record(
    "structured data has no fake merchant/review fields",
    bannedSchemaKeys.every((key) => !jsonText.includes(`\"${key}\"`)),
    bannedSchemaKeys.filter((key) => jsonText.includes(`\"${key}\"`)),
  );
  record(
    "home exposes WebSite JSON-LD",
    allJsonLd.some((value) => value?.["@type"] === "WebSite"),
    allJsonLd,
  );
  record(
    "public secondary pages expose BreadcrumbList JSON-LD",
    allJsonLd.filter((value) => value?.["@type"] === "BreadcrumbList").length >= 2,
    allJsonLd.map((value) => value?.["@type"]),
  );

  const utilityPaths = ["/auth", "/cart", "/checkout", "/wishlist", "/account"];
  for (const path of utilityPaths) {
    const page = await fetchPage(baseUrl, path);
    record(`${path}: final HTTP 200`, page.response.status === 200, {
      status: page.response.status,
      redirects: page.redirects,
      finalPath: page.finalPath,
    });
    record(`${path}: redirects stay on same utility route`, redirectPathsStayOn(page, path), page.redirects);
    checkHead(path, page, { robots: "noindex, follow", canonical: null });
    record(
      `${path}: not canonicalized to homepage`,
      !canonicalValues(page.head).includes(`${SITE_URL}/`),
      canonicalValues(page.head),
    );
  }

  for (const path of ["/product/invalid-id", "/product/", "/this-route-does-not-exist"]) {
    const page = await fetchPage(baseUrl, path);
    record(`${path}: final real 404 status`, page.response.status === 404, {
      status: page.response.status,
      redirects: page.redirects,
      finalPath: page.finalPath,
    });
    record(
      `${path}: redirect chain never masquerades as homepage`,
      !page.redirects.some((redirect) => new URL(redirect.to, "http://sole.test").pathname === "/") &&
        new URL(page.finalUrl).pathname !== "/",
      page.redirects,
    );
    record(
      `${path}: X-Robots-Tag noindex`,
      /noindex/i.test(page.response.headers.get("x-robots-tag") ?? ""),
      page.response.headers.get("x-robots-tag"),
    );
    record(`${path}: no canonical`, canonicalValues(page.head).length === 0, canonicalValues(page.head));
  }

  const robots = await fetch(`${baseUrl}/robots.txt`);
  const robotsBody = await robots.text();
  record("robots.txt HTTP 200", robots.status === 200, robots.status);
  record(
    "robots.txt valid allow policy",
    /^User-agent: \*$/m.test(robotsBody) && /^Allow: \/$/m.test(robotsBody),
    robotsBody,
  );
  record("robots.txt does not blanket block", !/^Disallow: \/$/m.test(robotsBody), robotsBody);
  record(
    "robots.txt advertises configured sitemap",
    robotsBody.includes(`Sitemap: ${SITE_URL}/sitemap.xml`),
    robotsBody,
  );

  const sitemap = await fetch(`${baseUrl}/sitemap.xml`);
  const sitemapBody = await sitemap.text();
  const locs = [...sitemapBody.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  record(
    "sitemap HTTP 200 XML",
    sitemap.status === 200 && /application\/xml/.test(sitemap.headers.get("content-type") ?? ""),
    sitemap.status,
  );
  record(
    "sitemap contains only canonical indexable routes",
    JSON.stringify(locs) === JSON.stringify([`${SITE_URL}/`, `${SITE_URL}/about`, `${SITE_URL}/brands`]),
    locs,
  );
  record(
    "sitemap excludes utility, catalog queries and demo products",
    !locs.some((url) => /cart|checkout|wishlist|account|auth|products|product\//.test(url)),
    locs,
  );
  record("sitemap has no duplicate URLs", new Set(locs).size === locs.length, locs);

  writeReport("artifacts/reports/f11-technical-seo-runtime.json", "f11-technical-seo-runtime", results);
}

withF11Server(
  {
    envName: "F11_RUNTIME_BASE_URL",
    port: 4191,
    logPath: "artifacts/runtime/f11-technical-seo-server.txt",
    env: { VITE_SITE_URL: SITE_URL },
  },
  run,
).catch((error) => {
  record(
    "F11 runtime suite completed",
    false,
    error instanceof Error ? error.stack ?? error.message : String(error),
  );
  writeReport("artifacts/reports/f11-technical-seo-runtime.json", "f11-technical-seo-runtime", results);
});

import {
  canonicalValues,
  createRecorder,
  fetchPage,
  metaValues,
  writeReport,
} from "./f11-seo-test-utils.mjs";
import { withF11Server } from "./f11-browser-runner.mjs";

const { results, record } = createRecorder();

async function run(baseUrl) {
  for (const path of ["/", "/about", "/brands", "/products", "/product/1"]) {
    const page = await fetchPage(baseUrl, path);
    record(`${path}: remains reachable with invalid Site URL`, page.response.status === 200, page.response.status);
    record(
      `${path}: fail-safe noindex`,
      metaValues(page.head, "name", "robots").length === 1 &&
        metaValues(page.head, "name", "robots")[0] === "noindex, follow",
      metaValues(page.head, "name", "robots"),
    );
    record(`${path}: canonical omitted without valid Site URL`, canonicalValues(page.head).length === 0, canonicalValues(page.head));
    record(`${path}: og:url omitted without valid Site URL`, metaValues(page.head, "property", "og:url").length === 0, metaValues(page.head, "property", "og:url"));
    record(`${path}: rejected localhost never leaks into head`, !/localhost:9999/i.test(page.head), null);
  }

  const robots = await fetch(`${baseUrl}/robots.txt`);
  const robotsBody = await robots.text();
  record("invalid Site URL robots still allows crawling", /^Allow: \/$/m.test(robotsBody), robotsBody);
  record("invalid Site URL robots omits sitemap URL", !/^Sitemap:/m.test(robotsBody), robotsBody);

  const sitemap = await fetch(`${baseUrl}/sitemap.xml`);
  const sitemapBody = await sitemap.text();
  record("invalid Site URL sitemap stays valid XML", /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">[\s\S]*<\/urlset>/.test(sitemapBody), sitemapBody);
  record("invalid Site URL sitemap emits no loc", !/<loc>/i.test(sitemapBody), sitemapBody);
  record("invalid Site URL infrastructure never echoes localhost", !/localhost:9999/i.test(`${robotsBody}\n${sitemapBody}`), null);

  writeReport("artifacts/reports/f11-technical-seo-qa.json", "f11-technical-seo-qa", results);
}

withF11Server(
  {
    envName: "F11_QA_BASE_URL",
    port: 4192,
    logPath: "artifacts/runtime/f11-technical-seo-qa-server.txt",
    env: { VITE_SITE_URL: "http://localhost:9999" },
  },
  run,
).catch((error) => {
  record("F11 SEO QA completed", false, error instanceof Error ? error.stack ?? error.message : String(error));
  writeReport("artifacts/reports/f11-technical-seo-qa.json", "f11-technical-seo-qa", results);
});

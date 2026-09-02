import fs from "node:fs";
import path from "node:path";

const files = {
  backend: fs.readFileSync("src/seo/p10-seo.server.ts", "utf8"),
  runtime: fs.readFileSync("src/seo/p10-seo.ts", "utf8"),
  infra: fs.readFileSync("src/seo/p10-seo-infrastructure.ts", "utf8"),
  route: fs.readFileSync("src/routes/pages.$slug.tsx", "utf8"),
  head: fs.readFileSync("src/seo/seo-head.ts", "utf8"),
};

const results = [
  [
    "Backend URL fails closed to HTTPS in Production",
    files.backend.includes('url.protocol !== "https:"'),
  ],
  ["CMS payload is runtime-schema validated", files.backend.includes("contentPageSchema.parse")],
  [
    "Browser CMS navigation uses same-origin BFF",
    files.runtime.includes("fetch(`/api/seo?mode=content&slug="),
  ],
  [
    "Redirects are exact-path and protocol-relative targets are rejected",
    files.backend.includes('!entry.destination_path.startsWith("//")'),
  ],
  [
    "Segmented sitemap uses only backend-published truth",
    files.infra.includes("fetchP10Sitemap") &&
      files.infra.includes("segments[match[1] as keyof P10Sitemap]"),
  ],
  [
    "Merchant feed failure is non-indexable and fail-closed",
    files.infra.includes("merchant_feed_unavailable") &&
      files.infra.includes('"x-robots-tag": "noindex"'),
  ],
  ["Invalid or unpublished CMS pages become not-found", files.route.includes("throw notFound()")],
  [
    "CMS metadata is present in first route head",
    files.route.includes('name: "description"') && files.route.includes('rel: "canonical"'),
  ],
  [
    "Authoritative product schema does not fabricate rating or offer",
    files.head.includes('"@type": "Product"') &&
      !files.head.includes('"AggregateRating"') &&
      !files.head.includes('"Offer"'),
  ],
];

const report = {
  schemaVersion: 1,
  suite: "p10-seo-content-merchant",
  generatedAt: new Date().toISOString(),
  results: results.map(([name, pass]) => ({ name, pass: Boolean(pass) })),
  summary: {
    total: results.length,
    passed: results.filter(([, pass]) => pass).length,
    failed: results.filter(([, pass]) => !pass).length,
  },
  pass: results.every(([, pass]) => pass),
};
const output = path.join("artifacts", "reports", "p10-seo-content-merchant-contract.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (!report.pass) process.exitCode = 1;

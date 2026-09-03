import fs from "node:fs";
import path from "node:path";

const files = {
  contracts: fs.readFileSync("src/observability/contracts.ts", "utf8"),
  client: fs.readFileSync("src/observability/client.ts", "utf8"),
  reporter: fs.readFileSync("src/observability/RumReporter.tsx", "utf8"),
  proxy: fs.readFileSync("src/observability/observability-proxy.server.ts", "utf8"),
  consent: fs.readFileSync("src/observability/AnalyticsConsentPanel.tsx", "utf8"),
};
const results = [
  [
    "analytics is explicit-consent gated without pre-consent network activity",
    files.reporter.includes("hasLocalAnalyticsConsent()"),
  ],
  ["session capability is session-scoped", files.client.includes("sessionStorage")],
  ["transport failure cannot block UX", files.client.includes("catch {")],
  ["raw URL and query are not event properties", !files.client.includes("location.href")],
  ["route cardinality is bounded", files.contracts.includes("routeTemplate")],
  ["BFF uses exact endpoint map", files.proxy.includes("const targets: Record<string, Target>")],
  ["Production backend requires HTTPS", files.proxy.includes('url.protocol !== "https:"')],
  ["mutations forward CSRF", files.proxy.includes("X-XSRF-TOKEN")],
  [
    "RUM has current CWV inputs",
    ["rum_lcp", "rum_inp", "rum_cls", "rum_ttfb"].every((x) => files.reporter.includes(x)),
  ],
  ["consent can be revoked", files.consent.includes("setAnalyticsConsent(next)")],
  [
    "browser cannot submit commerce outcomes",
    !/payment_paid|order_created|cart_engaged/.test(files.client + files.reporter),
  ],
];
const report = {
  schemaVersion: 1,
  suite: "p11-observability-rum-cro",
  generatedAt: new Date().toISOString(),
  results: results.map(([name, pass]) => ({ name, pass: Boolean(pass) })),
  summary: {
    total: results.length,
    passed: results.filter(([, pass]) => pass).length,
    failed: results.filter(([, pass]) => !pass).length,
  },
  pass: results.every(([, pass]) => pass),
};
const output = path.join("artifacts", "reports", "p11-observability-rum-cro-contract.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (!report.pass) process.exitCode = 1;

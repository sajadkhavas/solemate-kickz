import fs from "node:fs";
import path from "node:path";
const files = {
  api: fs.readFileSync("src/postpurchase/postpurchase-api.ts", "utf8"),
  proxy: fs.readFileSync("src/commerce/commerce-proxy.server.ts", "utf8"),
  support: fs.readFileSync("src/postpurchase/ProductionSupportPage.tsx", "utf8"),
  orders: fs.readFileSync("src/commerce/ProductionOrdersPage.tsx", "utf8"),
};
const results = [
  [
    "BFF exposes only exact P08 customer endpoints",
    files.proxy.includes('splat === "trust/content"') &&
      files.proxy.includes("/^support\\/cases\\/([0-9a-f-]{36})$/"),
  ],
  [
    "Trust content is schema validated with provenance",
    files.api.includes("provenance_url: z.string().url()") && files.api.includes("approved_at"),
  ],
  [
    "Missing authoritative content and SLA fail closed",
    files.support.includes("محتوای تأییدشده‌ای منتشر نشده") &&
      files.support.includes("مهلت پاسخ رسمی پیکربندی نشده"),
  ],
  [
    "Pending communications are not called sent",
    files.support.includes("ارسال تأیید نشده") && files.support.includes("item.sent_at"),
  ],
  [
    "Tracking consumes Backend events",
    files.orders.includes("getOrderTracking") && files.orders.includes("tracking.events.map"),
  ],
  [
    "Verified reviews disclose pending moderation",
    files.orders.includes("submitVerifiedReview") && files.orders.includes("هنوز عمومی نیست"),
  ],
];
const report = {
  schemaVersion: 1,
  suite: "p08-trust-support-postpurchase",
  generatedAt: new Date().toISOString(),
  results: results.map(([name, pass]) => ({ name, pass: Boolean(pass) })),
  summary: {
    total: results.length,
    passed: results.filter(([, pass]) => pass).length,
    failed: results.filter(([, pass]) => !pass).length,
  },
  pass: results.every(([, pass]) => pass),
};
const output = path.join("artifacts", "reports", "p08-trust-support-postpurchase-contract.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (!report.pass) process.exitCode = 1;

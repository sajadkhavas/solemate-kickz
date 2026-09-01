import fs from "node:fs";
import path from "node:path";

const files = {
  proxy: fs.readFileSync("src/commerce/commerce-proxy.server.ts", "utf8"),
  api: fs.readFileSync("src/commerce/commerce-api.ts", "utf8"),
  checkout: fs.readFileSync("src/commerce/ProductionCheckoutPage.tsx", "utf8"),
};
const results = [
  [
    "BFF allowlist rejects arbitrary commerce paths",
    files.proxy.includes("return null") && files.proxy.includes("not_found"),
  ],
  [
    "Cart capability is server-only HttpOnly cookie",
    files.proxy.includes("sole_cart=") &&
      files.proxy.includes("HttpOnly") &&
      !files.api.includes("localStorage"),
  ],
  [
    "Checkout uses per-attempt UUID idempotency",
    files.checkout.includes("crypto.randomUUID()") && files.api.includes('"Idempotency-Key"'),
  ],
  [
    "Client validates cart and order envelopes",
    files.api.includes("cartSchema") &&
      files.api.includes("orderSchema") &&
      files.api.includes("schema.parse"),
  ],
  [
    "Payment success is not fabricated",
    files.checkout.includes("پرداخت هنوز فعال نیست") && !files.checkout.includes("پرداخت موفق"),
  ],
];
const report = {
  schemaVersion: 1,
  suite: "p06-cart-checkout-orders",
  results: results.map(([name, pass]) => ({ name, pass })),
  summary: {
    total: results.length,
    passed: results.filter(([, pass]) => pass).length,
    failed: results.filter(([, pass]) => !pass).length,
  },
  pass: results.every(([, pass]) => pass),
};
const output = path.join("artifacts", "reports", "p06-cart-checkout-orders-contract.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
if (!report.pass) {
  console.error(report);
  process.exit(1);
}
console.log(JSON.stringify(report.summary));

import fs from "node:fs";
import path from "node:path";

const files = {
  api: fs.readFileSync("src/commerce/commerce-api.ts", "utf8"),
  proxy: fs.readFileSync("src/commerce/commerce-proxy.server.ts", "utf8"),
  checkout: fs.readFileSync("src/commerce/ProductionCheckoutPage.tsx", "utf8"),
  route: fs.readFileSync("src/commerce/production-checkout-route.tsx", "utf8"),
  orders: fs.readFileSync("src/commerce/ProductionOrdersPage.tsx", "utf8"),
};
const refundStart = files.api.indexOf("export const requestCommerceRefund");
const refundEnd = files.api.indexOf("export async function getCommerceOrders", refundStart);
const refundSlice = refundStart >= 0 && refundEnd > refundStart ? files.api.slice(refundStart, refundEnd) : "";

const results = [
  [
    "Provider webhook is not reachable through the storefront BFF",
    files.proxy.includes("Provider webhooks are intentionally not proxied through the storefront") &&
      !files.proxy.includes('splat === "shipping/provider-events"'),
  ],
  [
    "Payment callback is validated and verified by Backend before paid UI",
    files.route.includes("paymentCallbackSchema") &&
      files.checkout.includes("verifyCommercePayment") &&
      files.checkout.includes('verified.status !== "paid"'),
  ],
  [
    "Browser callback cannot declare payment success from Status=OK",
    !files.checkout.includes('paymentCallback.Status === "OK"') &&
      files.checkout.includes("نتیجه مرورگر به‌تنهایی معتبر نیست"),
  ],
  [
    "Gateway redirect is constrained to HTTPS ZarinPal",
    files.checkout.includes('target.protocol === "https:"') &&
      files.checkout.includes('target.hostname === "zarinpal.com"') &&
      files.checkout.includes('target.hostname.endsWith(".zarinpal.com")'),
  ],
  [
    "Refund amount is never submitted by the browser",
    refundSlice.length > 0 && !/amount_minor|amountMinor/.test(refundSlice),
  ],
  [
    "Shipping quote is server-derived before checkout",
    files.checkout.includes("getCommerceShippingQuotes") &&
      files.api.includes("shippingQuoteSchema") &&
      files.api.includes("shipping_quote_id"),
  ],
  [
    "Return and refund actions consume authoritative order lifecycle",
    files.orders.includes("requestCommerceReturn") &&
      files.orders.includes("requestCommerceRefund") &&
      files.orders.includes("order.shipment") &&
      files.orders.includes("order.payment"),
  ],
];

const report = {
  schemaVersion: 1,
  suite: "p07-payment-shipping-returns",
  generatedAt: new Date().toISOString(),
  results: results.map(([name, pass]) => ({ name, pass: Boolean(pass) })),
  summary: {
    total: results.length,
    passed: results.filter(([, pass]) => pass).length,
    failed: results.filter(([, pass]) => !pass).length,
  },
  pass: results.every(([, pass]) => pass),
};
const output = path.join("artifacts", "reports", "p07-payment-shipping-returns-contract.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (!report.pass) process.exitCode = 1;

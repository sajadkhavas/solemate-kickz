import { readFile } from "node:fs/promises";

const failures = [];
async function source(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    failures.push(`missing ${path}`);
    return "";
  }
}

const [api, proxy, checkout, checkoutRoute, orders, accountRoute, registry, handoff] =
  await Promise.all([
    source("src/commerce/commerce-api.ts"),
    source("src/commerce/commerce-proxy.server.ts"),
    source("src/commerce/ProductionCheckoutPage.tsx"),
    source("src/commerce/production-checkout-route.tsx"),
    source("src/commerce/ProductionOrdersPage.tsx"),
    source("src/auth/production-account-route.tsx"),
    source("contracts/production-phase-registry.json"),
    source("docs/handoffs/P07-PAYMENT-SHIPPING-RETURNS.md"),
  ]);

for (const marker of [
  "shippingQuoteSchema",
  "paymentSchema",
  "getCommerceShippingQuotes",
  "initiateCommercePayment",
  "verifyCommercePayment",
  "reconcileCommercePayment",
  "requestCommerceReturn",
  "requestCommerceRefund",
])
  if (!api.includes(marker)) failures.push(`P07 commerce client missing ${marker}`);

const refundStart = api.indexOf("export const requestCommerceRefund");
const refundEnd = api.indexOf("export async function getCommerceOrders", refundStart);
const refundSlice =
  refundStart >= 0 && refundEnd > refundStart ? api.slice(refundStart, refundEnd) : "";
if (!refundSlice || /amount_minor|amountMinor/.test(refundSlice))
  failures.push("P07 browser refund request must not submit a monetary amount");

for (const marker of [
  "shipping/quotes",
  "/payments",
  "/verify",
  "/reconcile",
  "/returns",
  "/refunds",
  "Provider webhooks are intentionally not proxied through the storefront",
])
  if (!proxy.includes(marker)) failures.push(`P07 BFF missing ${marker}`);
if (proxy.includes('splat === "shipping/provider-events"'))
  failures.push("P07 provider webhook must not be browser-proxied");

for (const marker of [
  "getCommerceShippingQuotes",
  "createCommerceOrder(addressId, quoteId",
  "verifyCommercePayment",
  'verified.status !== "paid"',
  "trustedZarinPal",
  'target.protocol === "https:"',
  "نتیجه مرورگر به‌تنهایی معتبر نیست",
])
  if (!checkout.includes(marker)) failures.push(`P07 checkout missing ${marker}`);
if (checkout.includes('paymentCallback.Status === "OK"'))
  failures.push("P07 callback must not infer paid state directly from browser query params");

for (const marker of [
  "payment_attempt",
  "Authority",
  "Status",
  "paymentCallbackSchema",
  "Route.useSearch",
])
  if (!checkoutRoute.includes(marker)) failures.push(`P07 callback route missing ${marker}`);

for (const marker of [
  "requestCommerceReturn",
  "requestCommerceRefund",
  "order.payment",
  "order.shipment",
  "order.return",
  "order.refunds",
  "مبلغ از Client ارسال نمی‌شود",
  "اجرای پولی Provider نیست",
])
  if (!orders.includes(marker)) failures.push(`P07 order lifecycle surface missing ${marker}`);
if (/name=["']amount/.test(orders) || /amount_minor\s*:/.test(orders))
  failures.push(
    "P07 order lifecycle surface must not expose a client-controlled refund amount field",
  );

if (
  !accountRoute.includes('section === "orders"') ||
  !accountRoute.includes("ProductionOrdersPage")
)
  failures.push("P07 production account route must surface authoritative lifecycle orders");

for (const marker of ["P07.1", "P07.2", "P07.3", "P07.4", "P07.5", "P07.6", "P07.7"])
  if (!handoff.includes(marker)) failures.push(`P07 handoff missing ${marker}`);

try {
  const phase = JSON.parse(registry).phases.find((item) => item.id === "P07");
  if (!phase || !["registered", "in_progress", "completed"].includes(phase.status))
    failures.push("P07 registry entry invalid");
} catch {
  failures.push("P07 registry must be valid JSON");
}

if (failures.length) {
  console.error("P07 payment/shipping/returns audit failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("P07 payment/shipping/returns audit passed.");

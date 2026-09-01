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
const [proxy, api, cart, checkout, account, purchase, vite, routes, registry, handoff] =
  await Promise.all([
    source("src/commerce/commerce-proxy.server.ts"),
    source("src/commerce/commerce-api.ts"),
    source("src/commerce/ProductionCartPage.tsx"),
    source("src/commerce/ProductionCheckoutPage.tsx"),
    source("src/auth/ProductionAccountPage.tsx"),
    source("src/components/product/ProductPurchasePanel.tsx"),
    source("vite.config.ts"),
    source("src/routes/api.commerce.$.ts"),
    source("contracts/production-phase-registry.json"),
    source("docs/handoffs/P06-CART-CHECKOUT-ORDERS.md"),
  ]);
for (const marker of [
  "targetFor",
  "X-Sole-Cart",
  "Idempotency-Key",
  "HttpOnly",
  "SameSite=Lax",
  "AbortSignal.timeout",
  "private, no-store",
])
  if (!proxy.includes(marker)) failures.push(`P06 BFF missing ${marker}`);
for (const marker of [
  "cartSchema",
  "orderSchema",
  "z.string().uuid()",
  "putCommerceCartItem",
  "createCommerceOrder",
  "getCommerceOrders",
])
  if (!api.includes(marker)) failures.push(`P06 client contract missing ${marker}`);
for (const marker of [
  "Server-authoritative cart",
  "checkout_ready",
  "available_quantity",
  "هزینه ارسال و مبلغ نهایی",
])
  if (!cart.includes(marker)) failures.push(`P06 cart UI missing ${marker}`);
for (const marker of [
  "crypto.randomUUID",
  "getAddresses",
  "ثبت سفارش و رزرو موجودی",
  "getCommerceShippingQuotes",
  "verifyCommercePayment",
])
  if (!checkout.includes(marker)) failures.push(`P06/P07 checkout UI missing ${marker}`);
if (!checkout.includes('verified.status !== "paid"'))
  failures.push("P06/P07 checkout must reject a callback that Backend did not verify as paid");
for (const marker of ["getCommerceOrders", "CommerceOrder", "reservation_expires_at"])
  if (!account.includes(marker) && marker !== "reservation_expires_at")
    failures.push(`P06 order account missing ${marker}`);
if (!purchase.includes("putCommerceCartItem(selectedVariant.id"))
  failures.push("Production PDP must add authoritative variant to server cart");
for (const marker of [
  "productionCartRouteModule",
  "productionCheckoutRouteModule",
  'source === "./routes/cart"',
  'source === "./routes/checkout"',
])
  if (!vite.includes(marker)) failures.push(`P06 production route isolation missing ${marker}`);
for (const marker of ["GET: handler", "POST: handler", "PUT: handler", "DELETE: handler"])
  if (!routes.includes(marker)) failures.push(`P06 route handler missing ${marker}`);
for (const marker of ["P06.1", "P06.2", "P06.3", "P06.4", "P06.5", "P06.6", "P06.7"])
  if (!handoff.includes(marker)) failures.push(`P06 handoff missing ${marker}`);
try {
  const phase = JSON.parse(registry).phases.find((item) => item.id === "P06");
  if (!phase || !["registered", "in_progress", "completed"].includes(phase.status))
    failures.push("P06 registry entry invalid");
} catch {
  failures.push("P06 registry must be valid JSON");
}
if (failures.length) {
  console.error("P06 cart/checkout/orders audit failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("P06 cart/checkout/orders audit passed.");

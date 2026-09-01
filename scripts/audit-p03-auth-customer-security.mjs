import { access, readFile } from "node:fs/promises";

const failures = [];

async function text(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    failures.push(`missing ${path}`);
    return "";
  }
}

const [
  vite,
  proxy,
  client,
  authPage,
  authRoute,
  accountPage,
  accountRoute,
  serverRoute,
  routeTree,
  f2Audit,
  f7Audit,
  productionNavbar,
  productionFooter,
  productionMobileBottomNav,
] = await Promise.all([
  text("vite.config.ts"),
  text("src/auth/auth-proxy.server.ts"),
  text("src/auth/customer-auth.ts"),
  text("src/auth/ProductionAuthPage.tsx"),
  text("src/auth/production-auth-route.tsx"),
  text("src/auth/ProductionAccountPage.tsx"),
  text("src/auth/production-account-route.tsx"),
  text("src/routes/api.auth.$.ts"),
  text("src/routeTree.gen.ts"),
  text("scripts/audit-f2-navigation-search.mjs"),
  text("scripts/audit-f7-cart-checkout.mjs"),
  text("src/auth/ProductionNavbar.tsx"),
  text("src/auth/ProductionFooter.tsx"),
  text("src/auth/ProductionMobileBottomNav.tsx"),
]);

for (const marker of [
  'source === "./routes/auth"',
  'source === "./routes/account"',
  "productionAuthRouteModule",
  "productionAccountRouteModule",
  "sole-production-truth-guard",
  "productionNavbarModule",
  "productionFooterModule",
  "productionMobileBottomNavModule",
  "isProductionCustomerPage",
]) {
  if (!vite.includes(marker)) failures.push(`production route isolation missing ${marker}`);
}
for (const marker of [
  'source === "@/components/Navbar"',
  'source === "@/components/sections/Footer"',
  'source === "@/components/MobileBottomNav"',
]) {
  if (!vite.includes(marker))
    failures.push(`production customer shell isolation missing ${marker}`);
}
for (const marker of [
  "rolldownOptions",
  "codeSplitting",
  'name: "shared"',
  "minShareCount: 2",
  "minSize: 20_000",
  "entriesAware: true",
]) {
  if (!vite.includes(marker)) failures.push(`stable production chunking missing ${marker}`);
}

for (const marker of [
  "process.env.SOLE_API_URL",
  'process.env.NODE_ENV === "production"',
  'url.protocol !== "https:"',
  'csrf: { GET: "/sanctum/csrf-cookie" }',
  '"google/start": { GET: "/auth/google/redirect" }',
  '"google/callback": { GET: "/auth/google/callback" }',
  'session: { GET: "/api/v1/auth/me" }',
  '"customer/export": { GET: "/api/v1/customer/export" }',
  '"customer/deletion"',
  "X-XSRF-TOKEN",
  "Cookie",
  'redirect: "manual"',
  '"Cache-Control": "private, no-store"',
]) {
  if (!proxy.includes(marker)) failures.push(`auth BFF boundary missing ${marker}`);
}
if (/new URL\(.*splat/.test(proxy) || /targetUrl.*splat/.test(proxy)) {
  failures.push("auth BFF must not concatenate an arbitrary splat into the backend URL");
}
if (proxy.includes("KAVENEGAR_API_KEY") || proxy.includes("GOOGLE_CLIENT_SECRET")) {
  failures.push("provider secrets must never exist in the frontend auth BFF source");
}

for (const marker of [
  "fetch(`/api/auth/${path}`",
  'credentials: "same-origin"',
  'request<void>("csrf")',
  "getCustomerSession",
  "updateCustomerProfile",
  "getAddresses",
  "recordConsent",
  "requestAccountDeletion",
  "cancelAccountDeletion",
]) {
  if (!client.includes(marker)) failures.push(`customer auth client missing ${marker}`);
}

for (const marker of [
  "/api/auth/google/start?return_to=%2Faccount",
  "ورود با Google",
  "production-phone-completion",
  "updateCustomerProfile",
]) {
  if (!authPage.includes(marker)) failures.push(`production auth UI missing ${marker}`);
}
for (const forbidden of ["password", "ثبت‌نام نمایشی", "localStorage", "sessionStorage"]) {
  if (authPage.includes(forbidden))
    failures.push(`production auth UI contains forbidden demo/password marker: ${forbidden}`);
}

for (const marker of [
  "getCustomerSession",
  "getAddresses",
  "getConsents",
  "accountExportUrl",
  "requestAccountDeletion",
  "cancelAccountDeletion",
  "saveAddress",
  "deleteAddress",
  "logoutCustomer",
  "getCommerceOrders",
  "هنوز سفارشی ثبت نشده است",
]) {
  if (!accountPage.includes(marker)) failures.push(`production account UI missing ${marker}`);
}
for (const forbidden of ["DEMO_ORDERS", "account-profile-v1", "localStorage", "sessionStorage"]) {
  if (accountPage.includes(forbidden))
    failures.push(`production account UI contains forbidden demo authority: ${forbidden}`);
}

for (const [name, source, route] of [
  ["auth", authRoute, 'createFileRoute("/auth")'],
  ["account", accountRoute, 'createFileRoute("/account")'],
  ["server", serverRoute, 'createFileRoute("/api/auth/$")'],
]) {
  if (!source.includes(route)) failures.push(`${name} production route contract missing ${route}`);
}

for (const marker of ["ApiAuthSplatRouteImport", "'/api/auth/$': typeof ApiAuthSplatRoute"]) {
  if (!routeTree.includes(marker)) failures.push(`generated route tree missing ${marker}`);
}
if (!f2Audit.includes('"/api/auth/$"') || !f7Audit.includes("ApiAuthSplatRouteImport")) {
  failures.push("cumulative exact-route gates must register the controlled P03 auth server route");
}

for (const [name, source] of [
  ["production navbar", productionNavbar],
  ["production footer", productionFooter],
  ["production mobile navigation", productionMobileBottomNav],
]) {
  if (!source.includes("Backend") && name !== "production mobile navigation") {
    failures.push(`${name} must state backend authority`);
  }
  for (const forbidden of ["@/store", "SearchDialog", "NotificationCenter", "framer-motion"]) {
    if (source.includes(forbidden))
      failures.push(`${name} imports heavy/demo shell dependency ${forbidden}`);
  }
}
if (!productionNavbar.includes("fail-closed")) {
  failures.push("production navbar must disclose fail-closed account boundary");
}

try {
  await access(".github/workflows/p03-route-sync.yml");
  failures.push("temporary P03 route-sync workflow must not remain in the accepted tree");
} catch {
  // Expected: the temporary generator workflow removes itself before acceptance.
}

if (failures.length) {
  console.error("P03 auth/customer security audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("P03 auth/customer security audit passed.");

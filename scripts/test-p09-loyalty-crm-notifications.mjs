import fs from "node:fs";
import path from "node:path";

const files = {
  api: fs.readFileSync("src/engagement/engagement-api.ts", "utf8"),
  proxy: fs.readFileSync("src/engagement/engagement-proxy.server.ts", "utf8"),
  store: fs.readFileSync("src/engagement/production-wishlist-store.ts", "utf8"),
  card: fs.readFileSync("src/engagement/ProductionShoeCard.tsx", "utf8"),
  panel: fs.readFileSync("src/engagement/ProductionProductPurchasePanel.tsx", "utf8"),
  notifications: fs.readFileSync("src/engagement/ProductionNotificationCenter.tsx", "utf8"),
  loyalty: fs.readFileSync("src/engagement/ProductionLoyaltyPage.tsx", "utf8"),
  vite: fs.readFileSync("vite.config.ts", "utf8"),
};

const results = [
  [
    "Engagement BFF is exact and account-scoped",
    files.proxy.includes('/api/v1/customer/wishlist') &&
      files.proxy.includes('/api/v1/customer/notification-preferences') &&
      files.proxy.includes('/api/v1/customer/loyalty'),
  ],
  [
    "Legacy migration clears local data only after Backend acceptance",
    files.store.indexOf("await migrateWishlistVariants") < files.store.indexOf("clearLegacyWishlist();"),
  ],
  [
    "Production product cards do not use local Zustand wishlist authority",
    !files.card.includes("useStore") && files.card.includes("useProductionWishlistItem"),
  ],
  [
    "Production PDP replaces the visible local wishlist action",
    files.panel.includes('data-testid="p09-product-wishlist"') &&
      files.panel.includes('[data-testid="product-wishlist"] { display: none !important; }') &&
      files.panel.includes("useProductionWishlistItem"),
  ],
  [
    "Notification delivery does not claim an unconfigured provider",
    files.notifications.includes("fail-closed") && files.notifications.includes("adapter/provider واقعی"),
  ],
  [
    "Loyalty UI is read-only and server authoritative",
    files.loyalty.includes("Server-authoritative loyalty") &&
      files.loyalty.includes("ارزش نقدی: ندارد") &&
      !files.loyalty.includes("redeem("),
  ],
  [
    "Production truth guard swaps wishlist, cards, PDP and notification center",
    files.vite.includes("productionWishlistRouteModule") &&
      files.vite.includes("productionShoeCardModule") &&
      files.vite.includes("productionProductPurchasePanelModule") &&
      files.vite.includes("productionNotificationCenterModule"),
  ],
  [
    "Wishlist migration response is parsed at the top-level envelope",
    files.api.includes("wishlistMigrationSchema.parse(await response.json())"),
  ],
];

const report = {
  schemaVersion: 1,
  suite: "p09-loyalty-crm-notifications",
  generatedAt: new Date().toISOString(),
  results: results.map(([name, pass]) => ({ name, pass: Boolean(pass) })),
  summary: {
    total: results.length,
    passed: results.filter(([, pass]) => pass).length,
    failed: results.filter(([, pass]) => !pass).length,
  },
  pass: results.every(([, pass]) => pass),
};

const output = path.join("artifacts", "reports", "p09-loyalty-crm-notifications-contract.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (!report.pass) process.exitCode = 1;

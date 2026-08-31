// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { fileURLToPath } from "node:url";

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isNodeServerBuild = process.env.SOLE_DEPLOY_TARGET === "node-server";
const lifecycleEvent = process.env.npm_lifecycle_event;
const isExplicitProductionBuild =
  lifecycleEvent === "build" || lifecycleEvent === "build:vps" || process.argv.includes("build");
const isProductionBuild = isNodeServerBuild || isExplicitProductionBuild;
const productionCatalogModule = fileURLToPath(
  new URL("./src/data/production-shoes.ts", import.meta.url),
);
const productionAuthRouteModule = fileURLToPath(
  new URL("./src/auth/production-auth-route.tsx", import.meta.url),
);
const productionAccountRouteModule = fileURLToPath(
  new URL("./src/auth/production-account-route.tsx", import.meta.url),
);
const productionNavbarModule = fileURLToPath(
  new URL("./src/auth/ProductionNavbar.tsx", import.meta.url),
);
const productionFooterModule = fileURLToPath(
  new URL("./src/auth/ProductionFooter.tsx", import.meta.url),
);
const productionMobileBottomNavModule = fileURLToPath(
  new URL("./src/auth/ProductionMobileBottomNav.tsx", import.meta.url),
);

function isProductionCustomerPage(importer?: string) {
  return (
    importer?.endsWith("/src/auth/ProductionAuthPage.tsx") ||
    importer?.endsWith("/src/auth/ProductionAccountPage.tsx")
  );
}

const productionTruthGuard = {
  name: "sole-production-truth-guard",
  enforce: "pre" as const,
  resolveId(source: string, importer?: string) {
    if (!isProductionBuild) return null;

    if (source === "@/data/shoes") return productionCatalogModule;

    if (importer?.endsWith("/src/routeTree.gen.ts")) {
      if (source === "./routes/auth") return productionAuthRouteModule;
      if (source === "./routes/account") return productionAccountRouteModule;
    }

    if (isProductionCustomerPage(importer)) {
      if (source === "@/components/Navbar") return productionNavbarModule;
      if (source === "@/components/sections/Footer") return productionFooterModule;
      if (source === "@/components/MobileBottomNav") return productionMobileBottomNavModule;
    }

    return null;
  },
};

export default defineConfig({
  // Local development and browser QA retain deterministic fixture catalog/account surfaces.
  // Production builds replace product truth and auth/account routes with backend-authoritative modules.
  vite: {
    plugins: [productionTruthGuard],
  },
  // Keep Lovable's normal preview/build behavior unchanged. Self-hosted VPS builds
  // opt in explicitly through `bun run build:vps`, which sets SOLE_DEPLOY_TARGET.
  ...(isNodeServerBuild ? { nitro: { preset: "node-server" } } : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this.
    server: { entry: "server" },
  },
});

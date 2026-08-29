// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { fileURLToPath } from "node:url";

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isNodeServerBuild = process.env.SOLE_DEPLOY_TARGET === "node-server";
const isProductionBuild = process.env.NODE_ENV === "production" || isNodeServerBuild;
const productionCatalogModule = fileURLToPath(new URL("./src/data/production-shoes.ts", import.meta.url));

const productionCatalogGuard = {
  name: "sole-production-catalog-guard",
  enforce: "pre" as const,
  resolveId(source: string) {
    if (isProductionBuild && source === "@/data/shoes") {
      return productionCatalogModule;
    }

    return null;
  },
};

export default defineConfig({
  // Local development and browser QA retain their deterministic fixture catalog.
  // Production builds resolve the same import to a fail-closed module with no product truth.
  vite: {
    plugins: [productionCatalogGuard],
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

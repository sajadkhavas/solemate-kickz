import fs from "node:fs";
import path from "node:path";

import {
  evaluate,
  navigate,
  openBrowser,
  serialiseArgument,
  sleep,
  waitForExpression,
} from "./browser-harness.mjs";
import { withCatalogServer } from "./f4-f5-browser-runner.mjs";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "artifacts/visual-qa/f4-f5-catalog-product-card");
const REPORT = path.join(OUTPUT, "f4-f5-catalog-product-card.json");
const CHROME_LOG = path.join(ROOT, "artifacts/runtime/f4-f5-visual-chrome.txt");
const captures = [];
const criticalFindings = [];
const browserErrors = [];

const VIEWPORTS = [
  [320, 568],
  [375, 812],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
];

function slug(value) {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function viewport(client, width, height, mobile = width < 768) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  });
}

async function screenshot(client, name) {
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    fromSurface: true,
  });
  const file = path.join(OUTPUT, `${slug(name)}.png`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(result.data, "base64"));
  return path.relative(ROOT, file);
}

async function click(client, selector) {
  const clicked = await evaluate(
    client,
    `(() => {
      const target = document.querySelector(${JSON.stringify(selector)});
      target?.click(); return Boolean(target);
    })()`,
  );
  if (!clicked) throw new Error(`Target not found: ${selector}`);
  await sleep(120);
}

async function activateVisible(client, selector) {
  const activated = await evaluate(
    client,
    `(() => {
      const target = [...document.querySelectorAll(${JSON.stringify(selector)})].find((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
          style.visibility !== 'hidden' && style.pointerEvents !== 'none';
      });
      if (!(target instanceof HTMLElement)) return false;
      target.scrollIntoView({ block: 'center', inline: 'center' });
      target.focus({ preventScroll: true });
      target.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
      }));
      return true;
    })()`,
  );
  if (!activated) throw new Error(`Visible activation target not found: ${selector}`);
  await sleep(150);
}

async function inspect(client) {
  return evaluate(
    client,
    `(() => {
      const productRoot = document.querySelector('[data-testid="catalog-results"]')?.parentElement ?? document.body;
      const tinyTargets = [...productRoot.querySelectorAll('button,a[href],select,input')]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
        })
        .slice(0, 20)
        .map((element) => ({
          tag: element.tagName,
          text: element.textContent?.trim().slice(0, 50),
          label: element.getAttribute('aria-label'),
          width: Math.round(element.getBoundingClientRect().width),
          height: Math.round(element.getBoundingClientRect().height),
        }));
      return {
        width: innerWidth,
        height: innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        h1: document.querySelectorAll('h1').length,
        cards: document.querySelectorAll('[data-testid="product-card"]').length,
        unnamedButtons: [...document.querySelectorAll('button')].filter((button) => !((button.getAttribute('aria-label') || button.textContent || '').trim())).length,
        tinyTargets,
      };
    })()`,
  );
}

async function captureState(client, baseUrl, name, url, width, height, setup) {
  await viewport(client, width, height);
  await navigate(client, `${baseUrl}${url}`);
  await waitForExpression(client, `document.querySelector('h1')`);
  if (setup) await setup();
  await waitForExpression(client, `document.fonts.status === 'loaded'`);
  await waitForExpression(
    client,
    `[...document.querySelectorAll('[data-testid="product-card"] img')].every((image) => image.complete)`,
  );
  await sleep(650);
  const metrics = await inspect(client);
  const file = await screenshot(client, `${name}-${width}x${height}`);
  const findings = [];
  if (metrics.overflow) findings.push("horizontal-overflow");
  if (metrics.h1 !== 1) findings.push(`h1-count-${metrics.h1}`);
  if (metrics.unnamedButtons) findings.push(`unnamed-buttons-${metrics.unnamedButtons}`);
  if (metrics.tinyTargets.length) findings.push(`targets-below-44-${metrics.tinyTargets.length}`);
  if (findings.length) criticalFindings.push({ name, width, height, findings, metrics });
  captures.push({ name, url, width, height, file, metrics, findings });
}

async function run(baseUrl) {
  fs.rmSync(OUTPUT, { recursive: true, force: true });
  const browser = await openBrowser({ debugPort: 9246, logPath: CHROME_LOG });
  const { client } = browser;
  await client.send("Network.enable");
  await client.send("Network.setBlockedURLs", {
    urls: ["https://images.unsplash.com/*", "https://*.unsplash.com/*"],
  });

  client.on("Runtime.exceptionThrown", (event) => {
    browserErrors.push(
      event.exceptionDetails?.exception?.description ??
        event.exceptionDetails?.text ??
        "Runtime exception",
    );
  });
  client.on("Runtime.consoleAPICalled", (event) => {
    if (event.type === "error") browserErrors.push(event.args.map(serialiseArgument).join(" "));
  });

  try {
    for (const [width, height] of VIEWPORTS) {
      await captureState(client, baseUrl, "catalog-default", "/products", width, height);
    }

    await captureState(
      client,
      baseUrl,
      "catalog-list-deeplink",
      "/products?brand=Nike&sizes=42&view=list&sort=price-asc",
      1440,
      900,
    );
    await captureState(
      client,
      baseUrl,
      "catalog-empty",
      "/products?q=__missing_product__",
      390,
      844,
    );
    await captureState(client, baseUrl, "mobile-filter-open", "/products", 390, 844, async () => {
      await click(client, '[data-testid="mobile-filter-trigger"]');
      await waitForExpression(
        client,
        `document.querySelector('[data-testid="mobile-filter-dialog"]')`,
      );
    });
    await captureState(client, baseUrl, "quick-view-open", "/products", 1280, 800, async () => {
      await waitForExpression(
        client,
        `[...document.querySelectorAll('[data-testid="quick-view-trigger"]')].some((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })`,
      );
      await activateVisible(client, '[data-testid="quick-view-trigger"]');
      await waitForExpression(
        client,
        `document.querySelector('[data-testid="quick-view-dialog"]')`,
      );
    });

    await client.send("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await captureState(client, baseUrl, "catalog-reduced-motion", "/products", 390, 844);
  } finally {
    await browser.close();
  }

  const hydration = browserErrors.filter((error) =>
    /hydration|server rendered html|did not match/i.test(error),
  );
  const runtime = browserErrors.filter((error) =>
    /uncaught|typeerror|referenceerror|syntaxerror/i.test(error),
  );
  if (hydration.length) criticalFindings.push({ name: "hydration", findings: hydration });
  if (runtime.length) criticalFindings.push({ name: "runtime", findings: runtime });

  const report = {
    schemaVersion: 1,
    suite: "f4-f5-catalog-product-card-visual",
    generatedAt: new Date().toISOString(),
    captures,
    browserErrors,
    criticalFindings,
    summary: {
      captures: captures.length,
      critical: criticalFindings.length,
    },
    pass: criticalFindings.length === 0,
  };
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary));
  if (criticalFindings.length) console.error(JSON.stringify(criticalFindings, null, 2));
  if (!report.pass) process.exitCode = 1;
}

withCatalogServer(
  {
    envName: "F4_F5_VISUAL_BASE_URL",
    port: 4177,
    logPath: "artifacts/runtime/f4-f5-visual-server.txt",
  },
  run,
).catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});

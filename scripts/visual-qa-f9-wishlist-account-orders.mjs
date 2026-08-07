import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  evaluate,
  navigate,
  openBrowser,
  serialiseArgument,
  sleep,
  waitForExpression,
} from "./browser-harness.mjs";
import { withF9Server } from "./f9-browser-runner.mjs";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "artifacts/visual-qa/f9-wishlist-account-orders");
const REPORT = path.join(OUTPUT, "f9-wishlist-account-orders.json");
const CHROME_LOG = path.join(ROOT, "artifacts/runtime/f9-wishlist-account-orders-visual-chrome.txt");
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

const safeName = (value) =>
  value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();

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
  const image = await client.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    fromSurface: true,
  });
  const file = path.join(OUTPUT, `${safeName(name)}.png`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(image.data, "base64"));
  return path.relative(ROOT, file);
}

async function seed(client, state) {
  await evaluate(
    client,
    `localStorage.setItem('sole-store', JSON.stringify({ state: ${JSON.stringify(state)}, version: 0 })); true`,
  );
}

async function inspect(client) {
  return evaluate(
    client,
    `(() => {
      const main = document.querySelector('main');
      const controls = main ? [...main.querySelectorAll('button,a[href],input,textarea,select')].filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      }) : [];
      const tinyTargets = controls
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width < 44 || rect.height < 44;
        })
        .slice(0, 20)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName,
            label: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 60),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        });
      const unnamedButtons = controls.filter(
        (element) => element.tagName === 'BUTTON' && !((element.getAttribute('aria-label') || element.textContent || '').trim()),
      ).length;
      return {
        viewport: { width: innerWidth, height: innerHeight },
        documentWidth: document.documentElement.scrollWidth,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        h1: document.querySelectorAll('main h1').length,
        tinyTargets,
        unnamedButtons,
      };
    })()`,
  );
}

async function capture(client, baseUrl, name, url, width, height, state) {
  await viewport(client, width, height);
  await navigate(client, `${baseUrl}/`);
  if (state === null) await evaluate(client, `localStorage.removeItem('sole-store'); true`);
  else if (state) await seed(client, state);
  await navigate(client, `${baseUrl}${url}`);
  await waitForExpression(client, `document.querySelector('main h1')`);
  await waitForExpression(client, `document.fonts.status === 'loaded'`);
  await sleep(550);

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

const baseState = {
  wishlist: [1, 2],
  cart: [],
  recentlyViewed: [],
  searchHistory: [],
  user: null,
  demoAccountMode: "active",
  demoProfile: { name: "کاربر نمایشی SOLE", email: "demo@sole.local", phone: "09120000000" },
  demoAddresses: [
    {
      id: "visual-address-1",
      recipient: "گیرنده نمایشی",
      city: "تهران",
      address: "نشانی محلی نمونه برای بررسی رابط حساب SOLE",
    },
  ],
};

async function run(baseUrl) {
  fs.rmSync(OUTPUT, { recursive: true, force: true });
  const browser = await openBrowser({ debugPort: 9257, logPath: CHROME_LOG });
  const { client } = browser;
  await client.send("Network.enable");
  await client.send("Network.setBlockedURLs", {
    urls: ["https://images.unsplash.com/*", "https://*.unsplash.com/*"],
  });

  client.on("Runtime.exceptionThrown", (event) => {
    browserErrors.push(event.exceptionDetails?.exception?.description ?? event.exceptionDetails?.text ?? "Runtime exception");
  });
  client.on("Runtime.consoleAPICalled", (event) => {
    if (event.type === "error") browserErrors.push(event.args.map(serialiseArgument).join(" "));
  });

  try {
    for (const [width, height] of VIEWPORTS) {
      await capture(client, baseUrl, "account-overview", "/account", width, height, baseState);
    }

    await capture(client, baseUrl, "wishlist-empty", "/wishlist", 390, 844, { ...baseState, wishlist: [] });
    await capture(client, baseUrl, "wishlist-populated-mobile", "/wishlist", 390, 844, baseState);
    await capture(client, baseUrl, "wishlist-populated-desktop", "/wishlist", 1440, 900, baseState);
    await capture(client, baseUrl, "account-guest", "/account", 390, 844, null);
    await capture(client, baseUrl, "account-profile", "/account?section=profile", 1280, 800, baseState);
    await capture(client, baseUrl, "account-addresses", "/account?section=addresses", 390, 844, baseState);
    await capture(client, baseUrl, "account-orders", "/account?section=orders", 1280, 800, baseState);
    await capture(client, baseUrl, "account-order-detail", "/account?section=orders&order=SOLE-DEMO-2401", 390, 844, baseState);
    await capture(client, baseUrl, "account-expired", "/account", 390, 844, { ...baseState, demoAccountMode: "expired" });

    await client.send("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await capture(client, baseUrl, "account-reduced-motion", "/account", 390, 844, baseState);
  } finally {
    await browser.close();
  }

  const hydration = browserErrors.filter((error) => /hydration|server rendered html|did not match/i.test(error));
  const runtime = browserErrors.filter((error) => /uncaught|typeerror|referenceerror|syntaxerror/i.test(error));
  if (hydration.length) criticalFindings.push({ name: "hydration", findings: hydration });
  if (runtime.length) criticalFindings.push({ name: "runtime", findings: runtime });

  const report = {
    schemaVersion: 1,
    suite: "f9-wishlist-account-orders-visual",
    generatedAt: new Date().toISOString(),
    captures,
    browserErrors,
    criticalFindings,
    summary: { captures: captures.length, critical: criticalFindings.length },
    pass: criticalFindings.length === 0,
  };
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary));
  if (criticalFindings.length) console.error(JSON.stringify(criticalFindings, null, 2));
  if (!report.pass) process.exitCode = 1;
}

withF9Server(
  {
    envName: "F9_VISUAL_BASE_URL",
    port: 4197,
    logPath: "artifacts/runtime/f9-wishlist-account-orders-visual-server.txt",
  },
  run,
).catch((error) => {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(
    REPORT,
    `${JSON.stringify({ schemaVersion: 1, suite: "f9-wishlist-account-orders-visual", pass: false, fatalError: error instanceof Error ? (error.stack ?? error.message) : String(error) }, null, 2)}\n`,
  );
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});

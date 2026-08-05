import { spawn } from "node:child_process";
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
  waitForHttp,
} from "./browser-harness.mjs";

const ROOT = process.cwd();
const PORT = 4175;
const BASE_URL = process.env.F3_BEHAVIOR_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const BASE_ORIGIN = new URL(BASE_URL).origin;
const REPORT_PATH = path.join(ROOT, "artifacts/reports/f3-homepage-behavior.json");
const SERVER_LOG = path.join(ROOT, "artifacts/runtime/f3-behavior-server.txt");
const CHROME_LOG = path.join(ROOT, "artifacts/runtime/f3-behavior-chrome.txt");
const results = [];
const browserErrors = [];
const requestUrls = new Map();
const failedRequests = [];

function record(name, pass, evidence) {
  results.push({ name, pass: Boolean(pass), evidence });
  if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
}

async function stop(child) {
  if (!child || child.exitCode !== null) return;
  const exited = new Promise((resolve) => child.once("exit", resolve));
  child.kill("SIGTERM");
  if (!(await Promise.race([exited.then(() => true), sleep(3_000).then(() => false)]))) {
    child.kill("SIGKILL");
    await Promise.race([exited, sleep(1_000)]);
  }
}

async function startServer() {
  if (process.env.F3_BEHAVIOR_BASE_URL) return { child: null, log: null };
  fs.mkdirSync(path.dirname(SERVER_LOG), { recursive: true });
  const log = fs.openSync(SERVER_LOG, "w");
  const child = spawn(
    "bun",
    ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(PORT)],
    { cwd: ROOT, stdio: ["ignore", log, log], env: process.env },
  );
  await waitForHttp(BASE_URL, 60_000);
  return { child, log };
}

async function openHome(client) {
  await navigate(client, `${BASE_URL}/`);
  await waitForExpression(client, `document.querySelector('[data-testid="home-hero"]')`);
  await waitForExpression(
    client,
    `(() => { const el = document.querySelector('[data-testid="hero-primary-cta"]'); return Boolean(el && Object.keys(el).some((key) => key.startsWith('__reactProps$'))); })()`,
  );
  await sleep(150);
}

async function click(client, selector) {
  const clicked = await evaluate(
    client,
    `(() => { const el = document.querySelector(${JSON.stringify(selector)}); el?.click(); return Boolean(el); })()`,
  );
  if (!clicked) throw new Error(`Missing clickable element: ${selector}`);
}

function relevantErrors() {
  return browserErrors.filter((error) => !/favicon|ResizeObserver loop limit exceeded/i.test(error));
}

async function main() {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  const server = await startServer();
  let browser;

  try {
    browser = await openBrowser({ debugPort: 9225, logPath: CHROME_LOG, width: 390, height: 844 });
    const { client } = browser;

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
    client.on("Log.entryAdded", (event) => {
      if (event.entry?.level === "error") browserErrors.push(event.entry.text ?? "Browser log error");
    });
    client.on("Network.requestWillBeSent", (event) => {
      requestUrls.set(event.requestId, event.request?.url);
    });
    client.on("Network.loadingFailed", (event) => {
      const url = requestUrls.get(event.requestId);
      if (!url || event.canceled) return;
      try {
        if (new URL(url).origin === BASE_ORIGIN) failedRequests.push({ url, error: event.errorText });
      } catch {
        // Ignore browser-internal URLs.
      }
    });

    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
      screenWidth: 390,
      screenHeight: 844,
    });
    await client.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });

    await openHome(client);
    await click(client, '[data-testid="hero-primary-cta"]');
    await waitForExpression(client, `location.pathname === '/products'`);
    const primary = await evaluate(client, `({ pathname: location.pathname, search: location.search })`);
    record("Hero CTA navigation", primary.pathname === "/products", primary);

    await sleep(600);
    const focus = await evaluate(
      client,
      `({ id: document.activeElement?.id, tag: document.activeElement?.tagName, withinMain: Boolean(document.getElementById('main-content')?.contains(document.activeElement)) })`,
    );
    record(
      "Route focus after navigation",
      focus.id === "main-content" || (focus.withinMain && focus.tag !== "BODY"),
      focus,
    );

    await openHome(client);
    await click(client, '[data-testid="hero-secondary-cta"]');
    await waitForExpression(client, `location.pathname === '/brands'`);
    record("Secondary CTA navigation", (await evaluate(client, `location.pathname`)) === "/brands", {
      pathname: await evaluate(client, `location.pathname`),
    });

    await openHome(client);
    const railBefore = await evaluate(
      client,
      `(() => { const rail = document.querySelector('[data-testid="home-product-rail"]'); rail.focus(); return { left: rail.scrollLeft, scrollWidth: rail.scrollWidth, clientWidth: rail.clientWidth, direction: getComputedStyle(rail).direction, active: document.activeElement === rail }; })()`,
    );
    await evaluate(
      client,
      `document.querySelector('[data-testid="home-product-rail"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))`,
    );
    await sleep(500);
    const railAfter = await evaluate(client, `document.querySelector('[data-testid="home-product-rail"]')?.scrollLeft`);
    record(
      "Product rail keyboard behavior",
      railBefore.active && railBefore.scrollWidth > railBefore.clientWidth && railAfter !== railBefore.left,
      { ...railBefore, after: railAfter },
    );
    record(
      "RTL horizontal scroll",
      railBefore.direction === "rtl" && railBefore.scrollWidth > railBefore.clientWidth,
      railBefore,
    );

    await openHome(client);
    await click(client, '[data-testid="home-category-running"]');
    await waitForExpression(
      client,
      `location.pathname === '/products' && new URLSearchParams(location.search).get('category') === 'running'`,
    );
    const category = await evaluate(
      client,
      `({ pathname: location.pathname, value: new URLSearchParams(location.search).get('category') })`,
    );
    record("Category CTA", category.pathname === "/products" && category.value === "running", category);

    await openHome(client);
    await click(client, '[data-testid="home-brand-link-first"]');
    await waitForExpression(
      client,
      `location.pathname === '/products' && Boolean(new URLSearchParams(location.search).get('brand'))`,
    );
    const brand = await evaluate(
      client,
      `({ pathname: location.pathname, value: new URLSearchParams(location.search).get('brand') })`,
    );
    record("Brand link", brand.pathname === "/products" && Boolean(brand.value), brand);

    await openHome(client);
    await evaluate(
      client,
      `document.querySelector('[data-testid="home-product-image"]')?.dispatchEvent(new Event('error'))`,
    );
    await waitForExpression(
      client,
      `Boolean(document.querySelector('[data-testid="home-featured-card-first"] [data-image-fallback="true"]'))`,
    );
    const fallback = await evaluate(
      client,
      `document.querySelector('[data-testid="home-featured-card-first"] [data-image-fallback="true"]')?.getAttribute('aria-label')`,
    );
    record("Image fallback", Boolean(fallback), { ariaLabel: fallback });

    await client.send("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await openHome(client);
    const reduced = await evaluate(
      client,
      `({ media: matchMedia('(prefers-reduced-motion: reduce)').matches, poster: Boolean(document.querySelector('[data-testid="hero-poster"]')), model: Boolean(document.querySelector('[data-testid="hero-model-viewer"]')) })`,
    );
    record("Reduced motion", reduced.media && reduced.poster && !reduced.model, reduced);

    const targets = await evaluate(
      client,
      `([...document.querySelectorAll('[data-f3-touch-target="true"]')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).map((el) => { const r = el.getBoundingClientRect(); return { label: el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 40), width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10 }; }))`,
    );
    record(
      "Mobile touch behavior",
      targets.length >= 8 && targets.every((target) => target.width >= 44 && target.height >= 44),
      targets,
    );

    const errors = relevantErrors();
    const hydration = errors.filter((error) => /hydration|hydrated|server rendered html|did not match/i.test(error));
    const runtime = errors.filter((error) => /uncaught|typeerror|referenceerror|syntaxerror/i.test(error));
    record("No hydration mismatch", hydration.length === 0, { hydration });
    record("No runtime exception", runtime.length === 0, { runtime, errors });
    record("No same-origin network failure", failedRequests.length === 0, { failedRequests });

    const report = {
      schemaVersion: 1,
      audit: "f3-homepage-behavior",
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      viewport: { width: 390, height: 844, touch: true },
      pass: results.every((result) => result.pass),
      totals: {
        tests: results.length,
        passed: results.filter((result) => result.pass).length,
        failed: results.filter((result) => !result.pass).length,
      },
      results,
      browserErrors: errors,
      failedRequests,
    };
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report.totals));
    process.exitCode = report.pass ? 0 : 1;
  } finally {
    if (browser) await browser.close();
    await stop(server.child);
    if (server.log !== null) fs.closeSync(server.log);
  }
}

main().catch((error) => {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  const report = {
    schemaVersion: 1,
    audit: "f3-homepage-behavior",
    generatedAt: new Date().toISOString(),
    pass: false,
    fatalError: error instanceof Error ? (error.stack ?? error.message) : String(error),
    results,
  };
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.error(report.fatalError);
  process.exitCode = 1;
});

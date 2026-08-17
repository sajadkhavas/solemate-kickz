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
const PORT = 4176;
const BASE_URL = process.env.F3_VISUAL_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const OUTPUT = path.join(ROOT, "artifacts/visual-qa/f3-homepage");
const REPORT_PATH = path.join(ROOT, "artifacts/visual-qa/f3-homepage.json");
const SERVER_LOG = path.join(ROOT, "artifacts/runtime/f3-visual-server.txt");
const CHROME_LOG = path.join(ROOT, "artifacts/runtime/f3-visual-chrome.txt");
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
].map(([width, height]) => ({ name: `${width}x${height}`, width, height }));
const CHECKPOINTS = [
  ["fold", null],
  ["hero", '[data-testid="home-hero"]'],
  ["quick-shop", '[data-testid="home-quick-shop"]'],
  ["products", '[data-testid="home-featured"]'],
  ["merchandising", '[data-testid="home-merchandising"]'],
  ["brands", '[data-testid="home-brands"]'],
  ["editorial", '[data-testid="home-editorial"]'],
  ["end", '[data-testid="home-final-cta"]'],
];

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
  if (process.env.F3_VISUAL_BASE_URL) return { child: null, log: null };
  fs.mkdirSync(path.dirname(SERVER_LOG), { recursive: true });
  const log = fs.openSync(SERVER_LOG, "w");
  const child = spawn("bun", ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(PORT)], {
    cwd: ROOT,
    stdio: ["ignore", log, log],
    env: process.env,
  });
  await waitForHttp(BASE_URL, 60_000);
  return { child, log };
}

async function setViewport(client, viewport) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width < 768,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
  });
  await client.send("Emulation.setTouchEmulationEnabled", {
    enabled: viewport.width < 768,
    maxTouchPoints: viewport.width < 768 ? 5 : 1,
  });
}

async function openHome(client) {
  await navigate(client, `${BASE_URL}/`);
  await waitForExpression(client, `document.querySelector('[data-testid="home-main"]')`);
  await sleep(500);
}

async function screenshot(client, filePath) {
  const capture = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  fs.writeFileSync(filePath, Buffer.from(capture.data, "base64"));
}

async function inspect(client) {
  return evaluate(
    client,
    `(() => {
      const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };
      const documentWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0);
      const touchTargets = [...document.querySelectorAll('[data-f3-touch-target="true"]')]
        .filter(visible)
        .map((el) => { const r = el.getBoundingClientRect(); return { name: el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 50), width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10 }; });
      const sections = ['home-hero','home-quick-shop','home-featured','home-merchandising','home-categories','home-brands','home-editorial','home-trust','home-final-cta'];
      const heroCta = document.querySelector('[data-testid="hero-primary-cta"]')?.getBoundingClientRect();
      const fixed = [...document.querySelectorAll('header, nav')].filter((el) => ['fixed','sticky'].includes(getComputedStyle(el).position) && visible(el)).map((el) => { const r = el.getBoundingClientRect(); return { bottom: r.bottom, top: r.top }; });
      return {
        viewport: { width: innerWidth, height: innerHeight },
        dir: document.documentElement.dir || getComputedStyle(document.documentElement).direction,
        h1: document.querySelectorAll('h1').length,
        sectionPresence: Object.fromEntries(sections.map((name) => [name, Boolean(document.querySelector('[data-testid="' + name + '"]'))])),
        horizontalOverflow: documentWidth > innerWidth + 1,
        documentWidth,
        touchTargets,
        undersized: touchTargets.filter((target) => target.width < 44 || target.height < 44),
        heroCtaVisible: Boolean(heroCta && heroCta.width > 0 && heroCta.height > 0),
        fixedOverlap: Boolean(heroCta && fixed.some((item) => heroCta.top < item.bottom && heroCta.bottom > item.top)),
        heroPoster: Boolean(document.querySelector('[data-testid="hero-poster"]')),
        imageFallbacks: document.querySelectorAll('[data-image-fallback="true"]').length,
      };
    })()`,
  );
}

async function main() {
  fs.rmSync(OUTPUT, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT, { recursive: true });
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  const server = await startServer();
  let browser;
  const events = [];
  const report = {
    schemaVersion: 1,
    audit: "f3-homepage-visual-qa",
    generatedAt: new Date().toISOString(),
    viewports: VIEWPORTS,
    results: [],
    zoom200: null,
    reducedMotion: null,
    criticalFindings: [],
    limitations: [
      "Automated screenshots do not replace physical Persian typography, touch, or screen-reader review.",
      "The optional 3D model receives only composition and fallback coverage in F3.",
    ],
  };

  try {
    browser = await openBrowser({ debugPort: 9226, logPath: CHROME_LOG, width: 1280, height: 800 });
    const { client } = browser;
    client.on("Runtime.exceptionThrown", (event) => {
      events.push(
        event.exceptionDetails?.exception?.description ??
          event.exceptionDetails?.text ??
          "Runtime exception",
      );
    });
    client.on("Runtime.consoleAPICalled", (event) => {
      if (event.type === "error") events.push(event.args.map(serialiseArgument).join(" "));
    });
    client.on("Log.entryAdded", (event) => {
      if (event.entry?.level === "error") events.push(event.entry.text ?? "Browser log error");
    });

    await client.send("Emulation.setEmulatedMedia", { media: "screen", features: [] });
    for (const viewport of VIEWPORTS) {
      await setViewport(client, viewport);
      await openHome(client);
      const inspection = await inspect(client);
      report.results.push({ viewport: viewport.name, inspection, screenshots: [] });
      const current = report.results.at(-1);

      if (inspection.dir !== "rtl")
        report.criticalFindings.push({
          viewport: viewport.name,
          type: "direction",
          detail: inspection.dir,
        });
      if (inspection.h1 !== 1)
        report.criticalFindings.push({
          viewport: viewport.name,
          type: "h1",
          detail: inspection.h1,
        });
      if (inspection.horizontalOverflow)
        report.criticalFindings.push({
          viewport: viewport.name,
          type: "horizontal-overflow",
          detail: inspection.documentWidth,
        });
      if (inspection.undersized.length)
        report.criticalFindings.push({
          viewport: viewport.name,
          type: "touch-target",
          detail: inspection.undersized,
        });
      if (!inspection.heroCtaVisible || inspection.fixedOverlap)
        report.criticalFindings.push({
          viewport: viewport.name,
          type: "hero-cta",
          detail: inspection,
        });
      if (Object.values(inspection.sectionPresence).some((present) => !present))
        report.criticalFindings.push({
          viewport: viewport.name,
          type: "missing-section",
          detail: inspection.sectionPresence,
        });
      if (!inspection.heroPoster)
        report.criticalFindings.push({
          viewport: viewport.name,
          type: "hero-poster",
          detail: false,
        });

      for (const [name, selector] of CHECKPOINTS) {
        if (selector) {
          await evaluate(
            client,
            `document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({ block: 'start' }); true`,
          );
        } else {
          await evaluate(client, `scrollTo(0, 0); true`);
        }
        await sleep(150);
        const file = `${viewport.name}-${name}.png`;
        await screenshot(client, path.join(OUTPUT, file));
        current.screenshots.push(file);
      }
    }

    await setViewport(client, { width: 720, height: 450 });
    await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
    await openHome(client);
    report.zoom200 = await evaluate(
      client,
      `({ scale: visualViewport?.scale, h1: document.querySelectorAll('h1').length, heroCta: Boolean(document.querySelector('[data-testid="hero-primary-cta"]')), finalCta: Boolean(document.querySelector('[data-testid="home-final-cta"]')) })`,
    );
    await screenshot(client, path.join(OUTPUT, "zoom-200.png"));
    if (report.zoom200.h1 !== 1 || !report.zoom200.heroCta || !report.zoom200.finalCta) {
      report.criticalFindings.push({ type: "zoom-200", detail: report.zoom200 });
    }
    await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });

    await client.send("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await setViewport(client, { width: 390, height: 844 });
    await openHome(client);
    report.reducedMotion = await evaluate(
      client,
      `({ media: matchMedia('(prefers-reduced-motion: reduce)').matches, poster: Boolean(document.querySelector('[data-testid="hero-poster"]')), model: Boolean(document.querySelector('[data-testid="hero-model-viewer"]')) })`,
    );
    await screenshot(client, path.join(OUTPUT, "reduced-motion.png"));
    if (!report.reducedMotion.media || !report.reducedMotion.poster || report.reducedMotion.model) {
      report.criticalFindings.push({ type: "reduced-motion", detail: report.reducedMotion });
    }

    const relevantEvents = events.filter(
      (event) => !/favicon|ResizeObserver loop limit exceeded/i.test(event),
    );
    if (
      relevantEvents.some((event) =>
        /uncaught|typeerror|referenceerror|syntaxerror|hydration|did not match/i.test(event),
      )
    ) {
      report.criticalFindings.push({ type: "runtime", detail: relevantEvents });
    }
    report.events = relevantEvents;
    report.screenshotCount =
      report.results.reduce((sum, result) => sum + result.screenshots.length, 0) + 2;
    report.pass = report.criticalFindings.length === 0;
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    console.log(
      JSON.stringify({
        pass: report.pass,
        screenshots: report.screenshotCount,
        critical: report.criticalFindings.length,
      }),
    );
    process.exitCode = report.pass ? 0 : 1;
  } finally {
    if (browser) await browser.close();
    await stop(server.child);
    if (server.log !== null) fs.closeSync(server.log);
  }
}

main().catch((error) => {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  const fatal = {
    schemaVersion: 1,
    audit: "f3-homepage-visual-qa",
    generatedAt: new Date().toISOString(),
    pass: false,
    fatalError: error instanceof Error ? (error.stack ?? error.message) : String(error),
  };
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(fatal, null, 2)}\n`);
  console.error(fatal.fatalError);
  process.exitCode = 1;
});

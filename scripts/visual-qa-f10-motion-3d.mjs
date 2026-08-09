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
import { withF10Server } from "./f10-browser-runner.mjs";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "artifacts/visual-qa/f10-motion-3d");
const REPORT = path.join(OUTPUT, "f10-motion-3d.json");
const CHROME_LOG = path.join(ROOT, "artifacts/runtime/f10-motion-3d-visual-chrome.txt");
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
  value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

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

async function inspect(client) {
  return evaluate(
    client,
    `(() => {
      const main = document.querySelector('main') || document.querySelector('#main-content');
      const controls = main ? [...main.querySelectorAll('button,a[href],input,textarea,select,summary')].filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      }) : [];
      const belowAbsoluteMinimum = controls.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width < 24 || rect.height < 24;
      }).slice(0, 20).map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, label: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 50), width: Math.round(rect.width), height: Math.round(rect.height) };
      });
      const belowPreferredTouch = controls.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      }).length;
      const clippedControls = controls.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > innerWidth + 1;
      }).slice(0, 20).map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, label: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 50), left: Math.round(rect.left), right: Math.round(rect.right) };
      });
      const brokenImages = main ? [...main.querySelectorAll('img')].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.getAttribute('src')) : [];
      const unnamedButtons = controls.filter((element) => element.tagName === 'BUTTON' && !((element.getAttribute('aria-label') || element.textContent || '').trim())).length;
      const runningInfinite = document.getAnimations().filter((animation) => {
        const timing = animation.effect?.getComputedTiming?.();
        return animation.playState === 'running' && timing?.iterations === Infinity;
      }).length;
      const focusTarget = controls.find((element) => element instanceof HTMLElement);
      let focusProbe = true;
      if (focusTarget instanceof HTMLElement) {
        focusTarget.focus({ preventScroll: true });
        focusProbe = document.activeElement === focusTarget;
      }
      return {
        viewport: { width: innerWidth, height: innerHeight },
        documentWidth: document.documentElement.scrollWidth,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        h1: document.querySelectorAll('main h1').length,
        belowAbsoluteMinimum,
        belowPreferredTouch,
        clippedControls,
        brokenImages,
        unnamedButtons,
        runningInfinite,
        focusProbe,
        customCursor: Boolean(document.querySelector('[data-foundation-cursor]')),
        bodyCursor: getComputedStyle(document.body).cursor,
        modelMounted: Boolean(document.querySelector('[data-testid="hero-model-viewer"]')),
      };
    })()`,
  );
}

async function capture(client, baseUrl, name, url, width, height, options = {}) {
  await viewport(client, width, height, options.mobile ?? width < 768);
  await navigate(client, `${baseUrl}${url}`);
  await waitForExpression(
    client,
    `document.querySelector('main h1') || document.querySelector('[data-testid="home-hero"] h1')`,
  );
  await waitForExpression(client, `document.fonts.status === 'loaded'`);
  await sleep(options.wait ?? 450);
  const metrics = await inspect(client);
  const file = await screenshot(client, `${name}-${width}x${height}`);
  const findings = [];
  if (metrics.overflow) findings.push("horizontal-overflow");
  if (metrics.h1 !== 1) findings.push(`h1-count-${metrics.h1}`);
  if (metrics.unnamedButtons) findings.push(`unnamed-buttons-${metrics.unnamedButtons}`);
  if (metrics.belowAbsoluteMinimum.length)
    findings.push(`targets-below-24-${metrics.belowAbsoluteMinimum.length}`);
  if (metrics.clippedControls.length)
    findings.push(`horizontally-clipped-controls-${metrics.clippedControls.length}`);
  if (!metrics.focusProbe) findings.push("focus-probe-failed");
  if (metrics.customCursor || metrics.bodyCursor === "none")
    findings.push("custom-pointer-interference");
  if (name === "home" && metrics.modelMounted) findings.push("eager-3d-model");
  if (name.startsWith("home") && metrics.runningInfinite)
    findings.push(`continuous-animations-${metrics.runningInfinite}`);
  if (findings.length) criticalFindings.push({ name, width, height, findings, metrics });
  captures.push({ name, url, width, height, file, metrics, findings });
}

async function run(baseUrl) {
  fs.rmSync(OUTPUT, { recursive: true, force: true });
  const browser = await openBrowser({ debugPort: 9261, logPath: CHROME_LOG });
  const { client } = browser;
  await client.send("Network.enable");

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
      await capture(client, baseUrl, "home", "/", width, height);
    }

    await capture(client, baseUrl, "products-mobile", "/products", 390, 844);
    await capture(client, baseUrl, "products-desktop", "/products", 1440, 900);
    await capture(client, baseUrl, "pdp-mobile", "/product/1", 390, 844);
    await capture(client, baseUrl, "pdp-desktop", "/product/1", 1440, 900);
    await capture(client, baseUrl, "cart", "/cart", 390, 844);
    await capture(client, baseUrl, "checkout", "/checkout", 390, 844);
    await capture(client, baseUrl, "wishlist", "/wishlist", 390, 844);
    await capture(client, baseUrl, "account", "/account", 390, 844);
    await capture(client, baseUrl, "brands", "/brands", 390, 844);
    await capture(client, baseUrl, "about", "/about", 390, 844);

    await client.send("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await capture(client, baseUrl, "reduced-motion", "/", 390, 844);
    const reduced = await inspect(client);
    if (reduced.modelMounted || reduced.runningInfinite) {
      criticalFindings.push({
        name: "reduced-motion-runtime",
        findings: ["reduced-motion-still-running"],
        metrics: reduced,
      });
    }

    await client.send("Emulation.setEmulatedMedia", { media: "screen", features: [] });
    await client.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await capture(client, baseUrl, "touch", "/", 390, 844, { mobile: true });
    await client.send("Emulation.setTouchEmulationEnabled", { enabled: false });

    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await capture(client, baseUrl, "slow-device", "/", 390, 844, { mobile: true, wait: 700 });
    await client.send("Emulation.setCPUThrottlingRate", { rate: 1 });

    await viewport(client, 1440, 900, false);
    await navigate(client, `${baseUrl}/`);
    await waitForExpression(client, `document.querySelector('[data-testid="home-hero"]')`);
    await evaluate(
      client,
      `window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }); true`,
    );
    await sleep(500);
    const offscreenInfinite = await evaluate(
      client,
      `document.getAnimations().filter((animation) => {
        const target = animation.effect?.target;
        const timing = animation.effect?.getComputedTiming?.();
        if (!(target instanceof Element) || animation.playState !== 'running' || timing?.iterations !== Infinity) return false;
        const rect = target.getBoundingClientRect();
        return rect.bottom < 0 || rect.top > innerHeight;
      }).length`,
    );
    if (offscreenInfinite > 0) {
      criticalFindings.push({
        name: "offscreen-infinite-animations",
        findings: [`offscreen-infinite-animations-${offscreenInfinite}`],
      });
    }
    captures.push({ name: "offscreen-infinite-animations", count: offscreenInfinite });
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
    suite: "f10-motion-3d-visual",
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

withF10Server(
  {
    envName: "F10_VISUAL_BASE_URL",
    port: 4199,
    logPath: "artifacts/runtime/f10-motion-3d-visual-server.txt",
  },
  run,
).catch((error) => {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(
    REPORT,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        suite: "f10-motion-3d-visual",
        pass: false,
        fatalError: error instanceof Error ? (error.stack ?? error.message) : String(error),
      },
      null,
      2,
    )}\n`,
  );
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});

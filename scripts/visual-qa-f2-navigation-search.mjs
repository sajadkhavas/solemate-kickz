import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  evaluate,
  navigate,
  openBrowser,
  serialiseArgument,
  sleep,
  waitForExpression,
  waitForHttp,
} from "./browser-harness.mjs";
import { delegateToDevServer } from "./f2-browser-runner.mjs";

const ROOT = process.cwd();
const ENV_NAME = "F2_VISUAL_BASE_URL";
const BASE_URL = process.env[ENV_NAME] ?? "http://127.0.0.1:4183";
const OUTPUT_DIR = path.join(ROOT, "artifacts/visual-qa/f2-navigation-search");
const REPORT_PATH = path.join(OUTPUT_DIR, "f2-navigation-search.json");
const LOG_PATH = path.join(ROOT, "artifacts/runtime/f2-visual-chrome.txt");
const ROUTES = ["/", "/products", "/product/1", "/cart", "/auth"];
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
const results = [];
const criticalFindings = [];
const browserEvents = [];

const safe = (value) => value.replaceAll(/[^a-zA-Z0-9._-]/g, "-");

async function configureViewport(client, viewport) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
  });
  await client.send("Emulation.setTouchEmulationEnabled", {
    enabled: viewport.width < 768,
    maxTouchPoints: viewport.width < 768 ? 5 : 1,
  });
}

async function visibleClick(client, selector) {
  const result = await evaluate(
    client,
    `(() => {
      const elements = [...document.querySelectorAll(${JSON.stringify(selector)})];
      const target = elements.find((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      });
      target?.click();
      return Boolean(target);
    })()`,
  );
  if (!result) throw new Error(`Visible control missing: ${selector}`);
}

async function setInput(client, value) {
  await evaluate(
    client,
    `(() => {
      const input = document.querySelector('[data-testid="search-input"]');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(input, ${JSON.stringify(value)});
      input?.dispatchEvent(new Event('input', { bubbles: true }));
      return input?.value;
    })()`,
  );
}

const INSPECT = `(() => {
  const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  };
  const controls = [...document.querySelectorAll('header a[href], header button, nav.fixed a[href], nav.fixed button, [role="dialog"] a[href], [role="dialog"] button, [role="dialog"] input')]
    .filter(visible)
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        label: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 80),
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
      };
    });
  const header = document.querySelector('[data-testid="global-header"]');
  const headerRect = header?.getBoundingClientRect();
  const dialog = document.querySelector('[role="dialog"]');
  const dialogRect = dialog?.getBoundingClientRect();
  const documentWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0);
  return {
    lang: document.documentElement.lang,
    dir: document.documentElement.dir || getComputedStyle(document.documentElement).direction,
    viewport: { width: innerWidth, height: innerHeight },
    documentWidth,
    horizontalOverflow: documentWidth > innerWidth + 1,
    header: headerRect ? { top: headerRect.top, bottom: headerRect.bottom, width: headerRect.width, height: headerRect.height, scrolled: header.dataset.scrolled } : null,
    dialog: dialogRect ? { left: dialogRect.left, right: dialogRect.right, top: dialogRect.top, bottom: dialogRect.bottom, width: dialogRect.width, height: dialogRect.height } : null,
    bodyOverflow: getComputedStyle(document.body).overflow,
    controlsBelow44: controls.filter((control) => control.width < 44 || control.height < 44),
    activeElement: document.activeElement ? { tag: document.activeElement.tagName.toLowerCase(), label: document.activeElement.getAttribute('aria-label'), testid: document.activeElement.dataset.testid } : null,
  };
})()`;

async function capture(client, { route, viewport, state, eventStart }) {
  await sleep(250);
  const inspection = await evaluate(client, INSPECT);
  const shot = await client.send("Page.captureScreenshot", {
    format: "jpeg",
    quality: 76,
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const relative = `screenshots/${safe(viewport.name)}/${safe(route === "/" ? "home" : route.slice(1))}-${safe(state)}.jpg`;
  const absolute = path.join(OUTPUT_DIR, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, Buffer.from(shot.data, "base64"));

  const events = browserEvents.slice(eventStart);
  const hydration = events.filter((entry) =>
    /hydration|server rendered html|did not match/i.test(entry.text),
  );
  const runtime = events.filter((entry) =>
    /uncaught|typeerror|referenceerror|syntaxerror/i.test(entry.text),
  );
  const result = {
    route,
    viewport: viewport.name,
    state,
    screenshot: relative,
    inspection,
    hydration,
    runtime,
  };
  results.push(result);

  const critical = (type, detail) =>
    criticalFindings.push({ type, route, viewport: viewport.name, state, detail });
  if (inspection.lang !== "fa" || inspection.dir !== "rtl")
    critical("document-direction", { lang: inspection.lang, dir: inspection.dir });
  if (
    inspection.viewport.width !== viewport.width ||
    inspection.viewport.height !== viewport.height
  )
    critical("viewport-mismatch", inspection.viewport);
  if (!inspection.header) critical("missing-header", null);
  if (inspection.horizontalOverflow)
    critical("horizontal-overflow", {
      documentWidth: inspection.documentWidth,
      viewportWidth: viewport.width,
    });
  if (inspection.controlsBelow44.length)
    critical("shared-touch-target", inspection.controlsBelow44);
  if (hydration.length) critical("hydration-warning", hydration);
  if (runtime.length) critical("runtime-error", runtime);
  if (inspection.dialog) {
    if (
      inspection.dialog.left < -1 ||
      inspection.dialog.right > viewport.width + 1 ||
      inspection.dialog.top < -1 ||
      inspection.dialog.bottom > viewport.height + 1
    ) {
      critical("dialog-outside-viewport", inspection.dialog);
    }
    if (inspection.bodyOverflow !== "hidden")
      critical("overlay-scroll-lock", inspection.bodyOverflow);
  }
}

async function main() {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await waitForHttp(BASE_URL);
  const browser = await openBrowser({ debugPort: 9233, logPath: LOG_PATH });
  const { client } = browser;

  client.on("Runtime.exceptionThrown", (event) => {
    browserEvents.push({
      source: "exception",
      text:
        event.exceptionDetails?.exception?.description ??
        event.exceptionDetails?.text ??
        "Runtime exception",
    });
  });
  client.on("Runtime.consoleAPICalled", (event) => {
    if (event.type === "error")
      browserEvents.push({ source: "console", text: event.args.map(serialiseArgument).join(" ") });
  });

  try {
    for (const viewport of VIEWPORTS) {
      await configureViewport(client, viewport);
      for (const route of ROUTES) {
        const eventStart = browserEvents.length;
        await navigate(client, `${BASE_URL}${route}`);
        await capture(client, { route, viewport, state: "header-closed", eventStart });
      }

      let eventStart = browserEvents.length;
      await navigate(client, `${BASE_URL}/`);
      await waitForExpression(
        client,
        `document.querySelector('[data-testid="global-header"]')?.dataset.hydrated === 'true'`,
      );
      await evaluate(
        client,
        `window.scrollTo(0, 900); window.dispatchEvent(new Event('scroll')); true`,
      );
      await waitForExpression(
        client,
        `document.querySelector('[data-testid="global-header"]')?.dataset.scrolled === 'true'`,
      );
      await capture(client, { route: "/", viewport, state: "header-scrolled", eventStart });

      if (viewport.width < 768) {
        eventStart = browserEvents.length;
        await navigate(client, `${BASE_URL}/`);
        await visibleClick(client, '[data-testid="mobile-menu-trigger"]');
        await waitForExpression(
          client,
          `document.querySelector('[data-testid="mobile-menu-content"]')`,
        );
        await capture(client, { route: "/", viewport, state: "mobile-menu-open", eventStart });
        await evaluate(
          client,
          `document.querySelector('[data-testid="mobile-menu-close"]')?.click(); true`,
        );
      }

      if (viewport.width >= 1024) {
        eventStart = browserEvents.length;
        await navigate(client, `${BASE_URL}/`);
        await visibleClick(client, '[data-testid="desktop-menu-trigger"]');
        await waitForExpression(
          client,
          `document.querySelector('[data-testid="desktop-menu-content"]')`,
        );
        await capture(client, { route: "/", viewport, state: "desktop-menu-open", eventStart });
        await client.send("Input.dispatchKeyEvent", {
          type: "keyDown",
          key: "Escape",
          code: "Escape",
          windowsVirtualKeyCode: 27,
        });
        await client.send("Input.dispatchKeyEvent", {
          type: "keyUp",
          key: "Escape",
          code: "Escape",
          windowsVirtualKeyCode: 27,
        });
      }

      for (const searchState of ["search-empty", "search-result", "search-no-result"]) {
        eventStart = browserEvents.length;
        await navigate(client, `${BASE_URL}/`);
        await visibleClick(client, '[data-search-trigger="true"]');
        await waitForExpression(client, `document.querySelector('[data-testid="search-dialog"]')`);
        if (searchState === "search-result") {
          await setInput(client, "Air Max");
          await waitForExpression(
            client,
            `document.querySelector('[data-testid="search-result"]')`,
          );
        } else if (searchState === "search-no-result") {
          await setInput(client, "NoSuchSoleModelXYZ");
          await waitForExpression(
            client,
            `document.querySelector('[data-testid="search-no-results"]')`,
          );
        }
        await capture(client, { route: "/", viewport, state: searchState, eventStart });
        await evaluate(
          client,
          `document.querySelector('[data-testid="search-close"]')?.click(); true`,
        );
      }
    }

    await configureViewport(client, { width: 390, height: 844 });
    await client.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await navigate(client, `${BASE_URL}/`);
    await visibleClick(client, '[data-testid="mobile-menu-trigger"]');
    await sleep(250);
    const reducedMotion = await evaluate(
      client,
      `({ matches: matchMedia('(prefers-reduced-motion: reduce)').matches, longTransformAnimations: document.getAnimations().filter((animation) => { const timing = animation.effect?.getComputedTiming(); const frames = animation.effect?.getKeyframes?.() || []; return (animation.playState === 'running' || animation.playState === 'pending') && frames.some((frame) => frame.transform && frame.transform !== 'none') && Number(timing?.duration || 0) > 20; }).length })`,
    );
    if (!reducedMotion.matches || reducedMotion.longTransformAnimations > 0)
      criticalFindings.push({ type: "reduced-motion", detail: reducedMotion });
    await client.send("Emulation.setEmulatedMedia", { features: [] });

    await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
    const zoom200 = [];
    for (const route of ROUTES) {
      await navigate(client, `${BASE_URL}${route}`);
      const zoom = await evaluate(
        client,
        `({ route: location.pathname, documentWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0), viewportWidth: innerWidth, overflow: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) > innerWidth + 1, header: Boolean(document.querySelector('[data-testid="global-header"]')) })`,
      );
      zoom200.push(zoom);
      if (zoom.overflow || !zoom.header)
        criticalFindings.push({ type: "zoom-200", route, detail: zoom });
    }
    await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });

    const report = {
      schemaVersion: 1,
      audit: "f2-navigation-search-visual-qa",
      generatedAt: new Date().toISOString(),
      routes: ROUTES,
      viewports: VIEWPORTS,
      summary: {
        screenshots: results.length,
        routes: ROUTES.length,
        viewports: VIEWPORTS.length,
        horizontalOverflowCases: results.filter((result) => result.inspection.horizontalOverflow)
          .length,
        hydrationWarningCases: results.filter((result) => result.hydration.length).length,
        runtimeErrorCases: results.filter((result) => result.runtime.length).length,
        touchTargetCases: results.filter((result) => result.inspection.controlsBelow44.length)
          .length,
        criticalFindings: criticalFindings.length,
      },
      zoom200,
      results,
      criticalFindings,
      pass: criticalFindings.length === 0,
    };
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report.summary));
    console.log(`F2 Visual QA report: ${path.relative(ROOT, REPORT_PATH)}`);
    if (criticalFindings.length) console.error(JSON.stringify(criticalFindings, null, 2));
    if (!report.pass) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

const entryPath = fileURLToPath(import.meta.url);
const delegated = await delegateToDevServer({
  envName: ENV_NAME,
  port: 4183,
  entryPath,
  logName: "f2-visual-server.txt",
});

if (delegated !== null) {
  process.exitCode = delegated;
} else {
  main().catch((error) => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(
      REPORT_PATH,
      `${JSON.stringify({ schemaVersion: 1, audit: "f2-navigation-search-visual-qa", generatedAt: new Date().toISOString(), pass: false, fatalError: error instanceof Error ? (error.stack ?? error.message) : String(error) }, null, 2)}\n`,
    );
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    process.exitCode = 1;
  });
}

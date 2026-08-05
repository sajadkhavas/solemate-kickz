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
import { withF8Server } from "./f8-browser-runner.mjs";

const ROOT = process.cwd();
const REPORT = path.join(ROOT, "artifacts/visual-qa/f8-content-pages.json");
const OUTPUT = path.join(ROOT, "artifacts/visual-qa/f8-content-pages/screenshots");
const LOG = path.join(ROOT, "artifacts/runtime/f8-visual-chrome.txt");
const ROUTES = ["/about", "/brands", "/auth"];
const VIEWPORTS = [
  [320, 568], [375, 812], [390, 844], [430, 932], [768, 1024],
  [1024, 768], [1280, 800], [1440, 900], [1920, 1080],
].map(([width, height]) => ({ name: `${width}x${height}`, width, height }));

const INSPECT = `(() => {
  const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  };
  const name = (element) => {
    if (element.getAttribute('aria-label')) return element.getAttribute('aria-label').trim();
    if (element instanceof HTMLInputElement && element.labels?.[0]) return element.labels[0].textContent.trim();
    return element.textContent?.trim() || '';
  };
  const controls = [...document.querySelectorAll('main a[href],main button,main input,main select,main textarea,main summary')]
    .filter((element) => visible(element) && !element.disabled && element.getAttribute('aria-disabled') !== 'true')
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return { tag: element.tagName.toLowerCase(), id: element.id || null, name: name(element), width: Math.round(rect.width), height: Math.round(rect.height) };
    });
  const width = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0);
  const h1 = [...document.querySelectorAll('main h1')].filter(visible);
  const main = document.querySelector('main');
  const active = document.activeElement;
  const activeStyle = active ? getComputedStyle(active) : null;
  return {
    title: document.title,
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    viewport: { width: innerWidth, height: innerHeight },
    documentWidth: width,
    horizontalOverflow: width > innerWidth + 1,
    mainVisible: Boolean(main && visible(main)),
    h1Count: h1.length,
    controls,
    targetsBelow44: controls.filter((item) => item.width < 44 || item.height < 44),
    missingNames: controls.filter((item) => !item.name),
    activeFocus: active ? { id: active.id || null, name: name(active), outline: activeStyle?.outlineStyle, outlineWidth: activeStyle?.outlineWidth } : null,
    fakeSuccess: /ورود موفق|ثبت‌نام موفق|خوش آمد/.test(document.body.textContent || ''),
    textLength: document.body.textContent?.trim().length || 0,
  };
})()`;

async function screenshot(client, name) {
  const image = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  fs.mkdirSync(OUTPUT, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT, `${name}.png`), Buffer.from(image.data, "base64"));
}

async function setValue(client, selector, value) {
  await evaluate(client, `(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    if (!(input instanceof HTMLInputElement)) return false;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
}

function critical(report, type, route, viewport, evidence) {
  report.criticalFindings.push({ type, route, viewport, evidence });
}

function assess(report, route, viewport, inspection) {
  if (inspection.horizontalOverflow) critical(report, "horizontal-overflow", route, viewport, inspection);
  if (!inspection.mainVisible) critical(report, "missing-main", route, viewport, inspection);
  if (inspection.h1Count !== 1) critical(report, "duplicate-or-missing-h1", route, viewport, inspection);
  if (inspection.targetsBelow44.length) critical(report, "touch-target-failure", route, viewport, inspection.targetsBelow44);
  if (inspection.missingNames.length) critical(report, "missing-accessible-name", route, viewport, inspection.missingNames);
  if (inspection.fakeSuccess) critical(report, "fake-success-state", route, viewport, inspection);
}

async function run(baseUrl) {
  fs.rmSync(path.dirname(REPORT), { recursive: true, force: true });
  const browser = await openBrowser({ debugPort: 9239, logPath: LOG });
  const { client } = browser;
  const browserEvents = [];
  client.on("Runtime.exceptionThrown", (event) => browserEvents.push(event.exceptionDetails?.exception?.description ?? event.exceptionDetails?.text ?? "Runtime exception"));
  client.on("Runtime.consoleAPICalled", (event) => {
    if (event.type === "error") browserEvents.push(event.args.map(serialiseArgument).join(" "));
  });

  const report = {
    schemaVersion: 1,
    audit: "f8-content-pages-visual-qa",
    generatedAt: new Date().toISOString(),
    routes: ROUTES,
    viewports: VIEWPORTS,
    defaultStates: [],
    zoom200: [],
    emptyAndErrorStates: [],
    keyboardFocus: [],
    longText: [],
    reducedMotion: [],
    browserEvents,
    criticalFindings: [],
    limitations: [
      "Automated screenshots do not replace human Persian typography review.",
      "Physical screen-reader, touch-device and virtual-keyboard certification remains F12 work.",
    ],
  };

  try {
    for (const viewport of VIEWPORTS) {
      await client.send("Emulation.setDeviceMetricsOverride", {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.width < 768,
        screenWidth: viewport.width,
        screenHeight: viewport.height,
      });
      for (const route of ROUTES) {
        await navigate(client, `${baseUrl}${route}`);
        await waitForExpression(client, `document.querySelector('main h1')`);
        await sleep(80);
        const inspection = await evaluate(client, INSPECT);
        report.defaultStates.push({ route, viewport: viewport.name, inspection });
        assess(report, route, viewport.name, inspection);
        await screenshot(client, `${route.slice(1)}-${viewport.name}`);
      }
    }

    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 640,
      height: 450,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: 640,
      screenHeight: 450,
    });
    for (const route of ROUTES) {
      await navigate(client, `${baseUrl}${route}`);
      await waitForExpression(client, `document.querySelector('main h1')`);
      const inspection = await evaluate(client, INSPECT);
      report.zoom200.push({ route, effectiveViewport: "640x450", inspection });
      assess(report, route, "200%-effective", inspection);
      await screenshot(client, `${route.slice(1)}-zoom-200`);
    }

    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
      screenWidth: 390,
      screenHeight: 844,
    });

    await navigate(client, `${baseUrl}/brands`);
    await setValue(client, "#brand-search", "__no_result__");
    await waitForExpression(client, `document.body.textContent.includes('برندی با این عبارت پیدا نشد')`);
    const brandEmpty = await evaluate(client, INSPECT);
    report.emptyAndErrorStates.push({ route: "/brands", state: "no-result", inspection: brandEmpty });
    assess(report, "/brands", "no-result", brandEmpty);
    await screenshot(client, "brands-no-result");

    await navigate(client, `${baseUrl}/auth`);
    await evaluate(client, `document.querySelector('[data-testid="auth-form"]')?.requestSubmit()`);
    await waitForExpression(client, `document.querySelectorAll('[role="alert"]').length >= 2`);
    const authError = await evaluate(client, INSPECT);
    report.emptyAndErrorStates.push({ route: "/auth", state: "validation-error", inspection: authError });
    assess(report, "/auth", "validation-error", authError);
    await screenshot(client, "auth-validation-error");

    for (const route of ROUTES) {
      await navigate(client, `${baseUrl}${route}`);
      await waitForExpression(client, `document.querySelector('main h1')`);
      await evaluate(client, `document.querySelector('main a[href],main button,main input')?.focus()`);
      const focus = await evaluate(client, INSPECT);
      report.keyboardFocus.push({ route, inspection: focus });
      if (!focus.activeFocus || focus.activeFocus.outline === "none" || focus.activeFocus.outlineWidth === "0px") {
        critical(report, "invisible-focus", route, "keyboard-focus", focus.activeFocus);
      }
      await screenshot(client, `${route.slice(1)}-focus`);
    }

    for (const route of ROUTES) {
      await navigate(client, `${baseUrl}${route}`);
      await evaluate(client, `(() => {
        const paragraph = document.querySelector('main p');
        if (paragraph) paragraph.textContent = 'متن فارسی طولانی برای بررسی شکست سطر و خوانایی در عرض باریک '.repeat(18);
      })()`);
      const longText = await evaluate(client, INSPECT);
      report.longText.push({ route, inspection: longText });
      assess(report, route, "long-text", longText);
    }

    await client.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    for (const route of ROUTES) {
      await navigate(client, `${baseUrl}${route}`);
      const reduced = await evaluate(client, `({ matches: matchMedia('(prefers-reduced-motion: reduce)').matches, animations: document.getAnimations().filter((animation) => animation.playState === 'running').length })`);
      report.reducedMotion.push({ route, ...reduced });
      if (!reduced.matches) critical(report, "reduced-motion-not-applied", route, "reduced-motion", reduced);
    }

    const runtime = browserEvents.filter((error) => /uncaught|hydration|typeerror|referenceerror|syntaxerror|did not match/i.test(error));
    if (runtime.length) critical(report, "runtime-or-hydration-error", "all", "all", runtime);
  } finally {
    await browser.close();
  }

  report.pass = report.criticalFindings.length === 0;
  report.summary = { critical: report.criticalFindings.length, defaultCaptures: report.defaultStates.length };
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary));
  if (!report.pass) process.exitCode = 1;
}

withF8Server(
  { envName: "F8_VISUAL_BASE_URL", port: 4176, logPath: "artifacts/runtime/f8-visual-server.txt" },
  run,
).catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});

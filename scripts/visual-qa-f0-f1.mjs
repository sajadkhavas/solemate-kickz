import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  evaluate,
  navigate,
  openBrowser,
  serialiseArgument,
  sleep,
  waitForHttp,
} from "./browser-harness.mjs";

const ROOT = process.cwd();
const BASELINE = "137344f1d89373a55e3bf4bb4d82b48d8247b45f";
const BASE_URL = process.env.VISUAL_QA_BASE_URL ?? "http://127.0.0.1:4173";
const BASE_ORIGIN = new URL(BASE_URL).origin;
const OUTPUT_DIR = path.join(ROOT, "artifacts/visual-qa");
const REPORT_PATH = path.join(OUTPUT_DIR, "f0-f1-visual-qa.json");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.txt");
const LOG_PATH = path.join(ROOT, "artifacts/runtime/visual-chrome.txt");

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

const ROUTES = [
  { name: "home", path: "/", owner: "F3", source: "src/routes/index.tsx" },
  { name: "products", path: "/products", owner: "F4/F5", source: "src/routes/products.tsx" },
  { name: "product", path: "/product/1", owner: "F6", source: "src/routes/product.$id.tsx" },
  { name: "cart", path: "/cart", owner: "F7", source: "src/routes/cart.tsx" },
  { name: "auth", path: "/auth", owner: "F8", source: "src/routes/auth.tsx" },
  { name: "brands", path: "/brands", owner: "F8", source: "src/routes/brands.tsx" },
  { name: "about", path: "/about", owner: "F8", source: "src/routes/about.tsx" },
  {
    name: "not-found",
    path: "/route-that-does-not-exist",
    owner: "F12",
    source: "src/routes/__root.tsx",
  },
];

const HYDRATION = /hydration|hydrated|server rendered html|did not match/i;
const RUNTIME = /uncaught|react\.children\.only|typeerror|referenceerror|syntaxerror/i;
const safe = (value) => value.replaceAll(/[^a-zA-Z0-9._-]/g, "-");

function baselineSource(relativePath) {
  const result = spawnSync("git", ["show", `${BASELINE}:${relativePath}`], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout : null;
}

function baselineEvidence(route, target) {
  const source = baselineSource(route.source);
  const token = target.className
    ?.split(/\s+/)
    .find((candidate) => candidate && !candidate.includes("[") && !candidate.includes(":"));
  return {
    baselineSource: route.source,
    baselinePresent: Boolean(source),
    selectorHint: token ?? null,
    selectorHintPresent: source && token ? source.includes(token) : Boolean(source),
  };
}

function sameOrigin(entry) {
  if (!entry.url) return true;
  try {
    return new URL(entry.url).origin === BASE_ORIGIN;
  } catch {
    return true;
  }
}

function expectedNotFound(entry, route) {
  if (route.name !== "not-found" || !entry.url) return false;
  try {
    return new URL(entry.url).pathname === route.path && /404/.test(entry.text);
  } catch {
    return false;
  }
}

const INSPECT = `(() => {
  const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  };
  const selector = (element) => {
    if (element.id) return '#' + CSS.escape(element.id);
    const testId = element.getAttribute('data-testid');
    if (testId) return '[data-testid="' + CSS.escape(testId) + '"]';
    const label = element.getAttribute('aria-label');
    if (label) return element.tagName.toLowerCase() + '[aria-label="' + label.replaceAll('"', '\\"') + '"]';
    const classes = typeof element.className === 'string' ? element.className.trim().split(/\\s+/).slice(0, 3) : [];
    return element.tagName.toLowerCase() + classes.map((item) => '.' + CSS.escape(item)).join('');
  };
  const shared = (element) => Boolean(element.closest('header, footer, [role="dialog"], [data-foundation-shared], nav.fixed, nav.sticky'));
  const controls = [...document.querySelectorAll('a[href], button, input, select, textarea, summary, [role="button"]')]
    .filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-disabled') !== 'true' && visible(element))
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        selector: selector(element),
        tag: element.tagName.toLowerCase(),
        name: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 80) || '',
        className: typeof element.className === 'string' ? element.className.slice(0, 180) : '',
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
        shared: shared(element),
      };
    });
  const width = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0);
  const offenders = [...document.querySelectorAll('body *')]
    .filter(visible)
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        selector: selector(element),
        className: typeof element.className === 'string' ? element.className.slice(0, 180) : '',
        left: Math.round(rect.left * 10) / 10,
        right: Math.round(rect.right * 10) / 10,
        width: Math.round(rect.width * 10) / 10,
      };
    })
    .filter((item) => item.left < -1 || item.right > innerWidth + 1)
    .slice(0, 20);
  const main = document.querySelector('main, [role="main"]');
  return {
    lang: document.documentElement.lang,
    dir: document.documentElement.dir || getComputedStyle(document.documentElement).direction,
    viewport: { width: innerWidth, height: innerHeight },
    documentWidth: width,
    horizontalOverflow: width > innerWidth + 1,
    overflowOffenders: offenders,
    main: main ? { tag: main.tagName.toLowerCase(), role: main.getAttribute('role') } : null,
    focusTargetCount: document.querySelectorAll('#main-content').length,
    targetsBelow24: controls.filter((item) => item.width < 24 || item.height < 24),
    sharedTargetsBelow44: controls.filter((item) => item.shared && (item.width < 44 || item.height < 44)),
    pageTargetsBelow44: controls.filter((item) => !item.shared && (item.width < 44 || item.height < 44)).slice(0, 30),
  };
})()`;

async function main() {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUTPUT_DIR, "screenshots"), { recursive: true });
  await waitForHttp(BASE_URL);
  const browser = await openBrowser({ debugPort: 9222, logPath: LOG_PATH });
  const { client } = browser;
  const events = [];

  client.on("Runtime.consoleAPICalled", (event) => {
    events.push({
      source: "console",
      level: event.type,
      text: event.args.map(serialiseArgument).join(" "),
    });
  });
  client.on("Runtime.exceptionThrown", (event) => {
    events.push({
      source: "exception",
      level: "error",
      text:
        event.exceptionDetails?.exception?.description ??
        event.exceptionDetails?.text ??
        "Runtime exception",
      url: event.exceptionDetails?.url,
    });
  });
  client.on("Log.entryAdded", (event) => {
    events.push({
      source: event.entry?.source ?? "log",
      level: event.entry?.level ?? "info",
      text: event.entry?.text ?? "",
      url: event.entry?.url,
    });
  });

  const report = {
    schemaVersion: 3,
    audit: "f0-f1-visual-qa",
    baseline: BASELINE,
    generatedAt: new Date().toISOString(),
    viewports: VIEWPORTS,
    routes: ROUTES,
    results: [],
    reducedMotion: null,
    zoom200: [],
    criticalFindings: [],
    deferredFindings: [],
    limitations: [
      "Automated screenshots do not replace human Persian typography review.",
      "Physical screen-reader and real touch-device verification remain F12 work.",
    ],
  };

  const critical = (type, route, viewport, detail) =>
    report.criticalFindings.push({
      type,
      route: route?.path,
      viewport: viewport?.name,
      detail,
    });

  try {
    for (const viewport of VIEWPORTS) {
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

      for (const route of ROUTES) {
        const start = events.length;
        await navigate(client, `${BASE_URL}${route.path}`);
        await sleep(500);
        const inspection = await evaluate(client, INSPECT);
        await evaluate(client, `document.body?.focus(); true`);
        const focusSamples = [];
        for (let index = 0; index < 5; index += 1) {
          await client.send("Input.dispatchKeyEvent", {
            type: "keyDown",
            key: "Tab",
            code: "Tab",
            windowsVirtualKeyCode: 9,
          });
          await client.send("Input.dispatchKeyEvent", {
            type: "keyUp",
            key: "Tab",
            code: "Tab",
            windowsVirtualKeyCode: 9,
          });
          focusSamples.push(
            await evaluate(
              client,
              `(() => {
                const element = document.activeElement;
                const style = element ? getComputedStyle(element) : null;
                return element ? { tag: element.tagName.toLowerCase(), name: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 80), outline: style.outlineStyle, outlineWidth: style.outlineWidth, boxShadow: style.boxShadow } : null;
              })()`,
            ),
          );
        }

        const image = await client.send("Page.captureScreenshot", {
          format: "jpeg",
          quality: 76,
          fromSurface: true,
          captureBeyondViewport: false,
        });
        const relative = `screenshots/${safe(viewport.name)}/${safe(route.name)}.jpg`;
        const absolute = path.join(OUTPUT_DIR, relative);
        fs.mkdirSync(path.dirname(absolute), { recursive: true });
        fs.writeFileSync(absolute, Buffer.from(image.data, "base64"));

        const routeEvents = events.slice(start);
        const hydrationWarnings = routeEvents.filter((entry) => HYDRATION.test(entry.text));
        const runtimeErrors = routeEvents.filter(
          (entry) =>
            entry.source === "exception" ||
            (entry.source !== "network" && entry.level === "error" && RUNTIME.test(entry.text)),
        );
        const networkErrors = routeEvents.filter(
          (entry) => entry.source === "network" && entry.level === "error",
        );
        const sameOriginErrors = networkErrors.filter(
          (entry) => sameOrigin(entry) && !expectedNotFound(entry, route),
        );
        const externalErrors = networkErrors.filter((entry) => !sameOrigin(entry));
        const visibleFocus = focusSamples.some(
          (sample) =>
            sample &&
            ((sample.outline !== "none" && sample.outlineWidth !== "0px") ||
              sample.boxShadow !== "none"),
        );

        report.results.push({
          route: route.path,
          viewport: viewport.name,
          owner: route.owner,
          screenshot: relative,
          inspection,
          hydrationWarnings,
          runtimeErrors,
          sameOriginErrors,
          externalErrors,
          focusSamples,
        });

        if (inspection.lang !== "fa" || inspection.dir !== "rtl") {
          critical("document-language-direction", route, viewport, {
            lang: inspection.lang,
            dir: inspection.dir,
          });
        }
        if (
          inspection.viewport.width !== viewport.width ||
          inspection.viewport.height !== viewport.height
        ) {
          critical("viewport-mismatch", route, viewport, {
            requested: viewport,
            actual: inspection.viewport,
          });
        }
        if (!inspection.main) critical("missing-main", route, viewport, null);
        if (inspection.focusTargetCount !== 1) {
          critical("invalid-focus-target-count", route, viewport, inspection.focusTargetCount);
        }
        if (inspection.horizontalOverflow) {
          critical("horizontal-overflow", route, viewport, {
            viewportWidth: viewport.width,
            documentWidth: inspection.documentWidth,
            offenders: inspection.overflowOffenders,
          });
        }
        if (hydrationWarnings.length) {
          critical("hydration-warning", route, viewport, hydrationWarnings);
        }
        if (runtimeErrors.length) critical("runtime-error", route, viewport, runtimeErrors);
        if (sameOriginErrors.length) {
          critical("same-origin-network-error", route, viewport, sameOriginErrors);
        }
        if (inspection.sharedTargetsBelow44.length) {
          critical("shared-touch-target", route, viewport, inspection.sharedTargetsBelow44);
        }
        if (!visibleFocus) {
          critical("keyboard-focus-not-visible", route, viewport, focusSamples);
        }

        for (const target of inspection.pageTargetsBelow44) {
          const evidence = baselineEvidence(route, target);
          const finding = {
            type: "page-touch-target",
            route: route.path,
            viewport: viewport.name,
            selector: target.selector,
            dimensions: { width: target.width, height: target.height },
            phaseOwner: route.owner,
            ...evidence,
          };
          if (evidence.baselinePresent) report.deferredFindings.push(finding);
          else critical("unverified-page-touch-target", route, viewport, finding);
        }
        for (const error of externalErrors) {
          report.deferredFindings.push({
            type: "external-network-error",
            route: route.path,
            viewport: viewport.name,
            phaseOwner: route.owner,
            detail: error,
          });
        }
      }
    }

    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: 390,
      screenHeight: 844,
    });
    await client.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await navigate(client, `${BASE_URL}/`);
    await sleep(300);
    report.reducedMotion = await evaluate(
      client,
      `(() => {
        const motionAnimations = document.getAnimations().filter((animation) => {
          const timing = animation.effect?.getComputedTiming();
          const frames = animation.effect?.getKeyframes?.() || [];
          const transforms = frames.some((frame) => frame.transform && frame.transform !== 'none');
          return timing?.iterations === Infinity || (transforms && Number(timing?.duration || 0) > 20);
        });
        const cursor = document.querySelector('[data-foundation-cursor]');
        return { matches: matchMedia('(prefers-reduced-motion: reduce)').matches, motionAnimations: motionAnimations.length, cursor: cursor ? getComputedStyle(cursor).display : null };
      })()`,
    );
    if (
      !report.reducedMotion.matches ||
      report.reducedMotion.motionAnimations > 0 ||
      ![null, "none"].includes(report.reducedMotion.cursor)
    ) {
      critical("reduced-motion", null, null, report.reducedMotion);
    }
    await client.send("Emulation.setEmulatedMedia", { features: [] });

    await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
    for (const route of ROUTES) {
      await navigate(client, `${BASE_URL}${route.path}`);
      await sleep(250);
      const zoom = await evaluate(
        client,
        `(() => ({ route: location.pathname, viewportWidth: innerWidth, documentWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0), horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) > innerWidth + 1, mainPresent: Boolean(document.querySelector('main, [role="main"]')) }))()`,
      );
      report.zoom200.push(zoom);
      if (zoom.horizontalOverflow || !zoom.mainPresent) {
        critical("zoom-200", route, null, zoom);
      }
    }
    await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });
  } finally {
    await browser.close();
  }

  report.summary = {
    screenshots: report.results.length,
    routes: ROUTES.length,
    viewports: VIEWPORTS.length,
    horizontalOverflowCases: report.results.filter((item) => item.inspection.horizontalOverflow)
      .length,
    hydrationWarningCases: report.results.filter((item) => item.hydrationWarnings.length).length,
    runtimeErrorCases: report.results.filter((item) => item.runtimeErrors.length).length,
    sameOriginNetworkErrorCases: report.results.filter((item) => item.sameOriginErrors.length)
      .length,
    externalNetworkErrorCases: report.results.filter((item) => item.externalErrors.length).length,
    targetsBelow24: report.results.reduce(
      (total, item) => total + item.inspection.targetsBelow24.length,
      0,
    ),
    sharedTargetsBelow44: report.results.reduce(
      (total, item) => total + item.inspection.sharedTargetsBelow44.length,
      0,
    ),
    deferredFindings: report.deferredFindings.length,
    foundationCriticalFindings: report.criticalFindings.length,
  };
  report.pass = report.criticalFindings.length === 0;

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(
    MANIFEST_PATH,
    `${report.results
      .map((item) => `${item.viewport}\t${item.route}\t${item.screenshot}`)
      .join("\n")}\n`,
  );
  console.log(JSON.stringify(report.summary));
  console.log(`Visual QA report: ${path.relative(ROOT, REPORT_PATH)}`);
  if (!report.pass) process.exitCode = 1;
}

main().catch((error) => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    REPORT_PATH,
    `${JSON.stringify(
      {
        schemaVersion: 3,
        audit: "f0-f1-visual-qa",
        baseline: BASELINE,
        generatedAt: new Date().toISOString(),
        pass: false,
        fatalError: error instanceof Error ? error.stack ?? error.message : String(error),
      },
      null,
      2,
    )}\n`,
  );
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});

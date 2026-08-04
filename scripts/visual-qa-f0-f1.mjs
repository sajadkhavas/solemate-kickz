import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const BASE_URL = process.env.VISUAL_QA_BASE_URL ?? "http://127.0.0.1:4173";
const BASE_ORIGIN = new URL(BASE_URL).origin;
const DEBUG_PORT = Number(process.env.CHROME_DEBUG_PORT ?? 9222);
const OUTPUT_DIR = path.join(ROOT, "artifacts/visual-qa");
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, "screenshots");
const REPORT_PATH = path.join(OUTPUT_DIR, "f0-f1-visual-qa.json");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.txt");
const CHROME_LOG_PATH = path.join(OUTPUT_DIR, "chrome.txt");

const VIEWPORTS = [
  { name: "320x568", width: 320, height: 568 },
  { name: "375x812", width: 375, height: 812 },
  { name: "390x844", width: 390, height: 844 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
];

const ROUTES = [
  { name: "home", path: "/" },
  { name: "products", path: "/products" },
  { name: "product", path: "/product/1" },
  { name: "cart", path: "/cart" },
  { name: "auth", path: "/auth" },
  { name: "brands", path: "/brands" },
  { name: "about", path: "/about" },
  { name: "not-found", path: "/route-that-does-not-exist" },
];

const HYDRATION_PATTERN = /hydration|hydrated|server rendered html|did not match/i;
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
  ].filter(Boolean);

  for (const candidate of candidates) {
    const result = spawnSync("bash", ["-lc", `command -v ${JSON.stringify(candidate)}`], {
      encoding: "utf8",
    });
    if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();
  }

  return null;
}

async function waitForEndpoint(url, timeout = 20_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // Chrome or the SSR server is still starting.
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.sequence = 0;
    this.pending = new Map();
    this.waiters = new Map();
    this.listeners = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });

    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result ?? {});
        return;
      }

      if (!message.method) return;
      for (const listener of this.listeners.get(message.method) ?? []) {
        listener(message.params ?? {});
      }
      const waiter = this.waiters.get(message.method)?.shift();
      if (waiter) waiter.resolve(message.params ?? {});
    });
  }

  send(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  waitFor(method, timeout = 15_000) {
    return new Promise((resolve, reject) => {
      const waiters = this.waiters.get(method) ?? [];
      const timer = setTimeout(() => {
        const current = this.waiters.get(method) ?? [];
        const index = current.findIndex((item) => item.resolve === wrappedResolve);
        if (index >= 0) current.splice(index, 1);
        reject(new Error(`Timed out waiting for CDP event ${method}`));
      }, timeout);

      const wrappedResolve = (value) => {
        clearTimeout(timer);
        resolve(value);
      };

      waiters.push({ resolve: wrappedResolve, reject });
      this.waiters.set(method, waiters);
    });
  }

  async close() {
    try {
      await this.send("Page.close");
    } catch {
      // Target may already be closed.
    }
    this.socket.close();
  }
}

function serialiseRemoteArgument(argument) {
  if ("value" in argument) return argument.value;
  return argument.description ?? argument.type;
}

function safeFilename(value) {
  return value.replaceAll(/[^a-zA-Z0-9._-]/g, "-");
}

function isSameOriginNetworkError(entry) {
  if (!entry.url) return true;
  try {
    return new URL(entry.url).origin === BASE_ORIGIN;
  } catch {
    return true;
  }
}

async function main() {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const chromeBinary = findChrome();
  if (!chromeBinary) throw new Error("Chrome/Chromium executable was not found on the runner.");

  await waitForEndpoint(BASE_URL, 30_000);

  const chromeLog = fs.openSync(CHROME_LOG_PATH, "w");
  const chrome = spawn(
    chromeBinary,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--hide-scrollbars",
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), "sole-chrome-"))}`,
      "--window-size=1280,800",
      "about:blank",
    ],
    { stdio: ["ignore", chromeLog, chromeLog] },
  );

  const report = {
    schemaVersion: 2,
    audit: "f0-f1-visual-qa",
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    chrome: chromeBinary,
    viewports: VIEWPORTS,
    routes: ROUTES,
    results: [],
    reducedMotion: null,
    zoom200: [],
    externalNetworkFindings: [],
    criticalFindings: [],
    limitations: [
      "Screenshots require human visual review for Persian line quality and aesthetic regressions.",
      "This automated pass does not replace testing with a physical screen reader or real touch device.",
      "External CDN failures are recorded separately because CI network policy can differ from production.",
    ],
  };

  try {
    await waitForEndpoint(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    const targetResponse = await fetch(
      `http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent("about:blank")}`,
      { method: "PUT" },
    );
    if (!targetResponse.ok) {
      throw new Error(`Could not create Chrome target: ${targetResponse.status}`);
    }
    const target = await targetResponse.json();
    const client = new CdpClient(target.webSocketDebuggerUrl);
    await client.connect();

    const consoleEvents = [];
    client.on("Runtime.consoleAPICalled", (event) => {
      consoleEvents.push({
        source: "console",
        level: event.type,
        text: event.args.map(serialiseRemoteArgument).join(" "),
      });
    });
    client.on("Runtime.exceptionThrown", (event) => {
      consoleEvents.push({
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
      consoleEvents.push({
        source: event.entry?.source ?? "log",
        level: event.entry?.level ?? "info",
        text: event.entry?.text ?? "",
        url: event.entry?.url,
      });
    });

    await Promise.all([
      client.send("Page.enable"),
      client.send("Runtime.enable"),
      client.send("Log.enable"),
      client.send("Network.enable"),
    ]);

    const inspectExpression = `(() => {
      const html = document.documentElement;
      const body = document.body;
      const main = document.querySelector('main, [role="main"]');
      const isVisible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      };
      const interactive = [...document.querySelectorAll('a[href], button, input, select, textarea, summary, [role="button"]')]
        .filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-disabled') !== 'true' && isVisible(element));
      const targets = interactive.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          name: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 80) || '',
          width: Math.round(rect.width * 10) / 10,
          height: Math.round(rect.height * 10) / 10,
        };
      });
      const clippedText = [...document.querySelectorAll('h1, h2, h3, p, a, button, label')]
        .filter(isVisible)
        .filter((element) => element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1)
        .slice(0, 20)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          text: element.textContent?.trim().slice(0, 100) || '',
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
          overflow: getComputedStyle(element).overflow,
          textOverflow: getComputedStyle(element).textOverflow,
        }));
      const documentWidth = Math.max(html.scrollWidth, body?.scrollWidth || 0);
      const overflowOffenders = [...document.querySelectorAll('body *')]
        .filter(isVisible)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            tag: element.tagName.toLowerCase(),
            id: element.id || '',
            className: typeof element.className === 'string' ? element.className.slice(0, 180) : '',
            left: Math.round(rect.left * 10) / 10,
            right: Math.round(rect.right * 10) / 10,
            width: Math.round(rect.width * 10) / 10,
            position: style.position,
            overflowX: style.overflowX,
          };
        })
        .filter((element) => element.left < -1 || element.right > innerWidth + 1)
        .slice(0, 30);
      return {
        url: location.href,
        title: document.title,
        lang: html.lang,
        dir: html.dir || getComputedStyle(html).direction,
        viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
        documentWidth,
        horizontalOverflow: documentWidth > innerWidth + 1,
        overflowOffenders,
        main: main ? {
          tag: main.tagName.toLowerCase(),
          id: main.id,
          role: main.getAttribute('role'),
          tabIndex: main.tabIndex,
        } : null,
        focusTargetCount: document.querySelectorAll('#main-content').length,
        interactiveCount: targets.length,
        targetsBelow24: targets.filter((target) => target.width < 24 || target.height < 24).slice(0, 30),
        targetsBelow44: targets.filter((target) => target.width < 44 || target.height < 44).slice(0, 30),
        clippedText,
        missingAlt: [...document.querySelectorAll('img:not([alt])')].length,
        imagesWithoutDimensions: [...document.images].filter((image) => !image.getAttribute('width') || !image.getAttribute('height')).length,
      };
    })()`;

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
        const consoleStart = consoleEvents.length;
        const loaded = client.waitFor("Page.loadEventFired", 20_000);
        const navigation = await client.send("Page.navigate", { url: `${BASE_URL}${route.path}` });
        if (navigation.errorText) throw new Error(`${route.path}: ${navigation.errorText}`);
        await loaded;
        await sleep(650);

        const inspection = await client.send("Runtime.evaluate", {
          expression: inspectExpression,
          returnByValue: true,
          awaitPromise: true,
        });

        await client.send("Runtime.evaluate", {
          expression: "document.body?.focus(); true",
          returnByValue: true,
        });

        const focusSamples = [];
        for (let tabIndex = 0; tabIndex < 5; tabIndex += 1) {
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
          const focused = await client.send("Runtime.evaluate", {
            expression: `(() => {
              const element = document.activeElement;
              if (!element) return null;
              const style = getComputedStyle(element);
              return {
                tag: element.tagName.toLowerCase(),
                name: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 80) || '',
                outlineStyle: style.outlineStyle,
                outlineWidth: style.outlineWidth,
                boxShadow: style.boxShadow,
              };
            })()`,
            returnByValue: true,
          });
          focusSamples.push(focused.result?.value ?? null);
        }

        const screenshot = await client.send("Page.captureScreenshot", {
          format: "jpeg",
          quality: 76,
          fromSurface: true,
          captureBeyondViewport: false,
        });
        const screenshotRelativePath = path.join(
          "screenshots",
          safeFilename(viewport.name),
          `${safeFilename(route.name)}.jpg`,
        );
        const screenshotPath = path.join(OUTPUT_DIR, screenshotRelativePath);
        fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
        fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, "base64"));

        const routeConsole = consoleEvents.slice(consoleStart);
        const hydrationWarnings = routeConsole.filter((entry) =>
          HYDRATION_PATTERN.test(entry.text),
        );
        const networkErrors = routeConsole.filter(
          (entry) => entry.source === "network" && entry.level === "error",
        );
        const criticalNetworkErrors = networkErrors.filter(isSameOriginNetworkError);
        const externalNetworkErrors = networkErrors.filter(
          (entry) => !isSameOriginNetworkError(entry),
        );
        const runtimeExceptions = routeConsole.filter(
          (entry) =>
            entry.source === "exception" ||
            (entry.source !== "network" &&
              entry.level === "error" &&
              !HYDRATION_PATTERN.test(entry.text)),
        );
        const result = {
          requestedViewport: viewport,
          viewport: viewport.name,
          route: route.path,
          screenshot: screenshotRelativePath.replaceAll(path.sep, "/"),
          inspection: inspection.result?.value ?? null,
          focusSamples,
          console: routeConsole.slice(0, 50),
          hydrationWarnings,
          runtimeExceptions,
          criticalNetworkErrors,
          externalNetworkErrors,
        };
        report.results.push(result);

        if (externalNetworkErrors.length > 0) {
          report.externalNetworkFindings.push({
            viewport: viewport.name,
            route: route.path,
            detail: externalNetworkErrors,
          });
        }
        if (result.inspection?.lang !== "fa" || result.inspection?.dir !== "rtl") {
          report.criticalFindings.push({
            type: "document-language-direction",
            viewport: viewport.name,
            route: route.path,
            detail: { lang: result.inspection?.lang, dir: result.inspection?.dir },
          });
        }
        if (
          result.inspection?.viewport?.width !== viewport.width ||
          result.inspection?.viewport?.height !== viewport.height
        ) {
          report.criticalFindings.push({
            type: "viewport-mismatch",
            viewport: viewport.name,
            route: route.path,
            detail: {
              requested: viewport,
              actual: result.inspection?.viewport,
            },
          });
        }
        if (!result.inspection?.main) {
          report.criticalFindings.push({
            type: "missing-main",
            viewport: viewport.name,
            route: route.path,
          });
        }
        if (result.inspection?.focusTargetCount !== 1) {
          report.criticalFindings.push({
            type: "invalid-focus-target-count",
            viewport: viewport.name,
            route: route.path,
            detail: { count: result.inspection?.focusTargetCount },
          });
        }
        if (result.inspection?.horizontalOverflow) {
          report.criticalFindings.push({
            type: "horizontal-overflow",
            viewport: viewport.name,
            route: route.path,
            detail: {
              viewportWidth: result.inspection.viewport?.width,
              documentWidth: result.inspection.documentWidth,
              offenders: result.inspection.overflowOffenders,
            },
          });
        }
        if (hydrationWarnings.length > 0) {
          report.criticalFindings.push({
            type: "hydration-warning",
            viewport: viewport.name,
            route: route.path,
            detail: hydrationWarnings,
          });
        }
        if (runtimeExceptions.length > 0) {
          report.criticalFindings.push({
            type: "runtime-error",
            viewport: viewport.name,
            route: route.path,
            detail: runtimeExceptions,
          });
        }
        if (criticalNetworkErrors.length > 0) {
          report.criticalFindings.push({
            type: "same-origin-network-error",
            viewport: viewport.name,
            route: route.path,
            detail: criticalNetworkErrors,
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
    {
      const loaded = client.waitFor("Page.loadEventFired", 20_000);
      await client.send("Page.navigate", { url: `${BASE_URL}/` });
      await loaded;
      await sleep(500);
      const reducedMotion = await client.send("Runtime.evaluate", {
        expression: `(() => ({
          matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
          runningAnimations: document.getAnimations().filter((animation) => animation.playState === 'running').length,
          longAnimations: document.getAnimations().filter((animation) => {
            const timing = animation.effect?.getComputedTiming();
            return Number(timing?.duration || 0) > 20 || timing?.iterations === Infinity;
          }).length,
        }))()`,
        returnByValue: true,
      });
      report.reducedMotion = reducedMotion.result?.value ?? null;
    }
    await client.send("Emulation.setEmulatedMedia", { features: [] });

    try {
      await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
      for (const route of ROUTES) {
        const loaded = client.waitFor("Page.loadEventFired", 20_000);
        await client.send("Page.navigate", { url: `${BASE_URL}${route.path}` });
        await loaded;
        await sleep(350);
        const zoomInspection = await client.send("Runtime.evaluate", {
          expression: `(() => ({
            route: location.pathname,
            viewportWidth: innerWidth,
            documentWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
            horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) > innerWidth + 1,
            mainPresent: Boolean(document.querySelector('main, [role="main"]')),
          }))()`,
          returnByValue: true,
        });
        report.zoom200.push(zoomInspection.result?.value ?? null);
      }
      await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });
    } catch (error) {
      report.limitations.push(`Chrome page-scale emulation was unavailable: ${error.message}`);
    }

    await client.close();
  } finally {
    chrome.kill("SIGTERM");
    fs.closeSync(chromeLog);
  }

  report.summary = {
    screenshots: report.results.length,
    routes: ROUTES.length,
    viewports: VIEWPORTS.length,
    viewportMismatchCases: report.results.filter(
      (result) =>
        result.inspection?.viewport?.width !== result.requestedViewport.width ||
        result.inspection?.viewport?.height !== result.requestedViewport.height,
    ).length,
    horizontalOverflowCases: report.results.filter(
      (result) => result.inspection?.horizontalOverflow,
    ).length,
    hydrationWarningCases: report.results.filter((result) => result.hydrationWarnings.length > 0)
      .length,
    runtimeErrorCases: report.results.filter((result) => result.runtimeExceptions.length > 0)
      .length,
    sameOriginNetworkErrorCases: report.results.filter(
      (result) => result.criticalNetworkErrors.length > 0,
    ).length,
    externalNetworkErrorCases: report.results.filter(
      (result) => result.externalNetworkErrors.length > 0,
    ).length,
    targetsBelow24: report.results.reduce(
      (total, result) => total + (result.inspection?.targetsBelow24?.length ?? 0),
      0,
    ),
    criticalFindings: report.criticalFindings.length,
  };
  report.pass = report.criticalFindings.length === 0;

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  const manifest = report.results.map(
    (result) => `${result.viewport}\t${result.route}\t${result.screenshot}`,
  );
  fs.writeFileSync(MANIFEST_PATH, `${manifest.join("\n")}\n`);

  console.log(JSON.stringify(report.summary));
  console.log(`Visual QA report: ${path.relative(ROOT, REPORT_PATH)}`);
  console.log(`Screenshot manifest: ${path.relative(ROOT, MANIFEST_PATH)}`);

  if (!report.pass) process.exitCode = 1;
}

main().catch((error) => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const failure = {
    schemaVersion: 2,
    audit: "f0-f1-visual-qa",
    generatedAt: new Date().toISOString(),
    pass: false,
    fatalError: error instanceof Error ? (error.stack ?? error.message) : String(error),
  };
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(failure, null, 2)}\n`);
  console.error(failure.fatalError);
  process.exitCode = 1;
});

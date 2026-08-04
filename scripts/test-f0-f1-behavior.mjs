import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const BASE_URL = process.env.FOUNDATION_BASE_URL ?? "http://127.0.0.1:4174";
const DEBUG_PORT = Number(process.env.FOUNDATION_CHROME_DEBUG_PORT ?? 9224);
const REPORT_PATH = path.join(ROOT, "artifacts/reports/f0-f1-behavior.json");
const CHROME_LOG_PATH = path.join(ROOT, "artifacts/runtime/behavior-chrome.txt");

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
      if (response.ok) return;
    } catch {
      // Browser or preview server is still starting.
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

  waitFor(method, timeout = 20_000) {
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

  close() {
    this.socket.close();
  }
}

async function evaluate(client, expression) {
  const response = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(
      response.exceptionDetails.exception?.description ??
        response.exceptionDetails.text ??
        "Browser evaluation failed",
    );
  }
  return response.result?.value;
}

async function navigate(client, url) {
  const loaded = client.waitFor("Page.loadEventFired");
  const navigation = await client.send("Page.navigate", { url });
  if (navigation.errorText) throw new Error(`${url}: ${navigation.errorText}`);
  await loaded;
}

async function waitForExpression(client, expression, timeout = 10_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(client, `Boolean(${expression})`)) return;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for expression: ${expression}`);
}

function createRecorder() {
  const results = [];
  const record = (name, pass, evidence) => {
    results.push({ name, pass, evidence });
    if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
  };
  return { results, record };
}

async function main() {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(CHROME_LOG_PATH), { recursive: true });

  const chromeBinary = findChrome();
  if (!chromeBinary) throw new Error("Chrome/Chromium executable was not found.");
  await waitForEndpoint(BASE_URL, 30_000);

  const chromeLog = fs.openSync(CHROME_LOG_PATH, "w");
  const chrome = spawn(
    chromeBinary,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), "sole-behavior-"))}`,
      "--window-size=1280,800",
      "about:blank",
    ],
    { stdio: ["ignore", chromeLog, chromeLog] },
  );

  const { results, record } = createRecorder();
  const browserErrors = [];

  try {
    await waitForEndpoint(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    const targetResponse = await fetch(
      `http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent("about:blank")}`,
      { method: "PUT" },
    );
    if (!targetResponse.ok) throw new Error(`Could not create target: ${targetResponse.status}`);
    const target = await targetResponse.json();
    const client = new CdpClient(target.webSocketDebuggerUrl);
    await client.connect();

    client.on("Runtime.exceptionThrown", (event) => {
      browserErrors.push({
        type: "exception",
        text:
          event.exceptionDetails?.exception?.description ??
          event.exceptionDetails?.text ??
          "Runtime exception",
      });
    });
    client.on("Runtime.consoleAPICalled", (event) => {
      if (event.type !== "error") return;
      browserErrors.push({
        type: "console",
        text: event.args.map((argument) => argument.value ?? argument.description ?? "").join(" "),
      });
    });

    await Promise.all([
      client.send("Page.enable"),
      client.send("Runtime.enable"),
      client.send("Log.enable"),
      client.send("Network.enable"),
      client.send("Emulation.setDeviceMetricsOverride", {
        width: 1280,
        height: 800,
        deviceScaleFactor: 1,
        mobile: false,
        screenWidth: 1280,
        screenHeight: 800,
      }),
    ]);

    await navigate(client, `${BASE_URL}/scripts/fixtures/foundation-behavior.html`);
    await waitForExpression(client, `document.querySelector('[data-testid="foundation-harness"]')`);

    const buttonDefault = await evaluate(
      client,
      `(() => {
        const form = document.querySelector('[data-testid="button-form"]');
        const button = document.querySelector('[data-testid="button-default"]');
        button?.click();
        return {
          type: button?.getAttribute('type'),
          propertyType: button?.type,
          submits: form?.getAttribute('data-submits'),
        };
      })()`,
    );
    await sleep(50);
    buttonDefault.submitsAfter = await evaluate(
      client,
      `document.querySelector('[data-testid="button-form"]')?.getAttribute('data-submits')`,
    );
    record(
      "Button default type",
      buttonDefault.type === "button" &&
        buttonDefault.propertyType === "button" &&
        buttonDefault.submitsAfter === "0",
      buttonDefault,
    );

    const buttonLoading = await evaluate(
      client,
      `(() => {
        const button = document.querySelector('[data-testid="button-loading"]');
        return {
          disabled: button?.disabled,
          ariaBusy: button?.getAttribute('aria-busy'),
          dataLoading: button?.getAttribute('data-loading'),
          accessibleText: button?.textContent?.trim(),
        };
      })()`,
    );
    record(
      "Button loading and disabled behavior",
      buttonLoading.disabled === true &&
        buttonLoading.ariaBusy === "true" &&
        buttonLoading.dataLoading === "true" &&
        buttonLoading.accessibleText.includes("Loading acceptance"),
      buttonLoading,
    );

    const iconButton = await evaluate(
      client,
      `(() => {
        const button = document.querySelector('[data-testid="icon-button"]');
        return {
          role: button?.getAttribute('role') || button?.tagName.toLowerCase(),
          label: button?.getAttribute('aria-label'),
          name: button?.getAttribute('aria-label') || button?.textContent?.trim(),
        };
      })()`,
    );
    record(
      "IconButton accessible name",
      iconButton.role === "button" && iconButton.label === "Acceptance icon",
      iconButton,
    );

    const quantityStart = await evaluate(
      client,
      `(() => {
        const group = document.querySelector('[aria-label="Acceptance quantity"]');
        const buttons = [...group.querySelectorAll('button')];
        return {
          value: group.querySelector('output')?.textContent?.trim(),
          decrementDisabled: buttons[0]?.disabled,
          incrementDisabled: buttons[1]?.disabled,
        };
      })()`,
    );
    await evaluate(
      client,
      `document.querySelector('[aria-label="Acceptance quantity"] button:last-of-type')?.click()`,
    );
    await waitForExpression(
      client,
      `document.querySelector('[aria-label="Acceptance quantity"] output')?.textContent?.trim() === '2'`,
    );
    const quantityMax = await evaluate(
      client,
      `(() => {
        const group = document.querySelector('[aria-label="Acceptance quantity"]');
        const buttons = [...group.querySelectorAll('button')];
        return {
          value: group.querySelector('output')?.textContent?.trim(),
          decrementDisabled: buttons[0]?.disabled,
          incrementDisabled: buttons[1]?.disabled,
        };
      })()`,
    );
    await evaluate(
      client,
      `document.querySelector('[aria-label="Acceptance quantity"] button:first-of-type')?.click()`,
    );
    await waitForExpression(
      client,
      `document.querySelector('[aria-label="Acceptance quantity"] output')?.textContent?.trim() === '1'`,
    );
    record(
      "QuantityStepper minimum and maximum behavior",
      quantityStart.value === "1" &&
        quantityStart.decrementDisabled === true &&
        quantityStart.incrementDisabled === false &&
        quantityMax.value === "2" &&
        quantityMax.decrementDisabled === false &&
        quantityMax.incrementDisabled === true,
      { quantityStart, quantityMax },
    );

    const price = await evaluate(
      client,
      `(() => {
        const price = document.querySelector('[data-testid="price"]');
        const numeric = price?.querySelector('bdi');
        return {
          wrapperDir: price?.getAttribute('dir'),
          numericDir: numeric?.getAttribute('dir'),
          numericText: numeric?.textContent?.trim(),
        };
      })()`,
    );
    record(
      "Price direction rendering",
      price.wrapperDir === "rtl" && price.numericDir === "ltr" && Boolean(price.numericText),
      price,
    );

    await navigate(client, `${BASE_URL}/`);
    await waitForExpression(client, `document.querySelector('[aria-label="Cart"]')`);

    const skipLink = await evaluate(
      client,
      `(() => {
        const link = document.querySelector('a.skip-link');
        const target = link ? document.querySelector(link.getAttribute('href')) : null;
        return {
          href: link?.getAttribute('href'),
          targetCount: document.querySelectorAll('#main-content').length,
          targetTabIndex: target?.tabIndex,
        };
      })()`,
    );
    record(
      "Skip-link target",
      skipLink.href === "#main-content" &&
        skipLink.targetCount === 1 &&
        skipLink.targetTabIndex === -1,
      skipLink,
    );

    await evaluate(client, `document.querySelector('[aria-label="Cart"]')?.click()`);
    await waitForExpression(client, `document.querySelector('[role="dialog"]')`);
    const drawerOpen = await evaluate(
      client,
      `(() => {
        const dialog = document.querySelector('[role="dialog"]');
        const active = document.activeElement;
        const bodyStyle = getComputedStyle(document.body);
        return {
          open: Boolean(dialog),
          activeInside: Boolean(dialog?.contains(active)),
          bodyOverflow: bodyStyle.overflow,
          bodyOverflowY: bodyStyle.overflowY,
        };
      })()`,
    );
    record(
      "Cart Drawer open and body scroll lock",
      drawerOpen.open === true &&
        drawerOpen.activeInside === true &&
        [drawerOpen.bodyOverflow, drawerOpen.bodyOverflowY].includes("hidden"),
      drawerOpen,
    );

    let focusTrapPass = true;
    const focusTrail = [];
    for (let index = 0; index < 16; index += 1) {
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
      const sample = await evaluate(
        client,
        `(() => {
          const dialog = document.querySelector('[role="dialog"]');
          const active = document.activeElement;
          return {
            inside: Boolean(dialog?.contains(active)),
            tag: active?.tagName.toLowerCase(),
            label: active?.getAttribute('aria-label') || active?.textContent?.trim().slice(0, 80),
          };
        })()`,
      );
      focusTrail.push(sample);
      if (!sample.inside) focusTrapPass = false;
    }
    record("Cart Drawer focus trap", focusTrapPass, focusTrail);

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
    await waitForExpression(client, `!document.querySelector('[role="dialog"]')`);
    const escapeClose = await evaluate(
      client,
      `(() => ({
        closed: !document.querySelector('[role="dialog"]'),
        restoredLabel: document.activeElement?.getAttribute('aria-label'),
        bodyOverflow: getComputedStyle(document.body).overflow,
      }))()`,
    );
    record(
      "Cart Drawer Escape close and focus restoration",
      escapeClose.closed === true &&
        escapeClose.restoredLabel === "Cart" &&
        escapeClose.bodyOverflow !== "hidden",
      escapeClose,
    );

    await evaluate(client, `document.querySelector('[aria-label="Cart"]')?.click()`);
    await waitForExpression(client, `document.querySelector('[data-foundation-overlay="cart"]')`);
    const overlayPoint = await evaluate(
      client,
      `(() => {
        const content = document.querySelector('[data-foundation-dialog="cart"]');
        const rect = content.getBoundingClientRect();
        const x = rect.right < innerWidth - 20 ? innerWidth - 10 : 10;
        return { x, y: Math.max(10, Math.min(innerHeight - 10, innerHeight / 2)), rect: {
          left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
        }};
      })()`,
    );
    await client.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: overlayPoint.x,
      y: overlayPoint.y,
      button: "left",
      clickCount: 1,
    });
    await client.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: overlayPoint.x,
      y: overlayPoint.y,
      button: "left",
      clickCount: 1,
    });
    await waitForExpression(client, `!document.querySelector('[role="dialog"]')`);
    const overlayDismissal = await evaluate(
      client,
      `(() => ({
        closed: !document.querySelector('[role="dialog"]'),
        restoredLabel: document.activeElement?.getAttribute('aria-label'),
      }))()`,
    );
    record(
      "Cart Drawer overlay dismissal policy",
      overlayDismissal.closed === true && overlayDismissal.restoredLabel === "Cart",
      { overlayPoint, overlayDismissal },
    );

    await evaluate(client, `document.querySelector('a[href="/products"]')?.click()`);
    await waitForExpression(client, `location.pathname === '/products'`);
    await waitForExpression(client, `document.activeElement?.id === 'main-content'`);
    const routeFocus = await evaluate(
      client,
      `(() => ({
        path: location.pathname,
        activeId: document.activeElement?.id,
        targetCount: document.querySelectorAll('#main-content').length,
      }))()`,
    );
    record(
      "Route-change focus",
      routeFocus.path === "/products" &&
        routeFocus.activeId === "main-content" &&
        routeFocus.targetCount === 1,
      routeFocus,
    );

    await client.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await navigate(client, `${BASE_URL}/`);
    await sleep(250);
    const reducedMotion = await evaluate(
      client,
      `(() => {
        const longAnimations = document.getAnimations().filter((animation) => {
          const timing = animation.effect?.getComputedTiming();
          return Number(timing?.duration || 0) > 20 || timing?.iterations === Infinity;
        });
        const cursor = document.querySelector('[data-foundation-cursor]');
        return {
          matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
          longAnimations: longAnimations.length,
          cursorDisplay: cursor ? getComputedStyle(cursor).display : null,
        };
      })()`,
    );
    record(
      "Reduced-motion behavior",
      reducedMotion.matches === true &&
        reducedMotion.longAnimations === 0 &&
        [null, "none"].includes(reducedMotion.cursorDisplay),
      reducedMotion,
    );
    await client.send("Emulation.setEmulatedMedia", { features: [] });

    const meaningfulBrowserErrors = browserErrors.filter(
      (entry) =>
        /hydration|hydrated|server rendered html|did not match|uncaught|error:/i.test(entry.text) &&
        !/React DevTools/i.test(entry.text),
    );
    record("No hydration or runtime errors", meaningfulBrowserErrors.length === 0, meaningfulBrowserErrors);

    client.close();
  } finally {
    chrome.kill("SIGTERM");
    fs.closeSync(chromeLog);
  }

  const failed = results.filter((result) => !result.pass);
  const report = {
    schemaVersion: 1,
    suite: "f0-f1-browser-behavior",
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
    },
    results,
    pass: failed.length === 0,
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary));
  console.log(`Behavior report: ${path.relative(ROOT, REPORT_PATH)}`);
  if (!report.pass) process.exitCode = 1;
}

main().catch((error) => {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  const report = {
    schemaVersion: 1,
    suite: "f0-f1-browser-behavior",
    generatedAt: new Date().toISOString(),
    pass: false,
    fatalError: error instanceof Error ? error.stack ?? error.message : String(error),
  };
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.error(report.fatalError);
  process.exitCode = 1;
});

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
import { withF7Server } from "./f7-browser-runner.mjs";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "artifacts/visual-qa/f7-cart-checkout");
const REPORT = path.join(OUTPUT, "f7-cart-checkout.json");
const CHROME_LOG = path.join(ROOT, "artifacts/runtime/f7-cart-checkout-visual-chrome.txt");
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

async function click(client, selector) {
  const clicked = await evaluate(
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
      target?.click();
      return Boolean(target);
    })()`,
  );
  if (!clicked) throw new Error(`Visible target not found: ${selector}`);
  await sleep(180);
}

async function setField(client, selector, value) {
  await evaluate(
    client,
    `(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) return false;
      const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(element, ${JSON.stringify(value)});
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`,
  );
  await sleep(70);
}

async function seedCheckoutState(client, baseUrl) {
  await navigate(client, `${baseUrl}/`);
  await evaluate(
    client,
    `(() => {
      localStorage.setItem('sole-store', JSON.stringify({ state: { cart: [{ id: 1, size: 40, qty: 2 }] } }));
      sessionStorage.removeItem('sole-checkout-draft-v1');
      return true;
    })()`,
  );
}

async function inspect(client, rootSelector) {
  return evaluate(
    client,
    `(() => {
      const root = document.querySelector(${JSON.stringify(rootSelector)});
      const controls = root
        ? [...root.querySelectorAll('button,a[href],input,select,textarea')].filter((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
          })
        : [];
      const tinyTargets = controls
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width < 44 || rect.height < 44;
        })
        .slice(0, 30)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName,
            label: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 70),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        });
      const unnamedButtons = controls.filter(
        (element) =>
          element.tagName === 'BUTTON' &&
          !((element.getAttribute('aria-label') || element.textContent || '').trim()),
      ).length;
      return {
        root: Boolean(root),
        viewport: { width: innerWidth, height: innerHeight },
        documentWidth: document.documentElement.scrollWidth,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        h1: document.querySelectorAll('h1').length,
        tinyTargets,
        unnamedButtons,
        bottomNav: Boolean(document.querySelector('nav[aria-label="ناوبری پایین موبایل"]')),
      };
    })()`,
  );
}

async function capture(client, baseUrl, name, url, rootSelector, width, height, setup) {
  await viewport(client, width, height);
  await navigate(client, `${baseUrl}${url}`);
  await waitForExpression(client, `document.querySelector(${JSON.stringify(rootSelector)})`);
  await waitForExpression(client, `document.fonts.status === 'loaded'`);
  if (setup) await setup();
  await sleep(450);

  const metrics = await inspect(client, rootSelector);
  const file = await screenshot(client, `${name}-${width}x${height}`);
  const findings = [];
  if (!metrics.root) findings.push("missing-root");
  if (metrics.overflow) findings.push("horizontal-overflow");
  if (metrics.h1 !== 1) findings.push(`h1-count-${metrics.h1}`);
  if (metrics.unnamedButtons) findings.push(`unnamed-buttons-${metrics.unnamedButtons}`);
  if (metrics.tinyTargets.length) findings.push(`targets-below-44-${metrics.tinyTargets.length}`);
  if (findings.length) criticalFindings.push({ name, width, height, findings, metrics });
  captures.push({ name, url, width, height, file, metrics, findings });
}

async function run(baseUrl) {
  fs.rmSync(OUTPUT, { recursive: true, force: true });
  const browser = await openBrowser({ debugPort: 9251, logPath: CHROME_LOG });
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
    await seedCheckoutState(client, baseUrl);

    for (const [width, height] of VIEWPORTS) {
      await capture(
        client,
        baseUrl,
        "cart-populated",
        "/cart",
        '[data-testid="f7-cart-page"]',
        width,
        height,
      );
      await capture(
        client,
        baseUrl,
        "checkout-form",
        "/checkout",
        '[data-testid="f7-checkout-page"]',
        width,
        height,
      );
    }

    await viewport(client, 320, 568, true);
    await navigate(client, `${baseUrl}/cart`);
    await waitForExpression(client, `document.querySelector('[data-cart-trigger="true"]')`);
    await click(client, '[data-cart-trigger="true"]');
    await waitForExpression(client, `document.querySelector('[data-testid="cart-drawer"]')`);
    const drawer = await evaluate(
      client,
      `(() => {
        const dialog = document.querySelector('[data-testid="cart-drawer"]');
        const rect = dialog?.getBoundingClientRect();
        const controls = dialog ? [...dialog.querySelectorAll('button,a[href]')].filter((element) => {
          const r = element.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        }) : [];
        return {
          rect: rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } : null,
          clipped: Boolean(rect && (rect.left < -1 || rect.right > innerWidth + 1 || rect.top < -1 || rect.bottom > innerHeight + 1)),
          tiny: controls.filter((element) => {
            const r = element.getBoundingClientRect();
            return r.width < 44 || r.height < 44;
          }).length,
        };
      })()`,
    );
    const drawerFile = await screenshot(client, "cart-drawer-320x568");
    const drawerFindings = [];
    if (drawer.clipped) drawerFindings.push("drawer-clipped");
    if (drawer.tiny) drawerFindings.push(`drawer-targets-below-44-${drawer.tiny}`);
    if (drawerFindings.length)
      criticalFindings.push({
        name: "cart-drawer",
        width: 320,
        height: 568,
        findings: drawerFindings,
        metrics: drawer,
      });
    captures.push({
      name: "cart-drawer",
      url: "/cart",
      width: 320,
      height: 568,
      file: drawerFile,
      metrics: drawer,
      findings: drawerFindings,
    });

    await client.send("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await capture(
      client,
      baseUrl,
      "checkout-reduced-motion",
      "/checkout",
      '[data-testid="f7-checkout-page"]',
      390,
      844,
    );

    await client.send("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [{ name: "forced-colors", value: "active" }],
    });
    await capture(
      client,
      baseUrl,
      "checkout-forced-colors",
      "/checkout",
      '[data-testid="f7-checkout-page"]',
      390,
      844,
    );

    await client.send("Emulation.setEmulatedMedia", { media: "screen", features: [] });
    await viewport(client, 390, 844, true);
    await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
    await navigate(client, `${baseUrl}/checkout`);
    await waitForExpression(client, `document.querySelector('[data-testid="f7-checkout-page"]')`);
    const zoomMetrics = await inspect(client, '[data-testid="f7-checkout-page"]');
    const zoomFile = await screenshot(client, "checkout-200-percent-zoom-390x844");
    const zoomFindings = [];
    if (zoomMetrics.overflow) zoomFindings.push("horizontal-overflow-at-200-percent-zoom");
    if (zoomMetrics.tinyTargets.length)
      zoomFindings.push(`targets-below-44-${zoomMetrics.tinyTargets.length}`);
    if (zoomFindings.length)
      criticalFindings.push({
        name: "checkout-200-percent-zoom",
        findings: zoomFindings,
        metrics: zoomMetrics,
      });
    captures.push({
      name: "checkout-200-percent-zoom",
      url: "/checkout",
      width: 390,
      height: 844,
      file: zoomFile,
      metrics: zoomMetrics,
      findings: zoomFindings,
    });
    await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });

    await capture(
      client,
      baseUrl,
      "checkout-keyboard-viewport",
      "/checkout",
      '[data-testid="f7-checkout-page"]',
      390,
      500,
    );

    await viewport(client, 390, 844, true);
    await seedCheckoutState(client, baseUrl);
    await navigate(client, `${baseUrl}/checkout`);
    await waitForExpression(client, `document.querySelector('[data-testid="checkout-form"]')`);
    await setField(client, "#checkout-firstName", "سجاد");
    await setField(client, "#checkout-phone", "09121234567");
    await setField(
      client,
      "#checkout-province",
      "استان با نام بسیار طولانی برای آزمون واکنش‌گرایی",
    );
    await setField(client, "#checkout-city", "شهر آزمایشی");
    await setField(
      client,
      "#checkout-address",
      "این یک آدرس فارسی بسیار طولانی برای بررسی شکست خطوط، جهت راست به چپ، عدم ایجاد اسکرول افقی و رفتار صحیح صفحه در عرض موبایل است؛ پلاک نمونه و توضیحات تکمیلی نیز در ادامه همین متن قرار می‌گیرند.",
    );
    await click(client, '[data-testid="checkout-review-submit"]');
    await waitForExpression(client, `document.querySelector('[data-testid="checkout-review"]')`);
    const longMetrics = await inspect(client, '[data-testid="f7-checkout-page"]');
    const longFile = await screenshot(client, "checkout-long-persian-review-390x844");
    const longFindings = [];
    if (longMetrics.overflow) longFindings.push("long-persian-horizontal-overflow");
    if (longMetrics.tinyTargets.length)
      longFindings.push(`targets-below-44-${longMetrics.tinyTargets.length}`);
    if (longFindings.length)
      criticalFindings.push({
        name: "checkout-long-persian-review",
        findings: longFindings,
        metrics: longMetrics,
      });
    captures.push({
      name: "checkout-long-persian-review",
      url: "/checkout",
      width: 390,
      height: 844,
      file: longFile,
      metrics: longMetrics,
      findings: longFindings,
    });
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
    suite: "f7-cart-checkout-visual",
    generatedAt: new Date().toISOString(),
    viewports: VIEWPORTS.map(([width, height]) => ({ width, height })),
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

withF7Server(
  {
    envName: "F7_VISUAL_BASE_URL",
    port: 4189,
    logPath: "artifacts/runtime/f7-cart-checkout-visual-server.txt",
  },
  run,
).catch((error) => {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(
    REPORT,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        suite: "f7-cart-checkout-visual",
        generatedAt: new Date().toISOString(),
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

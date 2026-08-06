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
import { withF6Server } from "./f6-browser-runner.mjs";

const ROOT = process.cwd();
const REPORT = path.join(ROOT, "artifacts/reports/f6-product-detail-behavior.json");
const CHROME_LOG = path.join(ROOT, "artifacts/runtime/f6-product-detail-chrome.txt");
const results = [];
const browserErrors = [];

function record(name, pass, evidence) {
  results.push({ name, pass: Boolean(pass), evidence });
  if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
}

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

async function click(client, selector) {
  const clicked = await evaluate(
    client,
    `(() => {
      const target = [...document.querySelectorAll(${JSON.stringify(selector)})].find((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      });
      if (!(target instanceof HTMLElement)) return false;
      target.scrollIntoView({ block: 'center' });
      target.click();
      return true;
    })()`,
  );
  if (!clicked) throw new Error(`Visible target not found: ${selector}`);
  await sleep(120);
}

async function key(client, key, code, keyCode) {
  await client.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key,
    code,
    windowsVirtualKeyCode: keyCode,
  });
  await client.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
    code,
    windowsVirtualKeyCode: keyCode,
  });
}

async function selectedThumbnail(client) {
  return evaluate(
    client,
    `[...document.querySelectorAll('[data-testid="product-thumbnail"]')].findIndex((node) => node.getAttribute('aria-selected') === 'true')`,
  );
}

async function run(baseUrl) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  const browser = await openBrowser({ debugPort: 9248, logPath: CHROME_LOG });
  const { client } = browser;

  client.on("Runtime.exceptionThrown", (event) => {
    browserErrors.push(
      event.exceptionDetails?.exception?.description ?? event.exceptionDetails?.text ?? "Runtime exception",
    );
  });
  client.on("Runtime.consoleAPICalled", (event) => {
    if (event.type === "error") browserErrors.push(event.args.map(serialiseArgument).join(" "));
  });

  try {
    await viewport(client, 1280, 900);
    await navigate(client, `${baseUrl}/product/1`);
    await waitForExpression(client, `document.querySelector('[data-testid="product-purchase-panel"]')`);
    await evaluate(client, `localStorage.removeItem('sole-store'); true`);
    await navigate(client, `${baseUrl}/product/1`);
    await waitForExpression(client, `document.querySelector('[data-testid="product-purchase-panel"]')`);

    const initial = await evaluate(
      client,
      `({
        h1: document.querySelectorAll('h1').length,
        selected: document.querySelectorAll('[data-testid="product-size-option"][aria-pressed="true"]').length,
        disabled: document.querySelector('[data-testid="product-add-to-cart"]')?.disabled,
        status: document.querySelector('[data-testid="product-size-status"]')?.textContent?.trim()
      })`,
    );
    record(
      "Product starts without automatic size selection",
      initial.h1 === 1 && initial.selected === 0 && initial.disabled === true && /انتخاب نشده/.test(initial.status ?? ""),
      initial,
    );

    await click(client, '[data-testid="product-size-option"]');
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="product-size-option"][aria-pressed="true"]') && !document.querySelector('[data-testid="product-add-to-cart"]')?.disabled`,
    );
    record("Explicit size enables purchase", true, null);

    await click(client, '[aria-label^="افزایش تعداد"]');
    await click(client, '[data-testid="product-add-to-cart"]');
    await waitForExpression(client, `document.querySelector('[role="dialog"]')`);
    const cart = await evaluate(
      client,
      `(() => {
        const persisted = JSON.parse(localStorage.getItem('sole-store') || '{}');
        const item = (persisted.state?.cart || []).find((entry) => entry.id === 1);
        return { id: item?.id, size: item?.size, qty: item?.qty };
      })()`,
    );
    record("Quantity and selected size reach local cart", cart.id === 1 && Number(cart.size) > 0 && cart.qty === 2, cart);
    await key(client, "Escape", "Escape", 27);
    await waitForExpression(client, `!document.querySelector('[role="dialog"]')`);

    const first = await selectedThumbnail(client);
    await click(client, '[data-testid="product-gallery-next"]');
    const afterControl = await selectedThumbnail(client);
    await evaluate(client, `document.querySelector('[data-testid="product-gallery-stage"]')?.focus(); true`);
    await key(client, "ArrowLeft", "ArrowLeft", 37);
    const afterKeyboard = await selectedThumbnail(client);
    await evaluate(
      client,
      `(() => {
        const stage = document.querySelector('[data-testid="product-gallery-stage"]');
        stage?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 300 }));
        stage?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 180 }));
        return true;
      })()`,
    );
    const afterSwipe = await selectedThumbnail(client);
    record(
      "Gallery supports controls, keyboard and swipe",
      first !== afterControl && afterControl !== afterKeyboard && afterKeyboard !== afterSwipe,
      { first, afterControl, afterKeyboard, afterSwipe },
    );

    await click(client, '[data-testid="product-thumbnail"]:nth-of-type(3)');
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="product-thumbnail"]:nth-of-type(3)')?.getAttribute('aria-selected') === 'true'`,
    );
    record("Thumbnail selection exposes selected semantics", true, null);

    await evaluate(
      client,
      `(() => {
        const image = document.querySelector('[data-testid="product-main-image"]');
        image?.dispatchEvent(new Event('error'));
        return true;
      })()`,
    );
    await waitForExpression(client, `document.querySelector('[data-testid="product-main-image-fallback"]')`);
    record("Main image has a designed fallback", true, null);

    await click(client, '[data-testid="size-guide-trigger"]');
    await waitForExpression(client, `document.querySelector('[data-testid="size-guide-dialog"]')`);
    const guide = await evaluate(
      client,
      `document.querySelector('[data-testid="size-guide-dialog"]')?.textContent`,
    );
    await key(client, "Escape", "Escape", 27);
    await waitForExpression(client, `!document.querySelector('[data-testid="size-guide-dialog"]')`);
    await waitForExpression(
      client,
      `document.activeElement === document.querySelector('[data-testid="size-guide-trigger"]')`,
    );
    record("Size guide is truthful and restores focus", /نمودار رسمی/.test(guide ?? ""), guide);

    const wishlistBefore = await evaluate(
      client,
      `document.querySelector('[data-testid="product-wishlist"]')?.getAttribute('aria-pressed')`,
    );
    await click(client, '[data-testid="product-wishlist"]');
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="product-wishlist"]')?.getAttribute('aria-pressed') !== ${JSON.stringify(wishlistBefore)}`,
    );
    record("Wishlist exposes pressed state", true, wishlistBefore);

    await viewport(client, 390, 844, true);
    await navigate(client, `${baseUrl}/product/1`);
    await waitForExpression(client, `document.querySelector('[data-testid="product-mobile-purchase"]')`);
    const mobile = await evaluate(
      client,
      `(() => {
        const bar = document.querySelector('[data-testid="product-mobile-purchase"]');
        const button = document.querySelector('[data-testid="product-mobile-add-to-cart"]');
        const rect = bar?.getBoundingClientRect();
        return { visible: Boolean(rect && rect.width > 0 && rect.height > 0), disabled: button?.disabled };
      })()`,
    );
    record("Mobile sticky bar follows size-selection rules", mobile.visible && mobile.disabled === true, mobile);

    await viewport(client, 1280, 900);
    await navigate(client, `${baseUrl}/product/7`);
    await waitForExpression(client, `document.querySelector('[data-testid="product-purchase-panel"]')`);
    const soldOut = await evaluate(
      client,
      `({
        desktop: document.querySelector('[data-testid="product-add-to-cart"]')?.disabled,
        mobile: document.querySelector('[data-testid="product-mobile-add-to-cart"]')?.disabled,
        text: document.querySelector('[data-testid="product-purchase-panel"]')?.textContent
      })`,
    );
    record(
      "Dataset sold-out product cannot be added",
      soldOut.desktop === true && soldOut.mobile === true && /Dataset ناموجود/.test(soldOut.text ?? ""),
      soldOut,
    );

    await navigate(client, `${baseUrl}/product/2`);
    await waitForExpression(client, `document.querySelector('[data-testid="product-purchase-panel"]')`);
    await navigate(client, `${baseUrl}/product/1`);
    await waitForExpression(client, `document.querySelector('[data-testid="related-products"]')`);
    await waitForExpression(client, `document.querySelector('[data-testid="recently-viewed-products"]')`);
    const collections = await evaluate(
      client,
      `({
        related: document.querySelectorAll('[data-testid="related-products"] [data-testid="product-card"]').length,
        recent: document.querySelectorAll('[data-testid="recently-viewed-products"] [data-testid="product-card"]').length
      })`,
    );
    record("Related and recently viewed sections use Product Cards", collections.related > 0 && collections.recent > 0, collections);

    const meaningfulErrors = browserErrors.filter((text) =>
      /hydration|server rendered html|did not match|uncaught|typeerror|referenceerror|syntaxerror/i.test(text),
    );
    record("No hydration or runtime errors", meaningfulErrors.length === 0, meaningfulErrors);
  } finally {
    await browser.close();
  }

  const failed = results.filter((result) => !result.pass);
  const report = {
    schemaVersion: 1,
    suite: "f6-product-detail-browser-behavior",
    generatedAt: new Date().toISOString(),
    results,
    browserErrors,
    summary: { total: results.length, passed: results.length - failed.length, failed: failed.length },
    pass: failed.length === 0,
  };
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary));
  if (!report.pass) process.exitCode = 1;
}

withF6Server(
  {
    envName: "F6_BEHAVIOR_BASE_URL",
    port: 4186,
    logPath: "artifacts/runtime/f6-product-detail-server.txt",
  },
  run,
).catch((error) => {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(
    REPORT,
    `${JSON.stringify({ schemaVersion: 1, suite: "f6-product-detail-browser-behavior", pass: false, fatalError: error instanceof Error ? (error.stack ?? error.message) : String(error) }, null, 2)}\n`,
  );
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});

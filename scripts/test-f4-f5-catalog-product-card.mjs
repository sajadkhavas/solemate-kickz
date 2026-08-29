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
import { withCatalogServer } from "./f4-f5-browser-runner.mjs";

const ROOT = process.cwd();
const REPORT = path.join(ROOT, "artifacts/reports/f4-f5-catalog-product-card-behavior.json");
const CHROME_LOG = path.join(ROOT, "artifacts/runtime/f4-f5-behavior-chrome.txt");
const results = [];
const browserErrors = [];

function record(name, pass, evidence) {
  results.push({ name, pass: Boolean(pass), evidence });
  if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
}

async function press(client, key, code = key) {
  await client.send("Input.dispatchKeyEvent", { type: "keyDown", key, code });
  await client.send("Input.dispatchKeyEvent", { type: "keyUp", key, code });
  await sleep(100);
}

async function setInput(client, selector, value) {
  const focused = await evaluate(
    client,
    `(() => {
      const input = document.querySelector(${JSON.stringify(selector)});
      if (!(input instanceof HTMLInputElement)) return false;
      input.scrollIntoView({ block: 'center', inline: 'center' });
      input.focus({ preventScroll: true });
      input.select();
      return document.activeElement === input;
    })()`,
  );
  if (!focused) throw new Error(`Input not found or not focusable: ${selector}`);

  // Use Chrome's real text-input path instead of mutating the DOM value and
  // dispatching a synthetic event. React 19 tracks controlled values and can
  // legitimately ignore the latter, leaving component state stale even when
  // the DOM appears updated.
  await client.send("Input.insertText", { text: value });
  await waitForExpression(
    client,
    `document.querySelector(${JSON.stringify(selector)})?.value === ${JSON.stringify(value)}`,
  );
  await sleep(150);
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
      target?.scrollIntoView({ block: 'center', inline: 'center' });
      target?.click(); return Boolean(target);
    })()`,
  );
  if (!clicked) throw new Error(`Visible clickable target not found: ${selector}`);
  await sleep(120);
}

async function clickText(client, selector, text) {
  const clicked = await evaluate(
    client,
    `(() => {
      const target = [...document.querySelectorAll(${JSON.stringify(selector)})]
        .find((node) => node.textContent?.trim().includes(${JSON.stringify(text)}));
      target?.click(); return Boolean(target);
    })()`,
  );
  if (!clicked) throw new Error(`Text target not found: ${text}`);
  await sleep(120);
}

async function activateVisible(client, selector) {
  const activated = await evaluate(
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
      target.focus({ preventScroll: true });
      target.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
      }));
      return true;
    })()`,
  );
  if (!activated) throw new Error(`Visible activation target not found: ${selector}`);
  await sleep(150);
}

async function activateVisibleText(client, selector, text) {
  const activated = await evaluate(
    client,
    `(() => {
      const target = [...document.querySelectorAll(${JSON.stringify(selector)})].find((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
          style.visibility !== 'hidden' && style.pointerEvents !== 'none' &&
          element.textContent?.trim().includes(${JSON.stringify(text)});
      });
      if (!(target instanceof HTMLElement)) return false;
      target.scrollIntoView({ block: 'center', inline: 'center' });
      target.focus({ preventScroll: true });
      target.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
      }));
      return true;
    })()`,
  );
  if (!activated) throw new Error(`Visible text activation target not found: ${text}`);
  await sleep(150);
}

async function run(baseUrl) {
  const browser = await openBrowser({ debugPort: 9245, logPath: CHROME_LOG });
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

  try {
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: 1280,
      screenHeight: 900,
    });

    await navigate(client, `${baseUrl}/products`);
    await waitForExpression(
      client,
      `document.querySelectorAll('[data-testid="product-card"]').length > 0`,
    );
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="catalog-search-form"]')?.getAttribute('data-interactive') === 'true'`,
    );
    const initialCount = await evaluate(
      client,
      `document.querySelectorAll('[data-testid="product-card"]').length`,
    );
    record("Catalog renders real dataset cards", initialCount > 10, initialCount);

    await setInput(client, "#catalog-search", "Nike");
    await click(client, 'form:has(#catalog-search) button[type="submit"]');
    await waitForExpression(client, `new URLSearchParams(location.search).get('q') === 'Nike'`);
    await waitForExpression(
      client,
      `document.querySelectorAll('[data-testid="product-card"]').length > 0`,
    );
    const searchState = await evaluate(
      client,
      `({ q: new URLSearchParams(location.search).get('q'), count: document.querySelectorAll('[data-testid="product-card"]').length })`,
    );
    record(
      "Search is URL-backed",
      searchState.q === "Nike" && searchState.count < initialCount,
      searchState,
    );

    await clickText(client, '[aria-label="فیلترهای سریع"] button', "تخفیف‌دار");
    await waitForExpression(client, `new URLSearchParams(location.search).get('quick') === 'sale'`);
    record(
      "Quick filter is URL-backed",
      await evaluate(client, `new URLSearchParams(location.search).get('quick') === 'sale'`),
      await evaluate(client, `location.search`),
    );

    const sizeFocused = await evaluate(
      client,
      `(() => {
        const target = [...document.querySelectorAll('[data-testid="catalog-size-filter"][data-size="42"]')]
          .find((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
              style.visibility !== 'hidden';
          });
        target?.focus();
        return document.activeElement === target;
      })()`,
    );
    if (!sizeFocused) throw new Error("Visible size 42 control could not receive focus");
    await press(client, " ", "Space");
    await waitForExpression(client, `new URLSearchParams(location.search).get('sizes') === '42'`);
    record(
      "Size filter survives URL state",
      await evaluate(client, `new URLSearchParams(location.search).get('sizes') === '42'`),
      await evaluate(client, `location.search`),
    );

    await activateVisibleText(client, '[data-testid="product-card"] button', "نمایش سریع");
    await waitForExpression(client, `document.querySelector('[data-testid="quick-view-dialog"]')`);
    const quickView = await evaluate(
      client,
      `(() => {
        const dialog = document.querySelector('[data-testid="quick-view-dialog"]');
        const add = dialog?.querySelector('[data-testid="quick-view-add"]');
        return {
          dialog: Boolean(dialog),
          addDisabled: add instanceof HTMLButtonElement ? add.disabled : null,
          hasSizeControl: Boolean(dialog?.querySelector('[data-testid="quick-view-size"]')),
        };
      })()`,
    );
    record(
      "Quick view requires explicit size before add",
      quickView.dialog && quickView.addDisabled === true && quickView.hasSizeControl,
      quickView,
    );

    await activateVisible(client, '[data-testid="quick-view-size"]');
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="quick-view-add"]')?.disabled === false`,
    );
    record(
      "Quick view unlocks add after size selection",
      await evaluate(client, `document.querySelector('[data-testid="quick-view-add"]')?.disabled === false`),
      null,
    );

    await activateVisible(client, '[data-testid="quick-view-close"]');
    await waitForExpression(client, `!document.querySelector('[data-testid="quick-view-dialog"]')`);
    record("Quick view can close", true, null);

    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
      screenWidth: 390,
      screenHeight: 844,
    });
    await navigate(client, `${baseUrl}/products`);
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="catalog-search-form"]')?.getAttribute('data-interactive') === 'true'`,
    );
    await activateVisible(client, '[data-testid="mobile-filter-trigger"]');
    await waitForExpression(client, `[...document.querySelectorAll('[role="dialog"]')].some((dialog) => {
      const rect = dialog.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    })`);
    record("Mobile filters open in an accessible dialog", true, null);

    const relevantErrors = browserErrors.filter(
      (error) => !/favicon|ResizeObserver loop limit exceeded/i.test(error),
    );
    record("Catalog runtime has no browser exceptions", relevantErrors.length === 0, relevantErrors);
  } finally {
    await browser.close();
  }

  const failed = results.filter((result) => !result.pass);
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(
    REPORT,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        suite: "f4-f5-catalog-product-card-behavior",
        summary: {
          total: results.length,
          passed: results.length - failed.length,
          failed: failed.length,
        },
        results,
        browserErrors,
      },
      null,
      2,
    )}\n`,
  );
  console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length }));
  if (failed.length) process.exitCode = 1;
}

withCatalogServer(
  {
    envName: "F4_F5_BEHAVIOR_BASE_URL",
    port: 4196,
    logPath: "artifacts/runtime/f4-f5-behavior-server.txt",
  },
  run,
).catch((error) => {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(
    REPORT,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        suite: "f4-f5-catalog-product-card-behavior",
        fatalError: error instanceof Error ? (error.stack ?? error.message) : String(error),
      },
      null,
      2,
    )}\n`,
  );
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});

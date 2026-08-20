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
    const initialCount = await evaluate(
      client,
      `document.querySelectorAll('[data-testid="product-card"]').length`,
    );
    record("Catalog renders real dataset cards", initialCount > 10, initialCount);

    await setInput(client, "#catalog-search", "Nike");
    await press(client, "Enter", "Enter");
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

    await evaluate(
      client,
      `(() => {
        const select = document.querySelector('#catalog-sort');
        if (!(select instanceof HTMLSelectElement)) return false;
        select.value = 'price-desc';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`,
    );
    await waitForExpression(
      client,
      `new URLSearchParams(location.search).get('sort') === 'price-desc'`,
    );
    record(
      "Sorting is URL-backed",
      await evaluate(client, `new URLSearchParams(location.search).get('sort') === 'price-desc'`),
      await evaluate(client, `location.search`),
    );

    const beforeHistory = await evaluate(client, `location.search`);
    await evaluate(client, `history.back(); true`);
    await waitForExpression(
      client,
      `new URLSearchParams(location.search).get('sort') !== 'price-desc'`,
    );
    const backState = await evaluate(client, `location.search`);
    await evaluate(client, `history.forward(); true`);
    await waitForExpression(
      client,
      `new URLSearchParams(location.search).get('sort') === 'price-desc'`,
    );
    const forwardState = await evaluate(client, `location.search`);
    record(
      "Browser Back and Forward restore catalog state",
      beforeHistory === forwardState && backState !== forwardState,
      { beforeHistory, backState, forwardState },
    );

    await navigate(
      client,
      `${baseUrl}/products?brand=Nike&sizes=42&priceMax=6000000&quick=all&view=list&sort=price-asc`,
    );
    await waitForExpression(client, `document.querySelector('[data-testid="catalog-results"]')`);
    const deepLink = await evaluate(
      client,
      `({
        brandPressed: [...document.querySelectorAll('[data-testid="catalog-filters"] button')].some((button) => button.textContent?.includes('Nike') && button.getAttribute('aria-pressed') === 'true'),
        sizePressed: document.querySelector('[data-testid="catalog-size-filter"][data-size="42"]')?.getAttribute('aria-pressed') === 'true',
        list: new URLSearchParams(location.search).get('view') === 'list'
      })`,
    );
    record(
      "Refresh and deep-link restore filters",
      deepLink.brandPressed && deepLink.sizePressed && deepLink.list,
      deepLink,
    );

    await navigate(client, `${baseUrl}/products`);
    await waitForExpression(
      client,
      `[...document.querySelectorAll('[data-testid="quick-view-trigger"]')].some((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
          style.visibility !== 'hidden';
      })`,
    );
    await activateVisible(client, '[data-testid="quick-view-trigger"]');
    await waitForExpression(client, `document.querySelector('[data-testid="quick-view-dialog"]')`);
    const quickViewInitial = await evaluate(
      client,
      `({
        open: Boolean(document.querySelector('[data-testid="quick-view-dialog"]')),
        addDisabled: document.querySelector('[data-testid="quick-view-add"]')?.disabled,
        focusInside: document.querySelector('[data-testid="quick-view-dialog"]')?.contains(document.activeElement)
      })`,
    );
    record(
      "Quick View opens with focus containment",
      quickViewInitial.open && quickViewInitial.addDisabled && quickViewInitial.focusInside,
      quickViewInitial,
    );

    await click(client, '[data-testid="quick-view-size"]');
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="quick-view-add"]')?.disabled === false`,
    );
    record(
      "Quick View requires explicit size selection",
      await evaluate(
        client,
        `document.querySelector('[data-testid="quick-view-add"]')?.disabled === false`,
      ),
      true,
    );

    const wishlistSelector = '[data-testid="quick-view-wishlist"]';
    const wishlistBefore = await evaluate(
      client,
      `document.querySelector(${JSON.stringify(wishlistSelector)})?.getAttribute('aria-pressed')`,
    );
    await click(client, wishlistSelector);
    const wishlistAfter = await evaluate(
      client,
      `document.querySelector(${JSON.stringify(wishlistSelector)})?.getAttribute('aria-pressed')`,
    );
    record("Wishlist interaction is persistent and pressed", wishlistBefore !== wishlistAfter, {
      wishlistBefore,
      wishlistAfter,
    });

    await press(client, "Escape", "Escape");
    await waitForExpression(client, `!document.querySelector('[data-testid="quick-view-dialog"]')`);
    const restoredFocus = await evaluate(
      client,
      `document.activeElement?.getAttribute('data-testid')`,
    );
    record(
      "Quick View Escape restores trigger focus",
      restoredFocus === "quick-view-trigger",
      restoredFocus,
    );

    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
      screenWidth: 390,
      screenHeight: 844,
    });
    await navigate(client, `${baseUrl}/products`);
    await activateVisible(client, '[data-testid="mobile-filter-trigger"]');
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="mobile-filter-dialog"]')`,
    );
    const mobileDialog = await evaluate(
      client,
      `({
        open: Boolean(document.querySelector('[data-testid="mobile-filter-dialog"]')),
        focusInside: document.querySelector('[data-testid="mobile-filter-dialog"]')?.contains(document.activeElement),
        locked: document.body.hasAttribute('data-scroll-locked') || document.body.style.overflow === 'hidden'
      })`,
    );
    record(
      "Mobile filter dialog traps focus and locks scroll",
      mobileDialog.open && mobileDialog.focusInside && mobileDialog.locked,
      mobileDialog,
    );

    await activateVisibleText(client, '[data-testid="mobile-filter-dialog"] button', "Nike");
    await waitForExpression(client, `new URLSearchParams(location.search).get('brand') === 'Nike'`);
    await activateVisible(client, '[data-testid="apply-mobile-filters"]');
    await waitForExpression(
      client,
      `!document.querySelector('[data-testid="mobile-filter-dialog"]')`,
    );
    record(
      "Mobile filter applies URL state and closes",
      await evaluate(client, `new URLSearchParams(location.search).get('brand') === 'Nike'`),
      await evaluate(client, `location.search`),
    );

    await navigate(client, `${baseUrl}/products?q=Dunk%20Low`);
    await waitForExpression(
      client,
      `[...document.querySelectorAll('[data-testid="quick-view-trigger"]')].some((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })`,
    );
    await activateVisible(client, '[data-testid="quick-view-trigger"]');
    await waitForExpression(client, `document.querySelector('[data-testid="quick-view-dialog"]')`);
    const soldOut = await evaluate(
      client,
      `({
        text: document.querySelector('[data-testid="quick-view-dialog"]')?.textContent,
        disabled: document.querySelector('[data-testid="quick-view-add"]')?.disabled
      })`,
    );
    record(
      "Sold-out Quick View cannot add to cart",
      soldOut.disabled === true && /ناموجود/.test(soldOut.text),
      soldOut,
    );

    const hydration = browserErrors.filter((error) =>
      /hydration|server rendered html|did not match/i.test(error),
    );
    const runtime = browserErrors.filter((error) =>
      /uncaught|typeerror|referenceerror|syntaxerror/i.test(error),
    );
    record("No hydration mismatch", hydration.length === 0, hydration);
    record("No runtime exception", runtime.length === 0, runtime);
  } finally {
    await browser.close();
  }

  const failed = results.filter((result) => !result.pass);
  const report = {
    schemaVersion: 1,
    suite: "f4-f5-catalog-product-card-behavior",
    generatedAt: new Date().toISOString(),
    results,
    browserErrors,
    summary: {
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
    },
    pass: failed.length === 0,
  };

  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary));
  if (!report.pass) process.exitCode = 1;
}

withCatalogServer(
  {
    envName: "F4_F5_TEST_BASE_URL",
    port: 4176,
    logPath: "artifacts/runtime/f4-f5-behavior-server.txt",
  },
  run,
).catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});
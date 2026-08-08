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
import { withF7Server } from "./f7-browser-runner.mjs";

const ROOT = process.cwd();
const REPORT = path.join(ROOT, "artifacts/reports/f7-cart-checkout-behavior.json");
const CHROME_LOG = path.join(ROOT, "artifacts/runtime/f7-cart-checkout-chrome.txt");
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
      target.scrollIntoView({ block: 'center', inline: 'center' });
      target?.click();
      return Boolean(target);
    })()`,
  );
  if (!clicked) throw new Error(`Visible target not found: ${selector}`);
  await sleep(140);
}

async function activateVisible(client, selector) {
  const activated = await evaluate(
    client,
    `(() => {
      const target = [...document.querySelectorAll(${JSON.stringify(selector)})].find((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return node instanceof HTMLElement && !node.hasAttribute('disabled') && rect.width > 0 &&
          rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
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

async function key(client, keyName, code, keyCode) {
  await client.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: keyName,
    code,
    windowsVirtualKeyCode: keyCode,
  });
  await client.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: keyName,
    code,
    windowsVirtualKeyCode: keyCode,
  });
}

async function setField(client, selector, value) {
  const changed = await evaluate(
    client,
    `(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) return false;
      const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      setter?.call(element, ${JSON.stringify(value)});
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`,
  );
  if (!changed) throw new Error(`Field not found: ${selector}`);
  await sleep(80);
}

async function setPersistedCart(client, cart) {
  await evaluate(
    client,
    `(() => {
      const existing = JSON.parse(localStorage.getItem('sole-store') || '{}');
      const state = { ...(existing.state || {}), cart: ${JSON.stringify(cart)} };
      localStorage.setItem('sole-store', JSON.stringify({ ...existing, state }));
      return true;
    })()`,
  );
}

async function readPersistedCart(client) {
  return evaluate(
    client,
    `(() => {
      const persisted = JSON.parse(localStorage.getItem('sole-store') || '{}');
      return persisted.state?.cart || [];
    })()`,
  );
}

async function run(baseUrl) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  const browser = await openBrowser({ debugPort: 9250, logPath: CHROME_LOG });
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
    await evaluate(client, `localStorage.removeItem('sole-store'); sessionStorage.removeItem('sole-checkout-draft-v1'); true`);
    await navigate(client, `${baseUrl}/product/1`);
    await waitForExpression(client, `document.querySelector('[data-testid="product-purchase-panel"]')`);

    await click(client, '[data-testid="product-size-option"]');
    await click(client, '[data-testid="product-add-to-cart"]');
    await waitForExpression(client, `document.querySelector('[data-testid="cart-drawer"]')`);
    await key(client, "Escape", "Escape", 27);
    await waitForExpression(client, `!document.querySelector('[data-testid="cart-drawer"]')`);
    await activateVisible(client, '[data-testid="product-add-to-cart"]');
    await waitForExpression(client, `document.querySelector('[data-testid="cart-drawer"]')`);

    let persisted = await readPersistedCart(client);
    record(
      "Duplicate product and size merge into one line",
      persisted.length === 1 && persisted[0]?.id === 1 && persisted[0]?.qty === 2,
      persisted,
    );

    const drawerState = await evaluate(
      client,
      `(() => {
        const dialog = document.querySelector('[data-testid="cart-drawer"]');
        const count = document.querySelector('[data-testid="cart-drawer-count"]')?.textContent?.trim();
        return {
          count,
          activeInside: Boolean(dialog?.contains(document.activeElement)),
          bodyOverflow: getComputedStyle(document.body).overflow,
          bodyOverflowY: getComputedStyle(document.body).overflowY,
          checkout: Boolean(document.querySelector('[data-testid="cart-drawer-checkout"]')),
        };
      })()`,
    );
    record(
      "Drawer exposes count, focus containment, scroll lock and Checkout CTA",
      drawerState.count === "2" &&
        drawerState.activeInside &&
        [drawerState.bodyOverflow, drawerState.bodyOverflowY].includes("hidden") &&
        drawerState.checkout,
      drawerState,
    );

    await key(client, "Escape", "Escape", 27);
    await waitForExpression(client, `!document.querySelector('[data-testid="cart-drawer"]')`);
    const restored = await evaluate(client, `document.activeElement?.getAttribute('aria-label')`);
    record("Drawer Escape restores the actual cart trigger", restored === "Cart", restored);

    await click(client, '[data-testid="product-size-option"]:nth-of-type(2)');
    await click(client, '[data-testid="product-add-to-cart"]');
    await waitForExpression(client, `document.querySelector('[data-testid="cart-drawer"]')`);
    persisted = await readPersistedCart(client);
    record(
      "Cart identity is variant-aware by product and size",
      persisted.length === 2 && new Set(persisted.map((item) => item.size)).size === 2,
      persisted,
    );
    await key(client, "Escape", "Escape", 27);

    await navigate(client, `${baseUrl}/cart`);
    await waitForExpression(client, `document.querySelector('[data-testid="f7-cart-page"]')`);
    await waitForExpression(client, `!document.querySelector('[data-testid="cart-page-hydrating"]')`);
    const cartPage = await evaluate(
      client,
      `({
        items: document.querySelectorAll('[data-testid="cart-page-item"]').length,
        count: document.querySelector('[data-testid="cart-page-count"]')?.textContent?.trim(),
        noindex: document.querySelector('meta[name="robots"]')?.content,
        cta: Boolean(document.querySelector('[data-testid="cart-checkout-cta"]'))
      })`,
    );
    record(
      "Dedicated cart shares persisted state and is noindex",
      cartPage.items === 2 && cartPage.count === "3" && /noindex/.test(cartPage.noindex ?? "") && cartPage.cta,
      cartPage,
    );

    await navigate(client, `${baseUrl}/cart`);
    await waitForExpression(client, `document.querySelectorAll('[data-testid="cart-page-item"]').length === 2`);
    record("Cart survives a hard refresh", true, await readPersistedCart(client));

    const firstQtyBefore = await evaluate(
      client,
      `document.querySelector('[data-testid="cart-page-item"] output')?.textContent?.trim()`,
    );
    if (firstQtyBefore === "2") {
      await click(client, '[data-testid="cart-page-item"] [aria-label^="کاهش تعداد"]');
      await waitForExpression(
        client,
        `document.querySelector('[data-testid="cart-page-item"] output')?.textContent?.trim() === '1'`,
      );
    }
    const minimumState = await evaluate(
      client,
      `(() => {
        const item = document.querySelector('[data-testid="cart-page-item"]');
        return {
          qty: item?.querySelector('output')?.textContent?.trim(),
          decreaseDisabled: item?.querySelector('[aria-label^="کاهش تعداد"]')?.disabled,
        };
      })()`,
    );
    record(
      "Quantity stops at one without a fabricated inventory maximum",
      minimumState.qty === "1" && minimumState.decreaseDisabled === true,
      minimumState,
    );

    await click(client, '[data-testid="cart-page-item"] button[aria-label^="حذف"]');
    await waitForExpression(client, `document.activeElement?.id === 'cart-page-heading'`);
    record("Focus is recovered after line removal", true, null);

    await setPersistedCart(client, [
      { id: 999999, size: 42, qty: 1 },
      { id: 1, size: 999, qty: 1 },
    ]);
    await navigate(client, `${baseUrl}/cart`);
    await waitForExpression(client, `document.querySelector('[data-testid="cart-stale-warning"]')`);
    const stale = await evaluate(
      client,
      `({
        issues: document.querySelectorAll('[data-testid="cart-item-issue"]').length,
        blocked: Boolean(document.querySelector('[data-testid="cart-checkout-blocked"]')),
        items: document.querySelectorAll('[data-testid="cart-page-item"]').length
      })`,
    );
    record(
      "Stale persisted items remain visible, explain the issue and block Checkout",
      stale.items === 2 && stale.issues === 2 && stale.blocked,
      stale,
    );

    await setPersistedCart(client, [{ id: 1, size: 40, qty: 2 }]);
    await navigate(client, `${baseUrl}/cart`);
    await waitForExpression(client, `document.querySelector('[data-testid="cart-page-image"]')`);
    await evaluate(
      client,
      `document.querySelector('[data-testid="cart-page-image"]')?.dispatchEvent(new Event('error')); true`,
    );
    await waitForExpression(client, `document.querySelector('[data-testid="cart-page-image-fallback"]')`);
    record("Cart product image has a designed fallback", true, null);

    await navigate(client, `${baseUrl}/checkout`);
    await waitForExpression(client, `document.querySelector('[data-testid="checkout-form"]')`);
    const checkoutHead = await evaluate(
      client,
      `({
        noindex: document.querySelector('meta[name="robots"]')?.content,
        delivery: document.querySelector('[data-testid="checkout-delivery-boundary"]')?.textContent,
        payment: document.querySelector('[data-testid="checkout-payment-boundary"]')?.textContent
      })`,
    );
    record(
      "Direct Checkout deep-link is noindex and exposes shipping/payment boundaries",
      /noindex/.test(checkoutHead.noindex ?? "") &&
        /Backend/.test(checkoutHead.delivery ?? "") &&
        /متصل نیست|Backend/.test(checkoutHead.payment ?? ""),
      checkoutHead,
    );

    await activateVisible(client, '[data-testid="checkout-review-submit"]');
    await waitForExpression(client, `document.querySelector('[data-testid="checkout-error-summary"]')`);
    const invalid = await evaluate(
      client,
      `({
        errors: document.querySelectorAll('[aria-invalid="true"]').length,
        summaryFocused: document.activeElement === document.querySelector('[data-testid="checkout-error-summary"]')
      })`,
    );
    record(
      "Invalid Checkout fields expose associated errors and focused summary",
      invalid.errors >= 5 && invalid.summaryFocused,
      invalid,
    );

    await setField(client, '#checkout-firstName', 'سجاد');
    await setField(client, '#checkout-phone', '۰۹۱۲۱۲۳۴۵۶۷');
    await setField(client, '#checkout-province', 'تهران');
    await setField(client, '#checkout-city', 'تهران');
    await setField(client, '#checkout-address', 'خیابان نمونه، کوچه نمونه، ساختمان نمونه برای بررسی فرانت‌اند');
    await activateVisible(client, '[data-testid="checkout-review-submit"]');
    await waitForExpression(client, `document.querySelector('[data-testid="checkout-review"]')`);
    const review = await evaluate(
      client,
      `({
        focused: document.activeElement === document.querySelector('[data-testid="checkout-review"]'),
        finalDisabled: document.querySelector('[data-testid="checkout-final-action"]')?.disabled,
        finalText: document.querySelector('[data-testid="checkout-final-action"]')?.textContent?.trim(),
        phone: document.querySelector('[data-testid="checkout-review"]')?.textContent,
        subtotal: document.querySelector('[data-testid="checkout-subtotal"]')?.textContent?.trim()
      })`,
    );
    record(
      "Validated Review summarizes data and keeps real order action disabled",
      review.focused &&
        review.finalDisabled === true &&
        /ادامه پس از اتصال سرویس سفارش/.test(review.finalText ?? "") &&
        /09121234567/.test(review.phone ?? "") &&
        Boolean(review.subtotal),
      review,
    );

    await navigate(client, `${baseUrl}/checkout`);
    await waitForExpression(client, `document.querySelector('[data-testid="checkout-form"]')`);
    const refreshedDraft = await evaluate(
      client,
      `({
        name: document.querySelector('#checkout-firstName')?.value,
        address: document.querySelector('#checkout-address')?.value
      })`,
    );
    record(
      "Checkout draft survives refresh in sessionStorage",
      refreshedDraft.name === "سجاد" && /ساختمان نمونه/.test(refreshedDraft.address ?? ""),
      refreshedDraft,
    );

    await setPersistedCart(client, []);
    await navigate(client, `${baseUrl}/checkout`);
    await waitForExpression(client, `document.querySelector('[data-testid="checkout-empty-state"]')`);
    record("Checkout handles an empty cart without runtime failure", true, null);

    await client.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `if (location.search.includes('storageBlocked=1')) {
        for (const method of ['getItem', 'setItem', 'removeItem']) {
          Object.defineProperty(Storage.prototype, method, { configurable: true, value() { throw new DOMException('blocked', 'SecurityError'); } });
        }
      }`,
    });
    await navigate(client, `${baseUrl}/cart?storageBlocked=1`);
    await waitForExpression(client, `document.querySelector('[data-testid="cart-empty-state"]')`);
    record("Cart stays usable when localStorage operations fail", true, null);

    const meaningfulErrors = browserErrors.filter((text) =>
      /hydration|server rendered html|did not match|uncaught|typeerror|referenceerror|syntaxerror/i.test(text),
    );
    record("No hydration or runtime errors across Cart and Checkout", meaningfulErrors.length === 0, meaningfulErrors);
  } finally {
    await browser.close();
  }

  const failed = results.filter((result) => !result.pass);
  const report = {
    schemaVersion: 1,
    suite: "f7-cart-checkout-browser-behavior",
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

withF7Server(
  {
    envName: "F7_BEHAVIOR_BASE_URL",
    port: 4188,
    logPath: "artifacts/runtime/f7-cart-checkout-server.txt",
  },
  run,
).catch((error) => {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(
    REPORT,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        suite: "f7-cart-checkout-browser-behavior",
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

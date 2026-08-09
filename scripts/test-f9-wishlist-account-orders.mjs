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
import { withF9Server } from "./f9-browser-runner.mjs";

const ROOT = process.cwd();
const REPORT = path.join(ROOT, "artifacts/reports/f9-wishlist-account-orders-behavior.json");
const CHROME_LOG = path.join(ROOT, "artifacts/runtime/f9-wishlist-account-orders-chrome.txt");
const results = [];
const browserErrors = [];
const apiRequests = [];

function record(name, pass, evidence = null) {
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
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      });
      if (!(target instanceof HTMLElement)) return false;
      target.scrollIntoView({ block: 'center' });
      target.click();
      return true;
    })()`,
  );
  if (!clicked) throw new Error(`Visible target not found: ${selector}`);
  await sleep(140);
}

async function clickProductCardWishlist(client, productId) {
  const clicked = await evaluate(
    client,
    `(() => {
      const link = document.querySelector('a[href="/product/${productId}"]');
      const card = link?.closest('[data-testid="product-card"]');
      const target = card?.querySelector('button[aria-pressed]');
      if (!(target instanceof HTMLButtonElement)) return false;
      target.scrollIntoView({ block: 'center' });
      target.click();
      return true;
    })()`,
  );
  if (!clicked) throw new Error(`Wishlist control not found for product ${productId}`);
  await sleep(140);
}

async function fill(client, selector, value) {
  const changed = await evaluate(
    client,
    `(() => {
      const input = document.querySelector(${JSON.stringify(selector)});
      if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLTextAreaElement)) return false;
      const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      setter?.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`,
  );
  if (!changed) throw new Error(`Input not found: ${selector}`);
  await sleep(80);
}

async function pressKey(client, key, code = key) {
  const virtualKeyCode = key === "Enter" ? 13 : key === " " ? 32 : undefined;
  const text = key === "Enter" ? "\r" : key === " " ? " " : undefined;
  await client.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key,
    code,
    windowsVirtualKeyCode: virtualKeyCode,
    nativeVirtualKeyCode: virtualKeyCode,
    text,
    unmodifiedText: text,
  });
  await client.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
    code,
    windowsVirtualKeyCode: virtualKeyCode,
    nativeVirtualKeyCode: virtualKeyCode,
  });
  await sleep(140);
}

async function readPersisted(client) {
  return evaluate(
    client,
    `(() => {
      try { return JSON.parse(localStorage.getItem('sole-store') || '{}').state || {}; }
      catch { return {}; }
    })()`,
  );
}

async function run(baseUrl) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  const browser = await openBrowser({ debugPort: 9256, logPath: CHROME_LOG });
  const { client } = browser;

  await client.send("Network.enable");
  client.on("Network.requestWillBeSent", (event) => {
    if (event.type === "Fetch" || event.type === "XHR") {
      apiRequests.push({
        type: event.type,
        url: event.request.url,
        method: event.request.method,
      });
    }
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
    await viewport(client, 1280, 900);
    await navigate(client, `${baseUrl}/wishlist`);
    await evaluate(client, `localStorage.removeItem('sole-store'); true`);
    await navigate(client, `${baseUrl}/wishlist`);
    await waitForExpression(client, `document.querySelector('[data-testid="wishlist-empty"]')`);
    record("Wishlist has a truthful empty state", true);

    await evaluate(
      client,
      `localStorage.setItem('sole-store', JSON.stringify({ state: { wishlist: [1, 2], cart: [], recentlyViewed: [], searchHistory: [], user: null, demoAccountMode: 'guest', demoProfile: { name: 'کاربر نمایشی SOLE', email: 'demo@sole.local', phone: '' }, demoAddresses: [] }, version: 0 })); true`,
    );
    await navigate(client, `${baseUrl}/wishlist`);
    await waitForExpression(
      client,
      `document.querySelectorAll('[data-testid="wishlist-grid"] [data-testid="product-card"]').length === 2`,
    );
    const populated = await evaluate(
      client,
      `({ count: document.querySelectorAll('[data-testid="wishlist-grid"] [data-testid="product-card"]').length, text: document.querySelector('[data-testid="wishlist-count"]')?.textContent })`,
    );
    record(
      "Wishlist restores persisted Product Cards and count",
      populated.count === 2 && /۲|2/.test(populated.text ?? ""),
      populated,
    );

    const keyboardFocused = await evaluate(
      client,
      `(() => {
        const button = document.querySelector('[data-testid="wishlist-clear"]');
        if (!(button instanceof HTMLButtonElement)) return false;
        button.focus();
        return document.activeElement === button;
      })()`,
    );
    record("Wishlist clear control receives keyboard focus", keyboardFocused);
    await pressKey(client, "Enter");
    await waitForExpression(client, `document.querySelector('[data-testid="wishlist-empty"]')`);
    const cleared = await readPersisted(client);
    record(
      "Wishlist clear action works from keyboard and persists",
      Array.isArray(cleared.wishlist) && cleared.wishlist.length === 0,
      cleared.wishlist,
    );

    await navigate(client, `${baseUrl}/product/1`);
    await waitForExpression(client, `document.querySelector('[data-testid="product-wishlist"]')`);
    await click(client, '[data-testid="product-wishlist"]');
    let persisted = await readPersisted(client);
    record(
      "PDP wishlist action updates the shared persisted store",
      Array.isArray(persisted.wishlist) && persisted.wishlist.includes(1),
      persisted.wishlist,
    );

    await navigate(client, `${baseUrl}/products`);
    await waitForExpression(
      client,
      `document.querySelector('a[href="/product/1"]')?.closest('[data-testid="product-card"]')`,
    );
    const cardPressed = await evaluate(
      client,
      `document.querySelector('a[href="/product/1"]')?.closest('[data-testid="product-card"]')?.querySelector('button[aria-pressed]')?.getAttribute('aria-pressed')`,
    );
    record("ProductCard reflects PDP wishlist state", cardPressed === "true", cardPressed);
    await clickProductCardWishlist(client, 1);
    persisted = await readPersisted(client);
    record(
      "ProductCard removal synchronizes the shared wishlist",
      Array.isArray(persisted.wishlist) && !persisted.wishlist.includes(1),
      persisted.wishlist,
    );

    await navigate(client, `${baseUrl}/product/1`);
    await waitForExpression(client, `document.querySelector('[data-testid="product-wishlist"]')`);
    const pdpPressed = await evaluate(
      client,
      `document.querySelector('[data-testid="product-wishlist"]')?.getAttribute('aria-pressed')`,
    );
    record("PDP reflects ProductCard wishlist removal", pdpPressed === "false", pdpPressed);

    await navigate(client, `${baseUrl}/account`);
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="account-guest-state"]')`,
    );
    record("Account starts in guest state", true);

    await click(client, '[data-testid="account-start-demo"]');
    await waitForExpression(client, `document.querySelector('[data-testid="account-overview"]')`);
    persisted = await readPersisted(client);
    record(
      "Local demo session becomes active",
      persisted.demoAccountMode === "active",
      persisted.demoAccountMode,
    );

    await navigate(client, `${baseUrl}/account?section=profile`);
    await waitForExpression(client, `document.querySelector('[data-testid="account-profile"]')`);
    await fill(client, "#demo-profile-name", "");
    await fill(client, "#demo-profile-email", "invalid");
    await click(client, '[data-testid="account-profile-save"]');
    persisted = await readPersisted(client);
    const invalidStatus = await evaluate(
      client,
      `document.querySelector('[data-testid="account-profile"] [role="status"]')?.textContent`,
    );
    record(
      "Profile rejects required empty or invalid values without persistence",
      persisted.demoProfile?.name === "کاربر نمایشی SOLE" && /معتبر/.test(invalidStatus ?? ""),
      { profile: persisted.demoProfile, status: invalidStatus },
    );

    const profileRequestsBefore = apiRequests.length;
    const longPersianName = `سجاد ${"آزمایشی ".repeat(18).trim()}`;
    await fill(client, "#demo-profile-name", longPersianName);
    await fill(client, "#demo-profile-email", "sajad@example.com");
    await fill(client, "#demo-profile-phone", "");
    await click(client, '[data-testid="account-profile-save"]');
    persisted = await readPersisted(client);
    record(
      "Long Persian profile values and an empty optional phone persist locally",
      persisted.demoProfile?.name === longPersianName &&
        persisted.demoProfile?.email === "sajad@example.com" &&
        persisted.demoProfile?.phone === "",
      persisted.demoProfile,
    );
    record(
      "Profile save performs no Fetch/XHR backend synchronization",
      apiRequests.length === profileRequestsBefore,
      apiRequests.slice(profileRequestsBefore),
    );

    await navigate(client, `${baseUrl}/account?section=profile`);
    await waitForExpression(
      client,
      `document.querySelector('#demo-profile-name')?.value === ${JSON.stringify(longPersianName)}`,
    );
    record("Direct profile URL refresh restores local profile state", true);

    await navigate(client, `${baseUrl}/account?section=addresses`);
    await waitForExpression(client, `document.querySelector('[data-testid="account-addresses"]')`);
    await click(client, '[data-testid="account-address-add"]');
    persisted = await readPersisted(client);
    const emptyAddressStatus = await evaluate(
      client,
      `document.querySelector('[data-testid="account-addresses"] [role="status"]')?.textContent`,
    );
    record(
      "Address form rejects empty values",
      Array.isArray(persisted.demoAddresses) &&
        persisted.demoAddresses.length === 0 &&
        /کامل/.test(emptyAddressStatus ?? ""),
      { addresses: persisted.demoAddresses, status: emptyAddressStatus },
    );

    const addressRequestsBefore = apiRequests.length;
    const longPersianAddress = `خیابان ولیعصر، ${"کوچه آزمایشی پلاک ۱۲، ".repeat(14).trim()}`;
    await fill(client, "#demo-address-recipient", "گیرنده تست با نام فارسی طولانی");
    await fill(client, "#demo-address-city", "تهران");
    await fill(client, "#demo-address-line", longPersianAddress);
    await click(client, '[data-testid="account-address-add"]');
    await waitForExpression(
      client,
      `!document.querySelector('[data-testid="account-address-empty"]')`,
    );
    persisted = await readPersisted(client);
    record(
      "Long Persian address persists local-only data",
      Array.isArray(persisted.demoAddresses) &&
        persisted.demoAddresses.length === 1 &&
        persisted.demoAddresses[0]?.address === longPersianAddress,
      persisted.demoAddresses,
    );
    record(
      "Address add performs no Fetch/XHR backend synchronization",
      apiRequests.length === addressRequestsBefore,
      apiRequests.slice(addressRequestsBefore),
    );

    const removeButton = await evaluate(
      client,
      `(() => {
        const button = [...document.querySelectorAll('[data-testid="account-addresses"] button')]
          .find((item) => item.getAttribute('aria-label')?.startsWith('حذف آدرس'));
        if (!(button instanceof HTMLButtonElement)) return false;
        button.click();
        return true;
      })()`,
    );
    if (!removeButton) throw new Error("Address remove control not found");
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="account-address-empty"]')`,
    );
    persisted = await readPersisted(client);
    record(
      "Address removal persists locally",
      Array.isArray(persisted.demoAddresses) && persisted.demoAddresses.length === 0,
      persisted.demoAddresses,
    );
    record(
      "Address remove performs no Fetch/XHR backend synchronization",
      apiRequests.length === addressRequestsBefore,
      apiRequests.slice(addressRequestsBefore),
    );

    await navigate(client, `${baseUrl}/account?section=orders`);
    await waitForExpression(client, `document.querySelector('[data-testid="account-orders"]')`);
    const list = await evaluate(
      client,
      `({ rows: document.querySelectorAll('[data-testid="account-order-open"]').length, text: document.querySelector('[data-testid="account-orders"]')?.textContent })`,
    );
    record(
      "Demo order list is explicit and navigable",
      list.rows >= 2 && /نمایشی/.test(list.text ?? ""),
      list,
    );

    await click(client, '[data-testid="account-order-open"]');
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="account-order-detail"]')`,
    );
    const detail = await evaluate(
      client,
      `document.querySelector('[data-testid="account-order-detail"]')?.textContent`,
    );
    record(
      "Demo order detail avoids real payment or shipping claims",
      /تراکنش واقعی نیستند/.test(detail ?? "") &&
        /انجام نشده/.test(detail ?? "") &&
        /اطلاعات واقعی موجود نیست/.test(detail ?? ""),
      detail,
    );

    await evaluate(client, `history.back(); true`);
    await waitForExpression(client, `document.querySelector('[data-testid="account-orders"]')`);
    record("Browser back restores the orders list URL state", true);
    await evaluate(client, `history.forward(); true`);
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="account-order-detail"]')`,
    );
    record("Browser forward restores the order detail URL state", true);

    await navigate(client, `${baseUrl}/account?section=orders&order=SOLE-DEMO-2401`);
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="account-order-detail"]')`,
    );
    record("Order detail supports a direct deep link and refresh", true);

    await navigate(client, `${baseUrl}/account?section=orders&order=UNKNOWN`);
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="account-order-missing"]')`,
    );
    const missing = await evaluate(
      client,
      `document.querySelector('[data-testid="account-order-missing"]')?.textContent`,
    );
    record(
      "Unknown order has a designed no-backend state",
      /هیچ درخواست Backend انجام نشد/.test(missing ?? ""),
      missing,
    );

    await navigate(client, `${baseUrl}/account`);
    await waitForExpression(client, `document.querySelector('[data-testid="account-overview"]')`);
    await click(client, '[data-testid="account-expire-session"]');
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="account-expired-state"]')`,
    );
    persisted = await readPersisted(client);
    record(
      "Expired-session state persists",
      persisted.demoAccountMode === "expired",
      persisted.demoAccountMode,
    );

    await click(client, '[data-testid="account-restart-demo"]');
    await waitForExpression(client, `document.querySelector('[data-testid="account-overview"]')`);
    persisted = await readPersisted(client);
    record(
      "Expired session can restart locally",
      persisted.demoAccountMode === "active",
      persisted.demoAccountMode,
    );

    await viewport(client, 390, 844, true);
    await navigate(client, `${baseUrl}/account`);
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="mobile-account-link"]')`,
    );
    const mobileAccount = await evaluate(
      client,
      `({ current: document.querySelector('[data-testid="mobile-account-link"]')?.getAttribute('aria-current'), href: document.querySelector('[data-testid="mobile-account-link"]')?.getAttribute('href') })`,
    );
    record(
      "Mobile account navigation targets the account dashboard",
      mobileAccount.current === "page" && /\/account/.test(mobileAccount.href ?? ""),
      mobileAccount,
    );

    await click(client, '[data-testid="mobile-menu-trigger"]');
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="mobile-menu-content"] a[href="/wishlist"]')`,
    );
    record("Mobile global navigation exposes Wishlist", true);

    const meaningfulErrors = browserErrors.filter((text) =>
      /hydration|server rendered html|did not match|uncaught|typeerror|referenceerror|syntaxerror/i.test(
        text,
      ),
    );
    record("No hydration or runtime errors", meaningfulErrors.length === 0, meaningfulErrors);
  } finally {
    await browser.close();
  }

  const failed = results.filter((result) => !result.pass);
  const report = {
    schemaVersion: 1,
    suite: "f9-wishlist-account-orders-browser-behavior",
    generatedAt: new Date().toISOString(),
    results,
    browserErrors,
    apiRequests,
    summary: {
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
    },
    pass: failed.length === 0,
  };
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary));
  if (!report.pass) process.exitCode = 1;
}

withF9Server(
  {
    envName: "F9_BEHAVIOR_BASE_URL",
    port: 4196,
    logPath: "artifacts/runtime/f9-wishlist-account-orders-server.txt",
  },
  run,
).catch((error) => {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(
    REPORT,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        suite: "f9-wishlist-account-orders-browser-behavior",
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

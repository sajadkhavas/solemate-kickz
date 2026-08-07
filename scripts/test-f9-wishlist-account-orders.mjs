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

  client.on("Runtime.exceptionThrown", (event) => {
    browserErrors.push(event.exceptionDetails?.exception?.description ?? event.exceptionDetails?.text ?? "Runtime exception");
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
    await waitForExpression(client, `document.querySelectorAll('[data-testid="wishlist-grid"] [data-testid="product-card"]').length === 2`);
    const populated = await evaluate(
      client,
      `({ count: document.querySelectorAll('[data-testid="wishlist-grid"] [data-testid="product-card"]').length, text: document.querySelector('[data-testid="wishlist-count"]')?.textContent })`,
    );
    record("Wishlist restores persisted Product Cards", populated.count === 2 && /۲|2/.test(populated.text ?? ""), populated);

    await click(client, '[data-testid="wishlist-clear"]');
    await waitForExpression(client, `document.querySelector('[data-testid="wishlist-empty"]')`);
    const cleared = await readPersisted(client);
    record("Wishlist clear action persists", Array.isArray(cleared.wishlist) && cleared.wishlist.length === 0, cleared.wishlist);

    await navigate(client, `${baseUrl}/account`);
    await waitForExpression(client, `document.querySelector('[data-testid="account-guest-state"]')`);
    record("Account starts in guest state", true);

    await click(client, '[data-testid="account-start-demo"]');
    await waitForExpression(client, `document.querySelector('[data-testid="account-overview"]')`);
    let persisted = await readPersisted(client);
    record("Local demo session becomes active", persisted.demoAccountMode === "active", persisted.demoAccountMode);

    await navigate(client, `${baseUrl}/account?section=profile`);
    await waitForExpression(client, `document.querySelector('[data-testid="account-profile"]')`);
    await fill(client, '#demo-profile-name', 'سجاد تست');
    await fill(client, '#demo-profile-email', 'sajad@example.com');
    await fill(client, '#demo-profile-phone', '09120000000');
    await click(client, '[data-testid="account-profile-save"]');
    persisted = await readPersisted(client);
    record(
      "Profile edits persist locally",
      persisted.demoProfile?.name === "سجاد تست" && persisted.demoProfile?.email === "sajad@example.com",
      persisted.demoProfile,
    );

    await navigate(client, `${baseUrl}/account?section=addresses`);
    await waitForExpression(client, `document.querySelector('[data-testid="account-addresses"]')`);
    await fill(client, '#demo-address-recipient', 'گیرنده تست');
    await fill(client, '#demo-address-city', 'تهران');
    await fill(client, '#demo-address-line', 'نشانی نمایشی برای تست رابط کاربری SOLE');
    await click(client, '[data-testid="account-address-add"]');
    await waitForExpression(client, `!document.querySelector('[data-testid="account-address-empty"]')`);
    persisted = await readPersisted(client);
    record(
      "Address add persists local-only data",
      Array.isArray(persisted.demoAddresses) && persisted.demoAddresses.length === 1 && persisted.demoAddresses[0]?.city === "تهران",
      persisted.demoAddresses,
    );

    await navigate(client, `${baseUrl}/account?section=orders`);
    await waitForExpression(client, `document.querySelector('[data-testid="account-orders"]')`);
    const list = await evaluate(
      client,
      `({ rows: document.querySelectorAll('[data-testid="account-order-open"]').length, text: document.querySelector('[data-testid="account-orders"]')?.textContent })`,
    );
    record("Demo order list is explicit and navigable", list.rows >= 2 && /نمایشی/.test(list.text ?? ""), list);

    await click(client, '[data-testid="account-order-open"]');
    await waitForExpression(client, `document.querySelector('[data-testid="account-order-detail"]')`);
    const detail = await evaluate(client, `document.querySelector('[data-testid="account-order-detail"]')?.textContent`);
    record("Demo order detail avoids real payment or shipping claims", /تراکنش واقعی نیستند/.test(detail ?? "") && /انجام نشده/.test(detail ?? ""), detail);

    await navigate(client, `${baseUrl}/account?section=orders&order=UNKNOWN`);
    await waitForExpression(client, `document.querySelector('[data-testid="account-order-missing"]')`);
    const missing = await evaluate(client, `document.querySelector('[data-testid="account-order-missing"]')?.textContent`);
    record("Unknown order has a designed no-backend state", /هیچ درخواست Backend انجام نشد/.test(missing ?? ""), missing);

    await navigate(client, `${baseUrl}/account`);
    await waitForExpression(client, `document.querySelector('[data-testid="account-overview"]')`);
    await click(client, '[data-testid="account-expire-session"]');
    await waitForExpression(client, `document.querySelector('[data-testid="account-expired-state"]')`);
    persisted = await readPersisted(client);
    record("Expired-session state persists", persisted.demoAccountMode === "expired", persisted.demoAccountMode);

    await click(client, '[data-testid="account-restart-demo"]');
    await waitForExpression(client, `document.querySelector('[data-testid="account-overview"]')`);
    persisted = await readPersisted(client);
    record("Expired session can restart locally", persisted.demoAccountMode === "active", persisted.demoAccountMode);

    await viewport(client, 390, 844, true);
    await navigate(client, `${baseUrl}/account`);
    await waitForExpression(client, `document.querySelector('[data-testid="mobile-account-link"]')`);
    const mobileAccount = await evaluate(
      client,
      `({ current: document.querySelector('[data-testid="mobile-account-link"]')?.getAttribute('aria-current'), href: document.querySelector('[data-testid="mobile-account-link"]')?.getAttribute('href') })`,
    );
    record("Mobile account navigation targets the account dashboard", mobileAccount.current === "page" && /\/account/.test(mobileAccount.href ?? ""), mobileAccount);

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
    suite: "f9-wishlist-account-orders-browser-behavior",
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
    `${JSON.stringify({ schemaVersion: 1, suite: "f9-wishlist-account-orders-browser-behavior", pass: false, fatalError: error instanceof Error ? (error.stack ?? error.message) : String(error) }, null, 2)}\n`,
  );
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});

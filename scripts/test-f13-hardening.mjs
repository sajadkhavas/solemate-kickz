import fs from "node:fs";
import path from "node:path";

import {
  evaluate,
  navigate,
  openBrowser,
  serialiseArgument,
  waitForExpression,
} from "./browser-harness.mjs";
import { withF9Server } from "./f9-browser-runner.mjs";

const ROOT = process.cwd();
const REPORT = path.join(ROOT, "artifacts/reports/f13-hardening-behavior.json");
const CHROME_LOG = path.join(ROOT, "artifacts/runtime/f13-hardening-chrome.txt");
const results = [];
const browserErrors = [];

function record(name, pass, evidence = null) {
  results.push({ name, pass: Boolean(pass), evidence });
  if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
}

async function run(baseUrl) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  const browser = await openBrowser({
    debugPort: 9263,
    logPath: CHROME_LOG,
    width: 1280,
    height: 900,
  });
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
    await navigate(client, `${baseUrl}/cart`);
    await evaluate(
      client,
      `(() => {
        localStorage.setItem('sole-store', JSON.stringify({
          state: {
            cart: [{ id: 1, size: 40, qty: 9007199254740000 }],
            wishlist: [1, 999999, -1],
            recentlyViewed: [1, 999999],
            searchHistory: [${JSON.stringify("ج".repeat(500))}, '  Air   Max  ', 'Air Max'],
            user: { name: ${JSON.stringify("ن".repeat(500))}, email: ${JSON.stringify("e".repeat(500))} },
            demoAccountMode: 'active',
            demoProfile: {
              name: ${JSON.stringify("پ".repeat(500))},
              email: ${JSON.stringify("m".repeat(500))},
              phone: ${JSON.stringify("1".repeat(500))}
            },
            demoAddresses: Array.from({ length: 40 }, (_, index) => ({
              id: 'address-' + index,
              recipient: 'گیرنده ' + index,
              city: 'تهران',
              address: ${JSON.stringify("آ".repeat(900))}
            }))
          },
          version: 0
        }));
        return true;
      })()`,
    );

    await navigate(client, `${baseUrl}/cart`);
    await waitForExpression(client, `document.documentElement.dataset.soleHydrated === 'true'`);
    await waitForExpression(client, `document.querySelector('[data-testid="cart-page-count"]')`);
    const cartEvidence = await evaluate(
      client,
      `({
        count: document.querySelector('[data-testid="cart-page-count"]')?.textContent?.trim(),
        subtotal: document.querySelector('[data-testid="cart-page-subtotal"]')?.textContent?.trim(),
        bodyText: document.body.textContent ?? ''
      })`,
    );
    record(
      "Tampered persisted quantity is clamped to the client safety ceiling",
      /۹۹|99/.test(cartEvidence.count ?? "") && !/Infinity|∞/.test(cartEvidence.subtotal ?? ""),
      cartEvidence,
    );

    await navigate(client, `${baseUrl}/wishlist`);
    await waitForExpression(client, `document.documentElement.dataset.soleHydrated === 'true'`);
    await waitForExpression(client, `document.querySelector('[data-testid="wishlist-grid"]')`);
    const wishlistCount = await evaluate(
      client,
      `document.querySelectorAll('[data-testid="wishlist-grid"] [data-testid="product-card"]').length`,
    );
    record(
      "Unknown persisted wishlist product IDs are discarded",
      wishlistCount === 1,
      wishlistCount,
    );

    await navigate(client, `${baseUrl}/account?section=profile`);
    await waitForExpression(client, `document.querySelector('[data-testid="account-profile"]')`);
    const profileLengths = await evaluate(
      client,
      `({
        name: document.querySelector('#demo-profile-name')?.value?.length ?? -1,
        email: document.querySelector('#demo-profile-email')?.value?.length ?? -1
      })`,
    );
    record(
      "Persisted demo profile strings are bounded before rendering",
      profileLengths.name > 0 && profileLengths.name <= 160 && profileLengths.email <= 160,
      profileLengths,
    );

    const longQuery = "x".repeat(500);
    await navigate(client, `${baseUrl}/products?q=${longQuery}`);
    await waitForExpression(client, `document.querySelector('[data-testid="catalog-search"]')`);
    const catalogEvidence = await evaluate(
      client,
      `({
        value: document.querySelector('[data-testid="catalog-search"]')?.value ?? null,
        href: location.href
      })`,
    );
    record(
      "Oversized catalog query falls back without entering the filtering UI",
      catalogEvidence.value === "",
      catalogEvidence,
    );

    record(
      "F13 hardening flow emits no browser runtime errors",
      browserErrors.length === 0,
      browserErrors,
    );
  } finally {
    await browser.close();
  }
}

let fatalError = null;
try {
  await withF9Server(
    {
      envName: "F13_BASE_URL",
      port: 4189,
      logPath: "artifacts/runtime/f13-hardening-vite.txt",
    },
    run,
  );
} catch (error) {
  fatalError = error instanceof Error ? (error.stack ?? error.message) : String(error);
  console.error(fatalError);
}

const failed = results.filter((result) => !result.pass);
const report = {
  schemaVersion: 1,
  suite: "f13-hardening",
  generatedAt: new Date().toISOString(),
  summary: {
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    browserErrors: browserErrors.length,
  },
  results,
  browserErrors,
  fatalError,
  pass: failed.length === 0 && browserErrors.length === 0 && fatalError === null,
};

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (!report.pass) process.exitCode = 1;

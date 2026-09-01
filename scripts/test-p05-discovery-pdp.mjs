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
const REPORT = path.join(ROOT, "artifacts/reports/p05-discovery-pdp-behavior.json");
const CHROME_LOG = path.join(ROOT, "artifacts/runtime/p05-discovery-pdp-chrome.txt");
const results = [];
const browserErrors = [];

function record(name, pass, evidence) {
  results.push({ name, pass: Boolean(pass), evidence });
  if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
}

async function clickText(client, selector, text) {
  const clicked = await evaluate(
    client,
    `(() => {
      const target = [...document.querySelectorAll(${JSON.stringify(selector)})].find((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
          style.visibility !== 'hidden' && element.textContent?.includes(${JSON.stringify(text)});
      });
      if (!(target instanceof HTMLElement)) return false;
      target.scrollIntoView({ block: 'center', inline: 'center' });
      target.click();
      return true;
    })()`,
  );
  if (!clicked) throw new Error(`Visible text target not found: ${text}`);
  await sleep(120);
}

async function run(baseUrl) {
  const browser = await openBrowser({ debugPort: 9255, logPath: CHROME_LOG });
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
      `document.querySelector('[data-testid="catalog-search-form"]')?.getAttribute('data-interactive') === 'true'`,
    );
    await waitForExpression(
      client,
      `document.querySelectorAll('[data-testid="product-card"]').length > 0`,
    );

    const sortContract = await evaluate(
      client,
      `({
        merchandising: [...document.querySelectorAll('#catalog-sort option')].some((option) => option.value === 'popular' && option.textContent?.includes('چیدمان پیشنهادی فروشگاه')),
        fakePopularity: document.querySelector('#catalog-sort')?.textContent?.includes('بیشترین بازخورد داده') ?? false
      })`,
    );
    record(
      "Merchandising is explicit and not labeled as customer popularity",
      sortContract.merchandising && !sortContract.fakePopularity,
      sortContract,
    );

    await clickText(client, '[data-testid="catalog-filters"] button', "فقط ناموجود");
    await waitForExpression(
      client,
      `new URLSearchParams(location.search).get('availability') === 'out_of_stock'`,
    );
    await waitForExpression(
      client,
      `document.querySelectorAll('[data-testid="product-card"]').length > 0`,
    );
    const soldOutState = await evaluate(
      client,
      `({
        count: document.querySelectorAll('[data-testid="product-card"]').length,
        allSoldOut: [...document.querySelectorAll('[data-testid="product-card"]')].every((card) => /ناموجود/.test(card.textContent ?? '')),
        search: location.search
      })`,
    );
    record(
      "Availability out-of-stock filter is URL-backed and honest",
      soldOutState.count > 0 && soldOutState.allSoldOut,
      soldOutState,
    );

    await clickText(client, '[data-testid="catalog-filters"] button', "فقط موجود");
    await waitForExpression(
      client,
      `new URLSearchParams(location.search).get('availability') === 'in_stock'`,
    );
    await waitForExpression(
      client,
      `document.querySelectorAll('[data-testid="product-card"]').length > 0`,
    );
    const inStockState = await evaluate(
      client,
      `({
        count: document.querySelectorAll('[data-testid="product-card"]').length,
        noSoldOut: [...document.querySelectorAll('[data-testid="product-card"]')].every((card) => !/ناموجود/.test(card.textContent ?? '')),
        search: location.search
      })`,
    );
    record(
      "Availability in-stock filter is URL-backed",
      inStockState.count > 0 && inStockState.noSoldOut,
      inStockState,
    );

    await evaluate(
      client,
      `(() => {
        const select = document.querySelector('#catalog-sort');
        if (!(select instanceof HTMLSelectElement)) return false;
        select.value = 'popular';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`,
    );
    await waitForExpression(
      client,
      `new URLSearchParams(location.search).get('sort') === 'popular'`,
    );
    record(
      "Merchandising sort remains URL-backed",
      await evaluate(client, `new URLSearchParams(location.search).get('sort') === 'popular'`),
      await evaluate(client, `location.search`),
    );

    await navigate(client, `${baseUrl}/products?availability=out_of_stock&view=list`);
    await waitForExpression(client, `document.querySelector('[data-testid="catalog-results"]')`);
    const deepLink = await evaluate(
      client,
      `({
        pressed: [...document.querySelectorAll('[data-testid="catalog-filters"] button')].some((button) => button.textContent?.includes('فقط ناموجود') && button.getAttribute('aria-pressed') === 'true'),
        list: new URLSearchParams(location.search).get('view') === 'list'
      })`,
    );
    record("P05 discovery state survives deep links", deepLink.pressed && deepLink.list, deepLink);

    const hydration = browserErrors.filter((error) =>
      /hydration|server rendered html|did not match/i.test(error),
    );
    const runtime = browserErrors.filter((error) =>
      /uncaught|typeerror|referenceerror|syntaxerror/i.test(error),
    );
    record("No P05 hydration mismatch", hydration.length === 0, hydration);
    record("No P05 runtime exception", runtime.length === 0, runtime);
  } finally {
    await browser.close();
  }

  const failed = results.filter((result) => !result.pass);
  const report = {
    schemaVersion: 1,
    suite: "p05-discovery-pdp-behavior",
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
    envName: "P05_TEST_BASE_URL",
    port: 4185,
    logPath: "artifacts/runtime/p05-discovery-pdp-server.txt",
  },
  run,
).catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});

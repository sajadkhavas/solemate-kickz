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
const REPORT = path.join(ROOT, "artifacts/reports/f7-product-add-diagnostic.json");
const CHROME_LOG = path.join(ROOT, "artifacts/runtime/f7-product-add-diagnostic-chrome.txt");
const browserErrors = [];

async function physicalClick(client, selector) {
  return evaluate(
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
}

async function snapshot(client) {
  return evaluate(
    client,
    `(() => {
      const size = document.querySelector('[data-testid="product-size-option"]');
      const add = document.querySelector('[data-testid="product-add-to-cart"]');
      const rect = add?.getBoundingClientRect();
      const x = rect ? Math.max(0, Math.min(innerWidth - 1, rect.left + rect.width / 2)) : null;
      const y = rect ? Math.max(0, Math.min(innerHeight - 1, rect.top + rect.height / 2)) : null;
      const hit = x === null || y === null ? null : document.elementFromPoint(x, y);
      let persisted = null;
      try { persisted = JSON.parse(localStorage.getItem('sole-store') || '{}'); } catch {}
      return {
        sizePressed: size?.getAttribute('aria-pressed'),
        sizeText: size?.textContent?.trim(),
        addDisabled: add instanceof HTMLButtonElement ? add.disabled : null,
        addText: add?.textContent?.trim(),
        addRect: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null,
        hitTag: hit?.tagName ?? null,
        hitTestId: hit?.closest?.('[data-testid]')?.getAttribute('data-testid') ?? null,
        drawer: Boolean(document.querySelector('[data-testid="cart-drawer"]')),
        cart: persisted?.state?.cart ?? null,
        cartOpen: persisted?.state?.cartOpen ?? null,
        active: document.activeElement?.getAttribute('data-testid') || document.activeElement?.tagName,
      };
    })()`,
  );
}

async function run(baseUrl) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  const browser = await openBrowser({ debugPort: 9253, logPath: CHROME_LOG, width: 1280, height: 900 });
  const { client } = browser;

  client.on("Runtime.exceptionThrown", (event) => {
    browserErrors.push(
      event.exceptionDetails?.exception?.description ?? event.exceptionDetails?.text ?? "Runtime exception",
    );
  });
  client.on("Runtime.consoleAPICalled", (event) => {
    if (event.type === "error") browserErrors.push(event.args.map(serialiseArgument).join(" "));
  });

  let report;
  try {
    await navigate(client, `${baseUrl}/product/1`);
    await evaluate(client, `localStorage.removeItem('sole-store'); sessionStorage.removeItem('sole-checkout-draft-v1'); true`);
    await navigate(client, `${baseUrl}/product/1`);
    await waitForExpression(client, `document.querySelector('[data-testid="product-purchase-panel"]')`);

    const before = await snapshot(client);
    const sizeClicked = await physicalClick(client, '[data-testid="product-size-option"]');
    await waitForExpression(client, `document.querySelector('[data-testid="product-size-option"]')?.getAttribute('aria-pressed') === 'true'`);
    await waitForExpression(client, `document.querySelector('[data-testid="product-add-to-cart"]')?.disabled === false`);
    const afterSize = await snapshot(client);
    const addClicked = await physicalClick(client, '[data-testid="product-add-to-cart"]');
    await sleep(500);
    const afterAdd = await snapshot(client);

    report = {
      schemaVersion: 1,
      suite: "f7-product-add-diagnostic",
      generatedAt: new Date().toISOString(),
      sizeClicked,
      addClicked,
      before,
      afterSize,
      afterAdd,
      browserErrors,
      pass: Boolean(
        sizeClicked &&
          addClicked &&
          afterSize.sizePressed === "true" &&
          afterSize.addDisabled === false &&
          afterAdd.drawer &&
          Array.isArray(afterAdd.cart) &&
          afterAdd.cart.length === 1,
      ),
    };
  } finally {
    await browser.close();
  }

  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report));
  if (!report.pass) process.exitCode = 1;
}

withF7Server(
  {
    envName: "F7_PRODUCT_DIAGNOSTIC_BASE_URL",
    port: 4190,
    logPath: "artifacts/runtime/f7-product-add-diagnostic-server.txt",
  },
  run,
).catch((error) => {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  const report = {
    schemaVersion: 1,
    suite: "f7-product-add-diagnostic",
    generatedAt: new Date().toISOString(),
    browserErrors,
    pass: false,
    fatalError: error instanceof Error ? (error.stack ?? error.message) : String(error),
  };
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.error(report.fatalError);
  process.exitCode = 1;
});

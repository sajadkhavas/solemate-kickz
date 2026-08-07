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
const REPORT = path.join(ROOT, "artifacts/reports/f7-checkout-submit-diagnostic.json");
const CHROME_LOG = path.join(ROOT, "artifacts/runtime/f7-checkout-submit-diagnostic-chrome.txt");
const browserErrors = [];

async function run(baseUrl) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  const browser = await openBrowser({ debugPort: 9252, logPath: CHROME_LOG, width: 1280, height: 900 });
  const { client } = browser;

  client.on("Runtime.exceptionThrown", (event) => {
    browserErrors.push(
      event.exceptionDetails?.exception?.description ?? event.exceptionDetails?.text ?? "Runtime exception",
    );
  });
  client.on("Runtime.consoleAPICalled", (event) => {
    if (event.type === "error") browserErrors.push(event.args.map(serialiseArgument).join(" "));
  });

  let before = null;
  let after = null;
  try {
    await navigate(client, `${baseUrl}/`);
    await evaluate(
      client,
      `(() => {
        localStorage.removeItem('sole-store');
        sessionStorage.removeItem('sole-checkout-draft-v1');
        localStorage.setItem('sole-store', JSON.stringify({
          state: { cart: [{ id: 1, size: 40, qty: 2 }] },
          version: 0
        }));
        return true;
      })()`,
    );

    await navigate(client, `${baseUrl}/checkout`);
    await waitForExpression(client, `document.querySelector('[data-testid="checkout-form"]')`);
    await sleep(250);

    before = await evaluate(
      client,
      `(() => {
        const form = document.querySelector('[data-testid="checkout-form"]');
        const button = document.querySelector('[data-testid="checkout-review-submit"]');
        return {
          href: location.href,
          readyState: document.readyState,
          formPresent: form instanceof HTMLFormElement,
          buttonPresent: button instanceof HTMLButtonElement,
          buttonDisabled: button instanceof HTMLButtonElement ? button.disabled : null,
          formNoValidate: form instanceof HTMLFormElement ? form.noValidate : null,
          formValidity: form instanceof HTMLFormElement ? form.checkValidity() : null,
          summary: Boolean(document.querySelector('[data-testid="checkout-error-summary"]')),
          invalidCount: document.querySelectorAll('[aria-invalid="true"]').length,
          fields: {
            firstName: document.querySelector('#checkout-firstName')?.value,
            phone: document.querySelector('#checkout-phone')?.value,
            province: document.querySelector('#checkout-province')?.value,
            city: document.querySelector('#checkout-city')?.value,
            address: document.querySelector('#checkout-address')?.value,
          },
          active: document.activeElement?.getAttribute('data-testid') || document.activeElement?.id || document.activeElement?.tagName,
        };
      })()`,
    );

    const clicked = await evaluate(
      client,
      `(() => {
        const button = document.querySelector('[data-testid="checkout-review-submit"]');
        if (!(button instanceof HTMLButtonElement)) return false;
        button.scrollIntoView({ block: 'center', inline: 'center' });
        button.click();
        return true;
      })()`,
    );
    await sleep(700);

    after = await evaluate(
      client,
      `(() => ({
        href: location.href,
        readyState: document.readyState,
        formPresent: Boolean(document.querySelector('[data-testid="checkout-form"]')),
        buttonPresent: Boolean(document.querySelector('[data-testid="checkout-review-submit"]')),
        summary: Boolean(document.querySelector('[data-testid="checkout-error-summary"]')),
        invalidCount: document.querySelectorAll('[aria-invalid="true"]').length,
        active: document.activeElement?.getAttribute('data-testid') || document.activeElement?.id || document.activeElement?.tagName,
        sessionDraft: sessionStorage.getItem('sole-checkout-draft-v1'),
      }))()`,
    );

    const report = {
      schemaVersion: 1,
      suite: "f7-checkout-submit-diagnostic",
      generatedAt: new Date().toISOString(),
      clicked,
      before,
      after,
      browserErrors,
      pass: Boolean(clicked && after?.summary && after?.invalidCount >= 5),
    };
    fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report));
  } finally {
    await browser.close();
  }
}

withF7Server(
  {
    envName: "F7_DIAGNOSTIC_BASE_URL",
    port: 4189,
    logPath: "artifacts/runtime/f7-checkout-submit-diagnostic-server.txt",
  },
  run,
).catch((error) => {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  const report = {
    schemaVersion: 1,
    suite: "f7-checkout-submit-diagnostic",
    generatedAt: new Date().toISOString(),
    before,
    after,
    browserErrors,
    pass: false,
    fatalError: error instanceof Error ? (error.stack ?? error.message) : String(error),
  };
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.error(report.fatalError);
  process.exitCode = 1;
});

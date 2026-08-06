import path from "node:path";

import { evaluate, navigate, openBrowser, serialiseArgument, sleep, waitForExpression } from "./browser-harness.mjs";
import { withCatalogServer } from "./f4-f5-browser-runner.mjs";

const ROOT = process.cwd();
const errors = [];

async function run(baseUrl) {
  const browser = await openBrowser({
    debugPort: 9248,
    logPath: path.join(ROOT, "artifacts/runtime/f4-f5-size-diagnostic-chrome.txt"),
  });
  const { client } = browser;

  client.on("Runtime.exceptionThrown", (event) => {
    errors.push(event.exceptionDetails?.exception?.description ?? event.exceptionDetails?.text ?? "Runtime exception");
  });
  client.on("Runtime.consoleAPICalled", (event) => {
    if (event.type === "error") errors.push(event.args.map(serialiseArgument).join(" "));
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
    await navigate(client, `${baseUrl}/products?q=Nike&quick=sale&sort=newest&view=grid`);
    await waitForExpression(client, `document.querySelector('[data-testid="catalog-size-filter"][data-size="42"]')`);

    const before = await evaluate(
      client,
      `([...document.querySelectorAll('[data-testid="catalog-size-filter"][data-size="42"]')].map((button, index) => {
        const rect = button.getBoundingClientRect();
        const style = getComputedStyle(button);
        return {
          index,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          display: style.display,
          visibility: style.visibility,
          pointerEvents: style.pointerEvents,
          disabled: button.disabled,
          pressed: button.getAttribute('aria-pressed'),
          connected: button.isConnected,
          text: button.textContent,
        };
      }))`,
    );
    console.log("SIZE_DIAGNOSTIC_BEFORE", JSON.stringify({ search: await evaluate(client, `location.search`), buttons: before }));

    const dispatched = await evaluate(
      client,
      `(() => {
        const target = [...document.querySelectorAll('[data-testid="catalog-size-filter"][data-size="42"]')]
          .find((button) => {
            const rect = button.getBoundingClientRect();
            const style = getComputedStyle(button);
            return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
          });
        if (!target) return { found: false };
        target.focus();
        const dispatchResult = target.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          composed: true,
          view: window,
        }));
        return {
          found: true,
          dispatchResult,
          focused: document.activeElement === target,
          pressedImmediately: target.getAttribute('aria-pressed'),
        };
      })()`,
    );
    await sleep(1_500);

    const after = await evaluate(
      client,
      `({
        search: location.search,
        buttons: [...document.querySelectorAll('[data-testid="catalog-size-filter"][data-size="42"]')].map((button, index) => ({
          index,
          pressed: button.getAttribute('aria-pressed'),
          width: button.getBoundingClientRect().width,
          height: button.getBoundingClientRect().height,
        })),
        chips: [...document.querySelectorAll('[aria-label="فیلترهای فعال"] button')].map((button) => button.textContent?.trim()),
        resultCount: document.querySelectorAll('[data-testid="product-card"]').length,
      })`,
    );
    console.log("SIZE_DIAGNOSTIC_DISPATCH", JSON.stringify(dispatched));
    console.log("SIZE_DIAGNOSTIC_AFTER", JSON.stringify(after));
    console.log("SIZE_DIAGNOSTIC_ERRORS", JSON.stringify(errors));

    if (!new URLSearchParams(after.search).get("sizes")) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

withCatalogServer(
  {
    envName: "F4_F5_DIAGNOSTIC_BASE_URL",
    port: 4178,
    logPath: "artifacts/runtime/f4-f5-size-diagnostic-server.txt",
  },
  run,
).catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});

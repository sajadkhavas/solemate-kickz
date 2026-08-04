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
  waitForHttp,
} from "./browser-harness.mjs";

const ROOT = process.cwd();
const BASE_URL = process.env.FOUNDATION_BASE_URL ?? "http://127.0.0.1:4174";
const REPORT_PATH = path.join(ROOT, "artifacts/reports/f0-f1-behavior.json");
const LOG_PATH = path.join(ROOT, "artifacts/runtime/behavior-chrome.txt");
const results = [];
const browserErrors = [];

function record(name, pass, evidence) {
  results.push({ name, pass, evidence });
  if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
}

async function click(client, selector) {
  if (selector === '[aria-label="Cart"]') {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await evaluate(
        client,
        `(() => {
          const candidates = [...document.querySelectorAll('[aria-label="Cart"]')];
          const target = candidates.find((element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return element.tagName === 'BUTTON' && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          });
          target?.click();
          return Boolean(target);
        })()`,
      );
      await sleep(200);
      if (await evaluate(client, `Boolean(document.querySelector('[role="dialog"]'))`)) return;
    }
    throw new Error("Cart trigger did not open the dialog after 20 attempts.");
  }

  await evaluate(client, `document.querySelector(${JSON.stringify(selector)})?.click()`);
}

async function mountPrimitiveFixture(client) {
  await navigate(client, `${BASE_URL}/`);
  await evaluate(
    client,
    `(async () => {
      document.getElementById('app')?.remove();
      const mount = document.createElement('div');
      mount.id = 'app';
      mount.setAttribute('data-foundation-test-mount', 'true');
      mount.style.position = 'fixed';
      mount.style.inset = '0';
      mount.style.zIndex = '2147483647';
      mount.style.overflow = 'auto';
      mount.style.background = '#0a0a0a';
      document.body.append(mount);
      await import('/scripts/fixtures/foundation-behavior-entry.tsx?acceptance=1');
      return true;
    })()`,
  );
  await waitForExpression(client, `document.querySelector('[data-testid="foundation-harness"]')`);
}

async function main() {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  await waitForHttp(BASE_URL);
  const browser = await openBrowser({ debugPort: 9224, logPath: LOG_PATH });
  const { client } = browser;

  client.on("Runtime.exceptionThrown", (event) => {
    browserErrors.push(
      event.exceptionDetails?.exception?.description ??
        event.exceptionDetails?.text ??
        "Runtime exception",
    );
  });
  client.on("Runtime.consoleAPICalled", (event) => {
    if (event.type === "error") {
      browserErrors.push(event.args.map(serialiseArgument).join(" "));
    }
  });

  try {
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: 1280,
      screenHeight: 800,
    });

    await mountPrimitiveFixture(client);

    const defaultButton = await evaluate(
      client,
      `(() => {
        const form = document.querySelector('[data-testid="button-form"]');
        const button = document.querySelector('[data-testid="button-default"]');
        button?.click();
        return { type: button?.type, attr: button?.getAttribute('type'), submits: form?.dataset.submits };
      })()`,
    );
    await sleep(50);
    defaultButton.submitsAfter = await evaluate(
      client,
      `document.querySelector('[data-testid="button-form"]')?.dataset.submits`,
    );
    record(
      "Button default type",
      defaultButton.type === "button" && defaultButton.attr === "button" && defaultButton.submitsAfter === "0",
      defaultButton,
    );

    const loading = await evaluate(
      client,
      `(() => {
        const button = document.querySelector('[data-testid="button-loading"]');
        return {
          disabled: button?.disabled,
          busy: button?.getAttribute('aria-busy'),
          loading: button?.dataset.loading,
          text: button?.textContent?.trim(),
        };
      })()`,
    );
    record(
      "Button loading and disabled behavior",
      loading.disabled === true && loading.busy === "true" && loading.loading === "true" && loading.text.includes("Loading acceptance"),
      loading,
    );

    const icon = await evaluate(
      client,
      `(() => {
        const button = document.querySelector('[data-testid="icon-button"]');
        return { tag: button?.tagName.toLowerCase(), label: button?.getAttribute('aria-label') };
      })()`,
    );
    record("IconButton accessible name", icon.tag === "button" && icon.label === "Acceptance icon", icon);

    const quantity = async () =>
      evaluate(
        client,
        `(() => {
          const group = document.querySelector('[aria-label="Acceptance quantity"]');
          const buttons = [...group.querySelectorAll('button')];
          return { value: group.querySelector('output')?.textContent?.trim(), down: buttons[0]?.disabled, up: buttons[1]?.disabled };
        })()`,
      );
    const minimum = await quantity();
    await click(client, `[aria-label="Acceptance quantity"] button:last-of-type`);
    await waitForExpression(client, `document.querySelector('[aria-label="Acceptance quantity"] output')?.textContent?.trim() === '2'`);
    const maximum = await quantity();
    await click(client, `[aria-label="Acceptance quantity"] button:first-of-type`);
    await waitForExpression(client, `document.querySelector('[aria-label="Acceptance quantity"] output')?.textContent?.trim() === '1'`);
    record(
      "QuantityStepper minimum and maximum behavior",
      minimum.value === "1" && minimum.down === true && minimum.up === false && maximum.value === "2" && maximum.down === false && maximum.up === true,
      { minimum, maximum },
    );

    const price = await evaluate(
      client,
      `(() => {
        const wrapper = document.querySelector('[data-testid="price"]');
        const numeric = wrapper?.querySelector('bdi');
        return { wrapperDir: wrapper?.getAttribute('dir'), numericDir: numeric?.getAttribute('dir'), text: numeric?.textContent?.trim() };
      })()`,
    );
    record(
      "Price direction rendering",
      price.wrapperDir === "rtl" && price.numericDir === "ltr" && Boolean(price.text),
      price,
    );

    await navigate(client, `${BASE_URL}/`);
    await waitForExpression(client, `document.querySelector('[aria-label="Cart"]')`);
    const skip = await evaluate(
      client,
      `(() => {
        const link = document.querySelector('a.skip-link');
        const target = link ? document.querySelector(link.getAttribute('href')) : null;
        return { href: link?.getAttribute('href'), count: document.querySelectorAll('#main-content').length, tabIndex: target?.tabIndex };
      })()`,
    );
    record("Skip-link target", skip.href === "#main-content" && skip.count === 1 && skip.tabIndex === -1, skip);

    await click(client, `[aria-label="Cart"]`);
    await waitForExpression(client, `document.querySelector('[role="dialog"]')`);
    const opened = await evaluate(
      client,
      `(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return {
          open: Boolean(dialog),
          activeInside: Boolean(dialog?.contains(document.activeElement)),
          overflow: getComputedStyle(document.body).overflow,
          overflowY: getComputedStyle(document.body).overflowY,
        };
      })()`,
    );
    record(
      "Cart Drawer open and body scroll lock",
      opened.open && opened.activeInside && [opened.overflow, opened.overflowY].includes("hidden"),
      opened,
    );

    const focusTrail = [];
    for (let index = 0; index < 12; index += 1) {
      await client.send("Input.dispatchKeyEvent", {
        type: "keyDown",
        key: "Tab",
        code: "Tab",
        windowsVirtualKeyCode: 9,
      });
      await client.send("Input.dispatchKeyEvent", {
        type: "keyUp",
        key: "Tab",
        code: "Tab",
        windowsVirtualKeyCode: 9,
      });
      focusTrail.push(
        await evaluate(
          client,
          `(() => {
            const dialog = document.querySelector('[role="dialog"]');
            return { inside: Boolean(dialog?.contains(document.activeElement)), label: document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent?.trim().slice(0, 60) };
          })()`,
        ),
      );
    }
    record("Cart Drawer focus trap", focusTrail.every((item) => item.inside), focusTrail);

    await client.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
    });
    await client.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
    });
    await waitForExpression(client, `!document.querySelector('[role="dialog"]')`);
    const escaped = await evaluate(
      client,
      `({ closed: !document.querySelector('[role="dialog"]'), restored: document.activeElement?.getAttribute('aria-label'), overflow: getComputedStyle(document.body).overflow })`,
    );
    record(
      "Cart Drawer Escape close and focus restoration",
      escaped.closed && escaped.restored === "Cart" && escaped.overflow !== "hidden",
      escaped,
    );

    await click(client, `[aria-label="Cart"]`);
    await waitForExpression(client, `document.querySelector('[data-foundation-dialog="cart"]')`);
    const point = await evaluate(
      client,
      `(() => {
        const rect = document.querySelector('[data-foundation-dialog="cart"]').getBoundingClientRect();
        return { x: rect.left > 20 ? 10 : innerWidth - 10, y: Math.round(innerHeight / 2) };
      })()`,
    );
    await client.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: point.x,
      y: point.y,
      button: "left",
      clickCount: 1,
    });
    await client.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: point.x,
      y: point.y,
      button: "left",
      clickCount: 1,
    });
    await waitForExpression(client, `!document.querySelector('[role="dialog"]')`);
    const dismissed = await evaluate(
      client,
      `({ closed: !document.querySelector('[role="dialog"]'), restored: document.activeElement?.getAttribute('aria-label') })`,
    );
    record(
      "Cart Drawer overlay dismissal policy",
      dismissed.closed && dismissed.restored === "Cart",
      { point, dismissed },
    );

    await click(client, `a[href="/products"]`);
    await waitForExpression(client, `location.pathname === '/products'`);
    await waitForExpression(client, `document.activeElement?.id === 'main-content'`);
    const routeFocus = await evaluate(
      client,
      `({ path: location.pathname, activeId: document.activeElement?.id, count: document.querySelectorAll('#main-content').length })`,
    );
    record(
      "Route-change focus",
      routeFocus.path === "/products" && routeFocus.activeId === "main-content" && routeFocus.count === 1,
      routeFocus,
    );

    await client.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await navigate(client, `${BASE_URL}/`);
    await sleep(300);
    const reduced = await evaluate(
      client,
      `(() => {
        const motionAnimations = document.getAnimations().filter((animation) => {
          const timing = animation.effect?.getComputedTiming();
          const frames = animation.effect?.getKeyframes?.() || [];
          const transforms = frames.some((frame) => frame.transform && frame.transform !== 'none');
          return timing?.iterations === Infinity || (transforms && Number(timing?.duration || 0) > 20);
        });
        const cursor = document.querySelector('[data-foundation-cursor]');
        return { matches: matchMedia('(prefers-reduced-motion: reduce)').matches, motionAnimations: motionAnimations.length, cursor: cursor ? getComputedStyle(cursor).display : null };
      })()`,
    );
    record(
      "Reduced-motion behavior",
      reduced.matches && reduced.motionAnimations === 0 && [null, "none"].includes(reduced.cursor),
      reduced,
    );

    const meaningfulErrors = browserErrors.filter((text) =>
      /hydration|hydrated|server rendered html|did not match|uncaught|typeerror|referenceerror|syntaxerror/i.test(text),
    );
    record("No hydration or runtime errors", meaningfulErrors.length === 0, meaningfulErrors);
  } finally {
    await browser.close();
  }

  const failed = results.filter((result) => !result.pass);
  const report = {
    schemaVersion: 1,
    suite: "f0-f1-browser-behavior",
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
    },
    results,
    pass: failed.length === 0,
  };
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary));
  console.log(`Behavior report: ${path.relative(ROOT, REPORT_PATH)}`);
  if (!report.pass) process.exitCode = 1;
}

main().catch((error) => {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(
    REPORT_PATH,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        suite: "f0-f1-browser-behavior",
        generatedAt: new Date().toISOString(),
        pass: false,
        fatalError: error instanceof Error ? error.stack ?? error.message : String(error),
      },
      null,
      2,
    )}\n`,
  );
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});

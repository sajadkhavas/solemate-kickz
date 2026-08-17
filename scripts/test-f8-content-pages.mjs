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
import { withF8Server } from "./f8-browser-runner.mjs";

const ROOT = process.cwd();
const REPORT = path.join(ROOT, "artifacts/reports/f8-content-pages-behavior.json");
const CHROME_LOG = path.join(ROOT, "artifacts/runtime/f8-behavior-chrome.txt");
const results = [];
const browserErrors = [];

function record(name, pass, evidence) {
  results.push({ name, pass: Boolean(pass), evidence });
  if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
}

async function waitForHydration(client, selector) {
  await waitForExpression(
    client,
    `(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      return Boolean(element && Object.keys(element).some((key) => key.startsWith('__reactProps$')));
    })()`,
    15_000,
  );
}

async function setValue(client, selector, value) {
  await waitForHydration(client, selector);
  const selected = await evaluate(
    client,
    `(() => {
      const input = document.querySelector(${JSON.stringify(selector)});
      if (!(input instanceof HTMLInputElement)) return false;
      input.focus();
      input.select();
      return true;
    })()`,
  );
  if (!selected) throw new Error(`Input not found: ${selector}`);
  await sleep(150);
  for (const character of value) {
    await client.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: character,
      text: character,
      unmodifiedText: character,
    });
    await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: character });
  }
  await sleep(150);
}

async function press(client, key) {
  await client.send("Input.dispatchKeyEvent", { type: "keyDown", key, code: key });
  await client.send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key });
  await sleep(80);
}

async function run(baseUrl) {
  const browser = await openBrowser({ debugPort: 9238, logPath: CHROME_LOG });
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
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: 1280,
      screenHeight: 800,
    });

    await navigate(client, `${baseUrl}/about`);
    await waitForExpression(client, `document.querySelector('main h1')`);
    await evaluate(client, `document.querySelector('main a[href="/products"]')?.click()`);
    await waitForExpression(client, `location.pathname === '/products'`);
    const aboutPath = await evaluate(client, `location.pathname`);
    record("About CTA navigation", aboutPath === "/products", aboutPath);

    await navigate(client, `${baseUrl}/brands`);
    await waitForExpression(client, `document.querySelectorAll('[data-brand-name]').length > 0`);
    const brandData = await evaluate(
      client,
      `(async () => {
        const { BRANDS, SHOES } = await import('/src/data/shoes.ts');
        const cards = [...document.querySelectorAll('[data-brand-name]')].map((card) => ({
          name: card.dataset.brandName,
          count: Number(card.dataset.productCount),
        }));
        const expected = [...new Set(BRANDS)]
          .map((name) => ({ name, count: SHOES.filter((shoe) => shoe.brand === name).length }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
        return { cards, expected, exact: JSON.stringify(cards) === JSON.stringify(expected) };
      })()`,
    );
    record("Brands real-data rendering", brandData.exact, brandData);

    await setValue(client, "#brand-search", "Nike");
    await waitForExpression(client, `document.querySelector('#brand-search')?.value === 'Nike'`);
    await waitForExpression(client, `document.querySelectorAll('[data-brand-name]').length === 1`);
    const searchResult = await evaluate(
      client,
      `document.querySelector('[data-brand-name]')?.dataset.brandName`,
    );
    record("Brand search/filter", searchResult === "Nike", searchResult);

    await setValue(client, "#brand-search", "__missing_brand__");
    await waitForExpression(
      client,
      `document.body.textContent.includes('برندی با این عبارت پیدا نشد')`,
    );
    const noResult = await evaluate(
      client,
      `document.body.textContent.includes('برندی با این عبارت پیدا نشد')`,
    );
    record("Brand no-result state", noResult, noResult);

    await navigate(client, `${baseUrl}/auth`);
    await waitForExpression(client, `document.querySelector('#auth-email')`);
    await waitForHydration(client, `[data-testid="auth-form"]`);
    await evaluate(client, `document.querySelector('#auth-email')?.focus()`);
    await press(client, "Tab");
    const keyboardTarget = await evaluate(
      client,
      `({ id: document.activeElement?.id, name: document.activeElement?.getAttribute('name'), type: document.activeElement?.getAttribute('type') })`,
    );
    record(
      "Auth keyboard flow",
      keyboardTarget.name === "password" || keyboardTarget.type === "button",
      keyboardTarget,
    );

    await evaluate(client, `document.querySelector('[data-testid="auth-form"]')?.requestSubmit()`);
    await waitForExpression(client, `document.querySelectorAll('[role="alert"]').length >= 2`);
    const validation = await evaluate(
      client,
      `({ alerts: document.querySelectorAll('[role="alert"]').length, emailInvalid: document.querySelector('#auth-email')?.getAttribute('aria-invalid'), passwordInvalid: document.querySelector('#auth-password')?.getAttribute('aria-invalid') })`,
    );
    record(
      "Auth validation",
      validation.alerts >= 2 &&
        validation.emailInvalid === "true" &&
        validation.passwordInvalid === "true",
      validation,
    );
    const focusedInvalid = await evaluate(client, `document.activeElement?.id`);
    record("Focus on first invalid field", focusedInvalid === "auth-email", focusedInvalid);

    await setValue(client, "#auth-email", "user@example.com");
    await setValue(client, "#auth-password", "password-123");
    await evaluate(
      client,
      `(() => {
        const form = document.querySelector('[data-testid="auth-form"]');
        form?.requestSubmit();
        form?.requestSubmit();
      })()`,
    );
    await sleep(60);
    const doubleSubmit = await evaluate(
      client,
      `({ busy: document.querySelector('[data-testid="auth-form"]')?.getAttribute('aria-busy'), disabled: document.querySelector('[data-testid="auth-form"] button[type="submit"]')?.disabled, statuses: document.querySelectorAll('#auth-backend-status').length })`,
    );
    record(
      "Double-submit prevention",
      doubleSubmit.busy === "true" && doubleSubmit.disabled === true && doubleSubmit.statuses <= 1,
      doubleSubmit,
    );

    await waitForExpression(client, `document.querySelector('#auth-backend-status')`);
    const backendState = await evaluate(
      client,
      `document.querySelector('#auth-backend-status')?.textContent`,
    );
    record(
      "Honest unavailable-backend state",
      /متصل نیست/.test(backendState) && !/موفق/.test(backendState),
      backendState,
    );

    const beforeType = await evaluate(client, `document.querySelector('#auth-password')?.type`);
    await evaluate(client, `document.querySelector('[aria-controls="auth-password"]')?.click()`);
    const afterType = await evaluate(client, `document.querySelector('#auth-password')?.type`);
    record("Password visibility behavior", beforeType === "password" && afterType === "text", {
      beforeType,
      afterType,
    });

    record("Accordion keyboard behavior", true, {
      applicable: false,
      reason: "No F8 accordion exists in route inventory.",
    });
    record("Size Guide dialog behavior", true, {
      applicable: false,
      reason: "No Size Guide route or dialog exists.",
    });
    record("Escape Close", true, { applicable: false, reason: "F8 introduces no dialog." });
    record("Focus Restoration", true, {
      applicable: false,
      reason: "F8 introduces no dialog.",
    });

    const contacts = await evaluate(
      client,
      `[...document.querySelectorAll('a[href^="mailto:"],a[href^="tel:"]')].map((link) => link.getAttribute('href'))`,
    );
    record(
      "Contact link validity",
      contacts.every((href) =>
        /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$|^tel:\+?[0-9][0-9 -]{5,}$/i.test(href),
      ),
      contacts,
    );

    await navigate(client, `${baseUrl}/about`);
    await evaluate(
      client,
      `(() => {
        const link = document.querySelector('main a[href="/brands"]');
        link?.focus();
        return document.activeElement === link;
      })()`,
    );
    await press(client, "Enter");
    await waitForExpression(client, `location.pathname === '/brands'`);
    await waitForExpression(client, `document.activeElement?.id === 'main-content'`, 5_000);
    const routeFocus = await evaluate(client, `document.activeElement?.id`);
    record("Route focus", routeFocus === "main-content", routeFocus);

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
    suite: "f8-content-pages-behavior",
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

withF8Server(
  {
    envName: "F8_TEST_BASE_URL",
    port: 4175,
    logPath: "artifacts/runtime/f8-behavior-server.txt",
  },
  run,
).catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});

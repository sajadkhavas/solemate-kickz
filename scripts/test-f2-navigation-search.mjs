import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  evaluate,
  navigate,
  openBrowser,
  serialiseArgument,
  waitForExpression,
  waitForHttp,
} from "./browser-harness.mjs";
import { delegateToDevServer } from "./f2-browser-runner.mjs";

const ROOT = process.cwd();
const ENV_NAME = "F2_BEHAVIOR_BASE_URL";
const BASE_URL = process.env[ENV_NAME] ?? "http://127.0.0.1:4182";
const REPORT_PATH = path.join(ROOT, "artifacts/reports/f2-navigation-search-behavior.json");
const LOG_PATH = path.join(ROOT, "artifacts/runtime/f2-behavior-chrome.txt");
const results = [];
const browserErrors = [];

const bodyLockedExpression = `(() => {
  const computed = getComputedStyle(document.body);
  return document.body.hasAttribute('data-scroll-locked') || computed.overflow === 'hidden' || computed.overflowY === 'hidden';
})()`;

const historyExpression = `(() => {
  const persisted = JSON.parse(localStorage.getItem('sole-store') || '{}');
  return persisted.state?.searchHistory || [];
})()`;

function record(name, pass, evidence) {
  results.push({ name, pass: Boolean(pass), evidence });
  if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
}

async function visibleClick(client, selector) {
  const clicked = await evaluate(
    client,
    `(() => {
      const candidates = [...document.querySelectorAll(${JSON.stringify(selector)})];
      const target = candidates.find((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      });
      target?.click();
      return Boolean(target);
    })()`,
  );
  if (!clicked) throw new Error(`Visible target not found: ${selector}`);
}

async function key(client, value, { code = value, keyCode = 0, shift = false } = {}) {
  await client.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: value,
    code,
    windowsVirtualKeyCode: keyCode,
    shift,
  });
  await client.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: value,
    code,
    windowsVirtualKeyCode: keyCode,
    shift,
  });
}

async function configureViewport(client, width, height) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: width,
    screenHeight: height,
  });
  await client.send("Emulation.setTouchEmulationEnabled", {
    enabled: width < 768,
    maxTouchPoints: width < 768 ? 5 : 1,
  });
}

async function setSearchInput(client, value) {
  const focused = await evaluate(
    client,
    `(() => {
      const input = document.querySelector('[data-testid="search-input"]');
      if (!(input instanceof HTMLInputElement)) return false;
      input.focus();
      input.select();
      return document.activeElement === input;
    })()`,
  );
  if (!focused) throw new Error("Search input could not receive focus");
  await waitForExpression(
    client,
    `document.activeElement === document.querySelector('[data-testid="search-input"]')`,
    10_000,
  );
  await key(client, "Backspace", { code: "Backspace", keyCode: 8 });
  await client.send("Input.insertText", { text: value });
  await waitForExpression(
    client,
    `document.querySelector('[data-testid="search-input"]')?.value === ${JSON.stringify(value)}`,
    10_000,
  );
  await waitForExpression(
    client,
    `!document.querySelector('[data-testid="search-loading"]')`,
    10_000,
  );
}

async function openSearch(client) {
  await waitForExpression(
    client,
    `document.querySelector('[data-testid="global-header"]')?.dataset.hydrated === "true"`,
    10_000,
  );
  await waitForExpression(client, `!${bodyLockedExpression}`);
  await visibleClick(client, '[data-search-trigger="true"]');
  await waitForExpression(client, `document.querySelector('[data-testid="search-dialog"]')`);
  await waitForExpression(
    client,
    `document.activeElement === document.querySelector('[data-testid="search-input"]')`,
    10_000,
  );
}

async function submitQuery(client, query) {
  await openSearch(client);
  await setSearchInput(client, query);
  await waitForExpression(
    client,
    `!document.querySelector('[data-testid="search-dialog"] button[type="submit"]')?.disabled`,
  );
  await key(client, "Enter", { code: "Enter", keyCode: 13 });
  await waitForExpression(
    client,
    `location.pathname === '/products' && new URLSearchParams(location.search).get('q') === ${JSON.stringify(query)}`,
  );
  await waitForExpression(client, `!document.querySelector('[data-testid="search-dialog"]')`);
  await waitForExpression(client, `!${bodyLockedExpression}`);
}

async function main() {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  await waitForHttp(BASE_URL);
  const browser = await openBrowser({ debugPort: 9232, logPath: LOG_PATH });
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
    await configureViewport(client, 1280, 800);
    await navigate(client, `${BASE_URL}/`);
    await evaluate(client, `localStorage.removeItem('sole-store'); true`);
    await navigate(client, `${BASE_URL}/`);

    await visibleClick(client, '[data-testid="desktop-menu-trigger"]');
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="desktop-menu-content"]')`,
    );
    const desktopOpen = await evaluate(
      client,
      `({
        open: Boolean(document.querySelector('[data-testid="desktop-menu-content"]')),
        expanded: document.querySelector('[data-testid="desktop-menu-trigger"]')?.getAttribute('aria-expanded')
      })`,
    );
    record("Desktop menu opens", desktopOpen.open && desktopOpen.expanded === "true", desktopOpen);

    await key(client, "ArrowDown", { code: "ArrowDown", keyCode: 40 });
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="desktop-menu-content"]')?.contains(document.activeElement)`,
    );
    const desktopKeyboard = await evaluate(
      client,
      `({
        inside: Boolean(document.querySelector('[data-testid="desktop-menu-content"]')?.contains(document.activeElement)),
        text: document.activeElement?.textContent?.trim().slice(0, 80)
      })`,
    );
    record("Desktop menu keyboard navigation", desktopKeyboard.inside, desktopKeyboard);

    await key(client, "Escape", { code: "Escape", keyCode: 27 });
    await waitForExpression(
      client,
      `!document.querySelector('[data-testid="desktop-menu-content"]')`,
    );
    await waitForExpression(
      client,
      `document.activeElement?.dataset.testid === "desktop-menu-trigger"`,
    );
    const desktopClosed = await evaluate(
      client,
      `({
        closed: !document.querySelector('[data-testid="desktop-menu-content"]'),
        restored: document.activeElement?.dataset.testid
      })`,
    );
    record(
      "Desktop Escape close and focus restoration",
      desktopClosed.closed && desktopClosed.restored === "desktop-menu-trigger",
      desktopClosed,
    );

    await configureViewport(client, 390, 844);
    await navigate(client, `${BASE_URL}/`);
    await visibleClick(client, '[data-testid="mobile-menu-trigger"]');
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="mobile-menu-content"]')`,
    );
    const mobileOpen = await evaluate(
      client,
      `(() => {
        const dialog = document.querySelector('[data-testid="mobile-menu-content"]');
        return {
          open: Boolean(dialog),
          activeInside: Boolean(dialog?.contains(document.activeElement)),
          locked: ${bodyLockedExpression}
        };
      })()`,
    );
    record("Mobile menu opens", mobileOpen.open && mobileOpen.activeInside, mobileOpen);
    record("Mobile menu body scroll lock", mobileOpen.locked, mobileOpen);

    const focusTrail = [];
    for (let index = 0; index < 12; index += 1) {
      await key(client, "Tab", { code: "Tab", keyCode: 9 });
      focusTrail.push(
        await evaluate(
          client,
          `Boolean(document.querySelector('[data-testid="mobile-menu-content"]')?.contains(document.activeElement))`,
        ),
      );
    }
    record("Mobile menu focus trap", focusTrail.every(Boolean), focusTrail);

    await key(client, "Escape", { code: "Escape", keyCode: 27 });
    await waitForExpression(
      client,
      `!document.querySelector('[data-testid="mobile-menu-content"]')`,
    );
    await waitForExpression(client, `!${bodyLockedExpression}`);
    await waitForExpression(
      client,
      `document.activeElement?.dataset.testid === "mobile-menu-trigger"`,
    );
    const mobileClosed = await evaluate(
      client,
      `({
        closed: !document.querySelector('[data-testid="mobile-menu-content"]'),
        restored: document.activeElement?.dataset.testid,
        unlocked: !${bodyLockedExpression}
      })`,
    );
    record(
      "Mobile Escape close and focus restoration",
      mobileClosed.closed &&
        mobileClosed.restored === "mobile-menu-trigger" &&
        mobileClosed.unlocked,
      mobileClosed,
    );

    await configureViewport(client, 1280, 800);
    await navigate(client, `${BASE_URL}/`);
    await openSearch(client);
    const initialSearch = await evaluate(
      client,
      `(() => {
        const dialog = document.querySelector('[data-testid="search-dialog"]');
        const input = document.querySelector('[data-testid="search-input"]');
        return {
          focused: document.activeElement === input,
          activeInside: Boolean(dialog?.contains(document.activeElement)),
          locked: ${bodyLockedExpression}
        };
      })()`,
    );
    record(
      "Search initial focus, focus surface and scroll lock",
      initialSearch.focused && initialSearch.activeInside && initialSearch.locked,
      initialSearch,
    );

    await setSearchInput(client, "Air Max");
    await waitForExpression(
      client,
      `(() => {
        const input = document.querySelector('[data-testid="search-input"]');
        const results = document.querySelectorAll('[data-testid="search-result"]');
        return input?.value === "Air Max" && results.length > 0;
      })()`,
      15_000,
    );
    const suggestions = await evaluate(
      client,
      `({
        count: document.querySelectorAll('[data-testid="search-result"]').length,
        text: [...document.querySelectorAll('[data-testid="search-result"]')].map((node) => node.textContent).join(' ')
      })`,
    );
    record(
      "Search displays real dataset suggestions",
      suggestions.count > 0 && /Air Max/i.test(suggestions.text),
      suggestions,
    );

    await key(client, "ArrowDown", { code: "ArrowDown", keyCode: 40 });
    await waitForExpression(
      client,
      `Boolean(document.querySelector('[data-testid="search-result"][aria-selected="true"]'))`,
    );
    const arrow = await evaluate(
      client,
      `({
        active: document.querySelector('[data-testid="search-input"]')?.getAttribute('aria-activedescendant'),
        selected: document.querySelector('[data-testid="search-result"][aria-selected="true"]')?.id
      })`,
    );
    record(
      "Search Arrow navigation",
      Boolean(arrow.active) && arrow.active === arrow.selected,
      arrow,
    );

    await key(client, "Enter", { code: "Enter", keyCode: 13 });
    await waitForExpression(client, `location.pathname.startsWith('/product/')`);
    await waitForExpression(client, `!document.querySelector('[data-testid="search-dialog"]')`);
    await waitForExpression(client, `!${bodyLockedExpression}`);
    const enterResult = await evaluate(
      client,
      `({ path: location.pathname, closed: !document.querySelector('[data-testid="search-dialog"]') })`,
    );
    record(
      "Search Enter selects active suggestion",
      enterResult.path.startsWith("/product/") && enterResult.closed,
      enterResult,
    );

    await openSearch(client);
    await setSearchInput(client, "Jordan");
    await waitForExpression(
      client,
      `(() => {
        const input = document.querySelector('[data-testid="search-input"]');
        const target = document.querySelector('[aria-label="پاک‌کردن جستجو"]');
        if (!(input instanceof HTMLInputElement) || !(target instanceof HTMLButtonElement)) return false;
        const style = getComputedStyle(target);
        const rect = target.getBoundingClientRect();
        return input.value === 'Jordan' && !target.disabled && style.display !== 'none' &&
          style.visibility !== 'hidden' && style.pointerEvents !== 'none' && rect.width > 0 && rect.height > 0;
      })()`,
    );
    await visibleClick(client, '[aria-label="پاک‌کردن جستجو"]');
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="search-input"]')?.value === '' && Boolean(document.querySelector('[data-testid="search-empty-state"]'))`,
    );
    const cleared = await evaluate(
      client,
      `({
        value: document.querySelector('[data-testid="search-input"]')?.value,
        empty: Boolean(document.querySelector('[data-testid="search-empty-state"]'))
      })`,
    );
    record("Clear search returns to empty state", cleared.value === "" && cleared.empty, cleared);

    await setSearchInput(client, "Silver Bullet");
    await key(client, "Enter", { code: "Enter", keyCode: 13 });
    await waitForExpression(
      client,
      `location.pathname === '/products' && new URLSearchParams(location.search).get('q') === 'Silver Bullet'`,
    );
    await waitForExpression(client, `!${bodyLockedExpression}`);
    const submitted = await evaluate(
      client,
      `({
        path: location.pathname,
        query: new URLSearchParams(location.search).get('q'),
        history: ${historyExpression}
      })`,
    );
    record(
      "Search query updates URL and recent history",
      submitted.path === "/products" &&
        submitted.query === "Silver Bullet" &&
        submitted.history.includes("Silver Bullet"),
      submitted,
    );

    await navigate(client, `${BASE_URL}/products?q=Silver%20Bullet&sort=newest`);
    const deepLink = await evaluate(
      client,
      `({
        query: new URLSearchParams(location.search).get('q'),
        text: document.body.textContent.includes('Silver Bullet')
      })`,
    );
    record(
      "Search URL survives refresh and deep link",
      deepLink.query === "Silver Bullet" && deepLink.text,
      deepLink,
    );

    await navigate(client, `${BASE_URL}/`);
    await openSearch(client);
    await waitForExpression(
      client,
      `[...document.querySelectorAll('[data-testid="recent-search"]')].some((node) => node.textContent?.includes('Silver Bullet'))`,
    );
    const recentVisible = await evaluate(
      client,
      `[...document.querySelectorAll('[data-testid="recent-search"]')].some((node) => node.textContent?.includes('Silver Bullet'))`,
    );
    record("Recent search persists across routes", recentVisible, recentVisible);

    await visibleClick(client, '[aria-label="حذف جستجوی Silver Bullet"]');
    await waitForExpression(
      client,
      `!${historyExpression}.includes('Silver Bullet') && !document.querySelector('[aria-label="حذف جستجوی Silver Bullet"]')`,
    );
    const removed = await evaluate(
      client,
      `({
        silverControl: Boolean(document.querySelector('[aria-label="حذف جستجوی Silver Bullet"]')),
        history: ${historyExpression}
      })`,
    );
    record(
      "Delete one recent search",
      !removed.silverControl &&
        !removed.history.includes("Silver Bullet") &&
        removed.history.includes("Air Max"),
      removed,
    );

    await setSearchInput(client, "NoSuchSoleModelXYZ");
    await waitForExpression(client, `document.querySelector('[data-testid="search-no-results"]')`);
    const noResult = await evaluate(
      client,
      `Boolean(document.querySelector('[data-testid="search-no-results"]'))`,
    );
    record("Search no-result state", noResult, noResult);

    await key(client, "Escape", { code: "Escape", keyCode: 27 });
    await waitForExpression(client, `!document.querySelector('[data-testid="search-dialog"]')`);
    await waitForExpression(client, `!${bodyLockedExpression}`);
    await waitForExpression(client, `document.activeElement?.dataset.testid === "search-trigger"`);
    const desktopSearchClosed = await evaluate(
      client,
      `({
        closed: !document.querySelector('[data-testid="search-dialog"]'),
        restored: document.activeElement?.dataset.testid,
        unlocked: !${bodyLockedExpression}
      })`,
    );

    await configureViewport(client, 390, 844);
    await navigate(client, `${BASE_URL}/`);
    await visibleClick(client, '[data-testid="mobile-search-trigger"]');
    await waitForExpression(client, `document.querySelector('[data-testid="search-dialog"]')`);
    await waitForExpression(
      client,
      `document.activeElement === document.querySelector('[data-testid="search-input"]')`,
    );
    await key(client, "Escape", { code: "Escape", keyCode: 27 });
    await waitForExpression(client, `!document.querySelector('[data-testid="search-dialog"]')`);
    await waitForExpression(client, `!${bodyLockedExpression}`);
    await waitForExpression(
      client,
      `document.activeElement?.dataset.testid === "mobile-search-trigger"`,
    );
    const mobileSearchClosed = await evaluate(
      client,
      `({
        closed: !document.querySelector('[data-testid="search-dialog"]'),
        restored: document.activeElement?.dataset.testid,
        unlocked: !${bodyLockedExpression}
      })`,
    );
    record(
      "Search Escape restores focus to the actual desktop and mobile opener",
      desktopSearchClosed.closed &&
        desktopSearchClosed.restored === "search-trigger" &&
        desktopSearchClosed.unlocked &&
        mobileSearchClosed.closed &&
        mobileSearchClosed.restored === "mobile-search-trigger" &&
        mobileSearchClosed.unlocked,
      { desktop: desktopSearchClosed, mobile: mobileSearchClosed },
    );

    await submitQuery(client, "Nike");
    await submitQuery(client, "Jordan");
    await evaluate(client, `history.back(); true`);
    await waitForExpression(client, `new URLSearchParams(location.search).get('q') === 'Nike'`);
    const backQuery = await evaluate(client, `new URLSearchParams(location.search).get('q')`);
    await evaluate(client, `history.forward(); true`);
    await waitForExpression(client, `new URLSearchParams(location.search).get('q') === 'Jordan'`);
    const forwardQuery = await evaluate(client, `new URLSearchParams(location.search).get('q')`);
    record(
      "Browser Back and Forward preserve search query",
      backQuery === "Nike" && forwardQuery === "Jordan",
      { backQuery, forwardQuery },
    );

    await configureViewport(client, 390, 844);
    await navigate(client, `${BASE_URL}/`);
    await visibleClick(client, '[data-testid="mobile-menu-trigger"]');
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="mobile-menu-content"]')`,
    );
    await evaluate(
      client,
      `(() => {
        const link = document.querySelector('[data-testid="mobile-menu-content"] a[href="/products"]');
        link?.focus();
        return document.activeElement === link;
      })()`,
    );
    await key(client, "Enter", { code: "Enter", keyCode: 13 });
    await waitForExpression(client, `location.pathname === '/products'`);
    await waitForExpression(
      client,
      `!document.querySelector('[data-testid="mobile-menu-content"]')`,
    );
    await waitForExpression(client, `!${bodyLockedExpression}`);
    const routeClose = await evaluate(
      client,
      `({
        path: location.pathname,
        menuClosed: !document.querySelector('[data-testid="mobile-menu-content"]'),
        unlocked: !${bodyLockedExpression}
      })`,
    );
    record(
      "Route navigation closes mobile overlay",
      routeClose.path === "/products" && routeClose.menuClosed && routeClose.unlocked,
      routeClose,
    );

    const meaningfulErrors = browserErrors.filter((text) =>
      /hydration|hydrated|server rendered html|did not match|uncaught|typeerror|referenceerror|syntaxerror/i.test(
        text,
      ),
    );
    record("No hydration or runtime error", meaningfulErrors.length === 0, meaningfulErrors);
  } finally {
    await browser.close();
  }

  const failed = results.filter((result) => !result.pass);
  const report = {
    schemaVersion: 3,
    suite: "f2-navigation-search-browser-behavior",
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
  console.log(`F2 behavior report: ${path.relative(ROOT, REPORT_PATH)}`);
  if (!report.pass) process.exitCode = 1;
}

const entryPath = fileURLToPath(import.meta.url);
const delegated = await delegateToDevServer({
  envName: ENV_NAME,
  port: 4182,
  entryPath,
  logName: "f2-behavior-server.txt",
});

if (delegated !== null) {
  process.exitCode = delegated;
} else {
  main().catch((error) => {
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(
      REPORT_PATH,
      `${JSON.stringify(
        {
          schemaVersion: 3,
          suite: "f2-navigation-search-browser-behavior",
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
}

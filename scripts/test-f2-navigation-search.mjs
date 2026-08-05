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

async function key(client, value, options = {}) {
  const code = options.code ?? value;
  const keyCode = options.keyCode ?? 0;
  await client.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: value,
    code,
    windowsVirtualKeyCode: keyCode,
    shift: Boolean(options.shift),
  });
  await client.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: value,
    code,
    windowsVirtualKeyCode: keyCode,
    shift: Boolean(options.shift),
  });
}

async function setInput(client, value) {
  await evaluate(
    client,
    `(() => {
      const input = document.querySelector('[data-testid="search-input"]');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(input, ${JSON.stringify(value)});
      input?.dispatchEvent(new Event('input', { bubbles: true }));
      return input?.value;
    })()`,
  );
  await waitForExpression(
    client,
    `document.querySelector('[data-testid="search-input"]')?.value === ${JSON.stringify(value)}`,
  );
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

async function openSearch(client) {
  await visibleClick(client, '[data-search-trigger="true"]');
  await waitForExpression(client, `document.querySelector('[data-testid="search-dialog"]')`);
}

async function submitQuery(client, query) {
  await openSearch(client);
  await setInput(client, query);
  await waitForExpression(
    client,
    `!document.querySelector('[data-testid="search-dialog"] button[type="submit"]')?.disabled`,
  );
  await key(client, "Enter", { code: "Enter", keyCode: 13 });
  await waitForExpression(
    client,
    `location.pathname === '/products' && new URLSearchParams(location.search).get('q') === ${JSON.stringify(query)}`,
  );
}

const recentHistoryExpression = `(() => {
  const persisted = JSON.parse(localStorage.getItem('sole-store') || '{}');
  return persisted.state?.searchHistory || [];
})()`;

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
    if (event.type === "error") {
      browserErrors.push(event.args.map(serialiseArgument).join(" "));
    }
  });

  try {
    await configureViewport(client, 1280, 800);
    await navigate(client, `${BASE_URL}/`);
    await evaluate(client, `localStorage.removeItem('sole-store'); true`);
    await navigate(client, `${BASE_URL}/`);

    await visibleClick(client, '[data-testid="desktop-menu-trigger"]');
    await waitForExpression(client, `document.querySelector('[data-testid="desktop-menu-content"]')`);
    const desktopOpen = await evaluate(
      client,
      `({
        open: Boolean(document.querySelector('[data-testid="desktop-menu-content"]')),
        expanded: document.querySelector('[data-testid="desktop-menu-trigger"]')?.getAttribute('aria-expanded')
      })`,
    );
    record("Desktop menu opens with pointer", desktopOpen.open && desktopOpen.expanded === "true", desktopOpen);

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
    await waitForExpression(client, `!document.querySelector('[data-testid="desktop-menu-content"]')`);
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
    await waitForExpression(client, `document.querySelector('[data-testid="mobile-menu-content"]')`);
    const mobileOpen = await evaluate(
      client,
      `(() => {
        const dialog = document.querySelector('[data-testid="mobile-menu-content"]');
        const body = getComputedStyle(document.body);
        return {
          open: Boolean(dialog),
          activeInside: Boolean(dialog?.contains(document.activeElement)),
          overflow: body.overflow,
          overflowY: body.overflowY
        };
      })()`,
    );
    record("Mobile menu opens", mobileOpen.open && mobileOpen.activeInside, mobileOpen);
    record(
      "Mobile menu locks body scroll",
      [mobileOpen.overflow, mobileOpen.overflowY].includes("hidden"),
      mobileOpen,
    );

    const mobileTrail = [];
    for (let index = 0; index < 12; index += 1) {
      await key(client, "Tab", { code: "Tab", keyCode: 9 });
      mobileTrail.push(
        await evaluate(
          client,
          `Boolean(document.querySelector('[data-testid="mobile-menu-content"]')?.contains(document.activeElement))`,
        ),
      );
    }
    record("Mobile menu focus trap", mobileTrail.every(Boolean), mobileTrail);

    await key(client, "Escape", { code: "Escape", keyCode: 27 });
    await waitForExpression(client, `!document.querySelector('[data-testid="mobile-menu-content"]')`);
    const mobileClosed = await evaluate(
      client,
      `({
        closed: !document.querySelector('[data-testid="mobile-menu-content"]'),
        restored: document.activeElement?.dataset.testid,
        overflow: getComputedStyle(document.body).overflow
      })`,
    );
    record(
      "Mobile Escape close and focus restoration",
      mobileClosed.closed &&
        mobileClosed.restored === "mobile-menu-trigger" &&
        mobileClosed.overflow !== "hidden",
      mobileClosed,
    );

    await configureViewport(client, 1280, 800);
    await navigate(client, `${BASE_URL}/`);
    await openSearch(client);
    const initialFocus = await evaluate(
      client,
      `(() => {
        const dialog = document.querySelector('[data-testid="search-dialog"]');
        const input = document.querySelector('[data-testid="search-input"]');
        return {
          focused: document.activeElement === input,
          activeInside: Boolean(dialog?.contains(document.activeElement)),
          overflow: getComputedStyle(document.body).overflow
        };
      })()`,
    );
    record(
      "Search initial focus, trap surface and scroll lock",
      initialFocus.focused && initialFocus.activeInside && initialFocus.overflow === "hidden",
      initialFocus,
    );

    await setInput(client, "Air Max");
    await waitForExpression(client, `document.querySelectorAll('[data-testid="search-result"]').length > 0`);
    const realSuggestions = await evaluate(
      client,
      `({
        count: document.querySelectorAll('[data-testid="search-result"]').length,
        text: [...document.querySelectorAll('[data-testid="search-result"]')].map((node) => node.textContent).join(' ')
      })`,
    );
    record(
      "Typing shows real dataset suggestions",
      realSuggestions.count > 0 && /Air Max/i.test(realSuggestions.text),
      realSuggestions,
    );

    await key(client, "ArrowDown", { code: "ArrowDown", keyCode: 40 });
    await waitForExpression(
      client,
      `Boolean(document.querySelector('[data-testid="search-result"][aria-selected="true"]'))`,
    );
    const arrowSelection = await evaluate(
      client,
      `({
        active: document.querySelector('[data-testid="search-input"]')?.getAttribute('aria-activedescendant'),
        selected: document.querySelector('[data-testid="search-result"][aria-selected="true"]')?.id
      })`,
    );
    record(
      "Search Arrow navigation",
      Boolean(arrowSelection.active) && arrowSelection.active === arrowSelection.selected,
      arrowSelection,
    );

    await key(client, "Enter", { code: "Enter", keyCode: 13 });
    await waitForExpression(client, `location.pathname.startsWith('/product/')`);
    const enterSelection = await evaluate(
      client,
      `({
        path: location.pathname,
        dialogClosed: !document.querySelector('[data-testid="search-dialog"]')
      })`,
    );
    record(
      "Search Enter selects active result",
      enterSelection.path.startsWith("/product/") && enterSelection.dialogClosed,
      enterSelection,
    );

    await openSearch(client);
    await setInput(client, "Jordan");
    await waitForExpression(client, `document.querySelector('[aria-label="پاک‌کردن جستجو"]')`);
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

    await setInput(client, "Silver Bullet");
    await waitForExpression(
      client,
      `!document.querySelector('[data-testid="search-dialog"] button[type="submit"]')?.disabled`,
    );
    await key(client, "Enter", { code: "Enter", keyCode: 13 });
    await waitForExpression(
      client,
      `location.pathname === '/products' && new URLSearchParams(location.search).get('q') === 'Silver Bullet'`,
    );
    const submitted = await evaluate(
      client,
      `({
        path: location.pathname,
        q: new URLSearchParams(location.search).get('q'),
        history: ${recentHistoryExpression}
      })`,
    );
    record(
      "Search submits URL query and persists recent term",
      submitted.path === "/products" &&
        submitted.q === "Silver Bullet" &&
        submitted.history.includes("Silver Bullet"),
      submitted,
    );

    await navigate(client, `${BASE_URL}/products?q=Silver%20Bullet&sort=newest`);
    const refreshQuery = await evaluate(
      client,
      `({
        q: new URLSearchParams(location.search).get('q'),
        text: document.body.textContent.includes('Silver Bullet')
      })`,
    );
    record(
      "URL query survives refresh and deep link",
      refreshQuery.q === "Silver Bullet" && refreshQuery.text,
      refreshQuery,
    );

    await navigate(client, `${BASE_URL}/`);
    await openSearch(client);
    await waitForExpression(
      client,
      `[...document.querySelectorAll('[data-testid="recent-search"]')].some((node) => node.textContent?.includes('Silver Bullet'))`,
    );
    const persistedRecent = await evaluate(
      client,
      `[...document.querySelectorAll('[data-testid="recent-search"]')].some((node) => node.textContent?.includes('Silver Bullet'))`,
    );
    record("Recent search appears after navigation", persistedRecent === true, persistedRecent);

    await visibleClick(client, '[aria-label="حذف جستجوی Silver Bullet"]');
    await waitForExpression(
      client,
      `!${recentHistoryExpression}.includes('Silver Bullet') && !document.querySelector('[aria-label="حذف جستجوی Silver Bullet"]')`,
    );
    const removedRecent = await evaluate(
      client,
      `({
        removeControlPresent: Boolean(document.querySelector('[aria-label="حذف جستجوی Silver Bullet"]')),
        history: ${recentHistoryExpression}
      })`,
    );
    record(
      "Remove one recent search without clearing others",
      !removedRecent.removeControlPresent &&
        !removedRecent.history.includes("Silver Bullet") &&
        removedRecent.history.includes("Air Max"),
      removedRecent,
    );

    await setInput(client, "NoSuchSoleModelXYZ");
    await waitForExpression(client, `document.querySelector('[data-testid="search-no-results"]')`);
    const noResult = await evaluate(
      client,
      `Boolean(document.querySelector('[data-testid="search-no-results"]'))`,
    );
    record("No-result state is truthful", noResult === true, noResult);

    await key(client, "Escape", { code: "Escape", keyCode: 27 });
    await waitForExpression(client, `!document.querySelector('[data-testid="search-dialog"]')`);
    const searchEscape = await evaluate(
      client,
      `({
        closed: !document.querySelector('[data-testid="search-dialog"]'),
        restored: document.activeElement?.dataset.searchTrigger,
        overflow: getComputedStyle(document.body).overflow
      })`,
    );
    record(
      "Search Escape close and focus restoration",
      searchEscape.closed && searchEscape.restored === "true" && searchEscape.overflow !== "hidden",
      searchEscape,
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
      "Browser Back and Forward preserve search URL",
      backQuery === "Nike" && forwardQuery === "Jordan",
      { backQuery, forwardQuery },
    );

    await configureViewport(client, 390, 844);
    await navigate(client, `${BASE_URL}/`);
    await visibleClick(client, '[data-testid="mobile-menu-trigger"]');
    await waitForExpression(client, `document.querySelector('[data-testid="mobile-menu-content"]')`);
    await visibleClick(client, '[data-testid="mobile-menu-content"] a[href="/products"]');
    await waitForExpression(client, `location.pathname === '/products'`);
    await waitForExpression(client, `!document.querySelector('[data-testid="mobile-menu-content"]')`);
    const routeClosed = await evaluate(
      client,
      `({
        path: location.pathname,
        menuClosed: !document.querySelector('[data-testid="mobile-menu-content"]')
      })`,
    );
    record(
      "Route navigation closes mobile overlay",
      routeClosed.path === "/products" && routeClosed.menuClosed,
      routeClosed,
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
    schemaVersion: 2,
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
          schemaVersion: 2,
          suite: "f2-navigation-search-browser-behavior",
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
}

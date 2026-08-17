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
import { withF10Server } from "./f10-browser-runner.mjs";

const ROOT = process.cwd();
const REPORT = path.join(ROOT, "artifacts/reports/f10-motion-3d-behavior.json");
const CHROME_LOG = path.join(ROOT, "artifacts/runtime/f10-motion-3d-behavior-chrome.txt");
const results = [];
const browserErrors = [];
const modelDataRequests = [];

function record(name, pass, evidence = null) {
  results.push({ name, pass: Boolean(pass), evidence });
  if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
}

async function click(client, selector) {
  return evaluate(
    client,
    `(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!(element instanceof HTMLElement)) return false; element.click(); return true; })()`,
  );
}

async function run(baseUrl) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  const browser = await openBrowser({
    debugPort: 9260,
    logPath: CHROME_LOG,
    width: 1280,
    height: 800,
  });
  const { client } = browser;
  await client.send("Network.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: 1280,
    screenHeight: 800,
  });

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
  client.on("Network.requestWillBeSent", (event) => {
    const url = event.request?.url ?? "";
    if (url.includes("create-shoe-model")) modelDataRequests.push(url);
  });

  try {
    await navigate(client, `${baseUrl}/`);
    await waitForExpression(client, `document.querySelector('[data-testid="home-hero"]')`);
    await waitForExpression(client, `document.querySelector('[data-testid="hero-poster"]')`);
    await sleep(500);

    const before3d = await evaluate(
      client,
      `({ model: Boolean(document.querySelector('[data-testid="hero-model-viewer"]')), button: Boolean(document.querySelector('[data-testid="shoe-viewer-enable-3d"]')), poster: Boolean(document.querySelector('[data-testid="hero-poster"]')) })`,
    );
    record(
      "3D stays lazy before explicit activation",
      before3d.poster && before3d.button && !before3d.model && modelDataRequests.length === 0,
      { before3d, modelDataRequests: [...modelDataRequests] },
    );

    const activated = await click(client, '[data-testid="shoe-viewer-enable-3d"]');
    await waitForExpression(client, `document.querySelector('[data-testid="hero-model-viewer"]')`);
    await waitForExpression(
      client,
      `document.querySelector('[data-testid="shoe-viewer"]')?.getAttribute('data-3d-active') === 'true'`,
    );
    await sleep(500);
    record(
      "3D activates only on demand",
      activated &&
        (await evaluate(
          client,
          `Boolean(document.querySelector('[data-testid="hero-model-viewer"]'))`,
        )),
      { activated, modelDataRequests: [...modelDataRequests] },
    );

    await evaluate(
      client,
      `window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }); true`,
    );
    await waitForExpression(client, `!document.querySelector('[data-testid="hero-model-viewer"]')`);
    record(
      "3D unmounts while offscreen",
      !(await evaluate(
        client,
        `Boolean(document.querySelector('[data-testid="hero-model-viewer"]'))`,
      )),
    );

    await evaluate(client, `window.scrollTo({ top: 0, behavior: 'instant' }); true`);
    await waitForExpression(client, `document.querySelector('[data-testid="hero-model-viewer"]')`);
    record("3D resumes after returning onscreen", true);

    const pointerState = await evaluate(
      client,
      `({ customCursor: Boolean(document.querySelector('[data-foundation-cursor]')), bodyCursor: getComputedStyle(document.body).cursor })`,
    );
    record(
      "Native pointer remains available",
      !pointerState.customCursor && pointerState.bodyCursor !== "none",
      pointerState,
    );

    const cartTrigger = await evaluate(
      client,
      `(() => { const trigger = [...document.querySelectorAll('[data-cart-trigger="true"]')].find((element) => { const rect = element.getBoundingClientRect(); return rect.width > 0 && rect.height > 0; }); if (!(trigger instanceof HTMLElement)) return false; trigger.click(); return true; })()`,
    );
    if (cartTrigger) {
      await waitForExpression(client, `document.querySelector('[data-testid="cart-drawer"]')`);
      await client.send("Input.dispatchKeyEvent", {
        type: "keyDown",
        key: "Escape",
        code: "Escape",
      });
      await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
      await waitForExpression(client, `!document.querySelector('[data-testid="cart-drawer"]')`);
    }
    record(
      "Cart drawer Escape remains immediate",
      cartTrigger &&
        !(await evaluate(client, `Boolean(document.querySelector('[data-testid="cart-drawer"]'))`)),
      { cartTrigger },
    );

    await client.send("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await navigate(client, `${baseUrl}/`);
    await waitForExpression(client, `document.querySelector('[data-testid="hero-poster"]')`);
    await sleep(250);
    const reduced = await evaluate(
      client,
      `({ media: matchMedia('(prefers-reduced-motion: reduce)').matches, poster: Boolean(document.querySelector('[data-testid="hero-poster"]')), model: Boolean(document.querySelector('[data-testid="hero-model-viewer"]')), activate: Boolean(document.querySelector('[data-testid="shoe-viewer-enable-3d"]')), routeFeedback: getComputedStyle(document.querySelector('.route-motion-feedback')).display })`,
    );
    record(
      "Reduced motion keeps the static product poster",
      reduced.media &&
        reduced.poster &&
        !reduced.model &&
        !reduced.activate &&
        reduced.routeFeedback === "none",
      reduced,
    );

    await client.send("Emulation.setEmulatedMedia", { media: "screen", features: [] });
    await client.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
      screenWidth: 390,
      screenHeight: 844,
    });
    await navigate(client, `${baseUrl}/`);
    await waitForExpression(client, `document.querySelector('[data-testid="home-hero"]')`);
    const touch = await evaluate(
      client,
      `({ coarse: matchMedia('(pointer: coarse)').matches, customCursor: Boolean(document.querySelector('[data-foundation-cursor]')), overflow: document.documentElement.scrollWidth > innerWidth + 1 })`,
    );
    record(
      "Touch mode has no custom pointer or horizontal overflow",
      !touch.customCursor && !touch.overflow,
      touch,
    );

    const relevantErrors = browserErrors.filter(
      (error) => !/favicon|ResizeObserver loop limit exceeded/i.test(error),
    );
    const hydration = relevantErrors.filter((error) =>
      /hydration|server rendered html|did not match/i.test(error),
    );
    const runtime = relevantErrors.filter((error) =>
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
    suite: "f10-motion-3d-behavior",
    generatedAt: new Date().toISOString(),
    baseUrl,
    summary: {
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
    },
    results,
    browserErrors,
    modelDataRequests,
    pass: failed.length === 0,
  };
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary));
  if (!report.pass) process.exitCode = 1;
}

withF10Server(
  {
    envName: "F10_BEHAVIOR_BASE_URL",
    port: 4198,
    logPath: "artifacts/runtime/f10-motion-3d-behavior-server.txt",
  },
  run,
).catch((error) => {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(
    REPORT,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        suite: "f10-motion-3d-behavior",
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

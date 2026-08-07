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
import { withF6Server } from "./f6-browser-runner.mjs";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "artifacts/visual-qa/f6-product-detail");
const REPORT = path.join(OUTPUT, "f6-product-detail.json");
const CHROME_LOG = path.join(
  ROOT,
  "artifacts/runtime/f6-product-detail-visual-chrome.txt",
);
const captures = [];
const criticalFindings = [];
const browserErrors = [];

const VIEWPORTS = [
  [320, 568],
  [375, 812],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
];

const safeName = (value) =>
  value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();

async function viewport(client, width, height, mobile = width < 768) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  });
}

async function screenshot(client, name) {
  const image = await client.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    fromSurface: true,
  });
  const file = path.join(OUTPUT, `${safeName(name)}.png`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(image.data, "base64"));
  return path.relative(ROOT, file);
}

async function click(client, selector) {
  const clicked = await evaluate(
    client,
    `(() => {
      const target = [...document.querySelectorAll(${JSON.stringify(selector)})].find((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
          style.visibility !== 'hidden' && style.pointerEvents !== 'none';
      });
      if (!(target instanceof HTMLElement)) return false;
      target.scrollIntoView({ block: 'center', inline: 'center' });
      target.click();
      return true;
    })()`,
  );
  if (!clicked) throw new Error(`Visible target not found: ${selector}`);
  await sleep(180);
}

async function inspect(client) {
  return evaluate(
    client,
    `(() => {
      const roots = [
        document.querySelector('[data-testid="product-gallery"]'),
        document.querySelector('[data-testid="product-purchase-panel"]'),
        document.querySelector('[data-testid="product-mobile-purchase"]'),
      ].filter(Boolean);
      const controls = roots.flatMap((root) =>
        [...root.querySelectorAll('button,a[href],input,select')].filter((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
            style.visibility !== 'hidden';
        }),
      );
      const tinyTargets = controls
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width < 44 || rect.height < 44;
        })
        .slice(0, 20)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName,
            label: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 60),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        });
      const unnamedButtons = controls.filter(
        (element) =>
          element.tagName === 'BUTTON' &&
          !((element.getAttribute('aria-label') || element.textContent || '').trim()),
      ).length;
      return {
        viewport: { width: innerWidth, height: innerHeight },
        documentWidth: document.documentElement.scrollWidth,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        h1: document.querySelectorAll('h1').length,
        tinyTargets,
        unnamedButtons,
        mainFallback: Boolean(document.querySelector('[data-testid="product-main-image-fallback"]')),
        mobileBar: Boolean(document.querySelector('[data-testid="product-mobile-purchase"]')),
      };
    })()`,
  );
}

async function capture(client, baseUrl, name, url, width, height, setup) {
  await viewport(client, width, height);
  await navigate(client, `${baseUrl}${url}`);
  await waitForExpression(
    client,
    `document.querySelector('[data-testid="product-purchase-panel"]')`,
  );
  await waitForExpression(client, `document.fonts.status === 'loaded'`);
  if (setup) await setup();
  await sleep(650);

  const metrics = await inspect(client);
  const file = await screenshot(client, `${name}-${width}x${height}`);
  const findings = [];
  if (metrics.overflow) findings.push("horizontal-overflow");
  if (metrics.h1 !== 1) findings.push(`h1-count-${metrics.h1}`);
  if (metrics.unnamedButtons) {
    findings.push(`unnamed-buttons-${metrics.unnamedButtons}`);
  }
  if (metrics.tinyTargets.length) {
    findings.push(`targets-below-44-${metrics.tinyTargets.length}`);
  }
  if (!metrics.mainFallback) findings.push("blocked-main-image-fallback-missing");
  if (findings.length) {
    criticalFindings.push({ name, width, height, findings, metrics });
  }
  captures.push({ name, url, width, height, file, metrics, findings });
}

async function run(baseUrl) {
  fs.rmSync(OUTPUT, { recursive: true, force: true });
  const browser = await openBrowser({ debugPort: 9249, logPath: CHROME_LOG });
  const { client } = browser;

  await client.send("Network.enable");
  await client.send("Network.setBlockedURLs", {
    urls: ["https://images.unsplash.com/*", "https://*.unsplash.com/*"],
  });

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
    for (const [width, height] of VIEWPORTS) {
      await capture(
        client,
        baseUrl,
        "product-default",
        "/product/1",
        width,
        height,
      );
    }

    await capture(
      client,
      baseUrl,
      "product-selected-quantity",
      "/product/1",
      1280,
      800,
      async () => {
        await click(client, '[data-testid="product-size-option"]');
        await click(
          client,
          '[aria-label="تعداد برای افزودن به سبد"] button:last-of-type',
        );
      },
    );

    await capture(
      client,
      baseUrl,
      "product-size-guide",
      "/product/1",
      390,
      844,
      async () => {
        await click(client, '[data-testid="size-guide-trigger"]');
        await waitForExpression(
          client,
          `document.querySelector('[data-testid="size-guide-dialog"]')`,
        );
      },
    );

    await capture(
      client,
      baseUrl,
      "product-gallery-zoom",
      "/product/1",
      1280,
      800,
      async () => {
        await click(client, '[data-testid="product-gallery-zoom"]');
        await waitForExpression(
          client,
          `document.querySelector('[data-testid="product-gallery-dialog"]')`,
        );
      },
    );

    await capture(
      client,
      baseUrl,
      "product-sold-out",
      "/product/7",
      390,
      844,
    );

    await client.send("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await capture(
      client,
      baseUrl,
      "product-reduced-motion",
      "/product/1",
      390,
      844,
    );
  } finally {
    await browser.close();
  }

  const hydration = browserErrors.filter((error) =>
    /hydration|server rendered html|did not match/i.test(error),
  );
  const runtime = browserErrors.filter((error) =>
    /uncaught|typeerror|referenceerror|syntaxerror/i.test(error),
  );
  if (hydration.length) {
    criticalFindings.push({ name: "hydration", findings: hydration });
  }
  if (runtime.length) {
    criticalFindings.push({ name: "runtime", findings: runtime });
  }

  const report = {
    schemaVersion: 1,
    suite: "f6-product-detail-visual",
    generatedAt: new Date().toISOString(),
    captures,
    browserErrors,
    criticalFindings,
    summary: {
      captures: captures.length,
      critical: criticalFindings.length,
    },
    pass: criticalFindings.length === 0,
  };

  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary));
  if (criticalFindings.length) {
    console.error(JSON.stringify(criticalFindings, null, 2));
  }
  if (!report.pass) process.exitCode = 1;
}

withF6Server(
  {
    envName: "F6_VISUAL_BASE_URL",
    port: 4187,
    logPath: "artifacts/runtime/f6-product-detail-visual-server.txt",
  },
  run,
).catch((error) => {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(
    REPORT,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        suite: "f6-product-detail-visual",
        generatedAt: new Date().toISOString(),
        pass: false,
        fatalError:
          error instanceof Error ? (error.stack ?? error.message) : String(error),
      },
      null,
      2,
    )}\n`,
  );
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});

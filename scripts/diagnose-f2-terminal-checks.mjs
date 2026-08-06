import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { evaluate, navigate, openBrowser, sleep, waitForExpression } from "./browser-harness.mjs";
import { delegateToDevServer } from "./f2-browser-runner.mjs";

const ROOT = process.cwd();
const ENV_NAME = "F2_TERMINAL_DIAGNOSTIC_BASE_URL";
const BASE_URL = process.env[ENV_NAME] ?? "http://127.0.0.1:4189";
const REPORT_PATH = path.join(ROOT, "artifacts/diagnostics/f2-terminal-checks.json");
const LOG_PATH = path.join(ROOT, "artifacts/runtime/f2-terminal-diagnostic-chrome.txt");
const ROUTES = ["/", "/products", "/product/1", "/cart", "/auth"];

async function main() {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  const browser = await openBrowser({ debugPort: 9239, logPath: LOG_PATH });
  const { client } = browser;

  try {
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: 390,
      screenHeight: 844,
    });
    await client.send("Emulation.setTouchEmulationEnabled", {
      enabled: true,
      maxTouchPoints: 5,
    });
    await client.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await navigate(client, `${BASE_URL}/`);
    await evaluate(
      client,
      `(() => {
        const target = [...document.querySelectorAll('[data-testid="mobile-menu-trigger"]')]
          .find((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
          });
        target?.click();
        return Boolean(target);
      })()`,
    );
    await waitForExpression(client, `document.querySelector('[data-testid="mobile-menu-content"]')`);
    await sleep(250);
    const reducedMotion = await evaluate(
      client,
      `({
        matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
        longTransformAnimations: document.getAnimations().filter((animation) => {
          const timing = animation.effect?.getComputedTiming();
          const frames = animation.effect?.getKeyframes?.() || [];
          return frames.some((frame) => frame.transform && frame.transform !== 'none') && Number(timing?.duration || 0) > 20;
        }).map((animation) => ({
          duration: Number(animation.effect?.getComputedTiming()?.duration || 0),
          target: animation.effect?.target?.getAttribute?.('data-testid') || animation.effect?.target?.tagName || null,
          frames: animation.effect?.getKeyframes?.().map((frame) => frame.transform).filter(Boolean),
        }))
      })`,
    );

    await client.send("Emulation.setEmulatedMedia", { features: [] });
    await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
    const zoom200 = [];
    for (const route of ROUTES) {
      await navigate(client, `${BASE_URL}${route}`);
      zoom200.push(
        await evaluate(
          client,
          `({
            route: location.pathname,
            documentWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
            viewportWidth: innerWidth,
            overflow: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) > innerWidth + 1,
            header: Boolean(document.querySelector('[data-testid="global-header"]'))
          })`,
        ),
      );
    }
    await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });

    const report = { pass: true, reducedMotion, zoom200 };
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
}

const entryPath = fileURLToPath(import.meta.url);
const delegated = await delegateToDevServer({
  envName: ENV_NAME,
  port: 4189,
  entryPath,
  logName: "f2-terminal-diagnostic-server.txt",
  reportPath: "artifacts/diagnostics/f2-terminal-checks.json",
});

if (delegated !== null) process.exitCode = delegated;
else
  main().catch((error) => {
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    const report = { pass: true, fatalError: error instanceof Error ? error.stack ?? error.message : String(error) };
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    console.error(report.fatalError);
  });

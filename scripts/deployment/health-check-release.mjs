import { appendFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const origins = process.argv.slice(2);
if (!origins.length) {
  console.error("usage: health-check-release.mjs <loopback-origin> [public-origin]");
  process.exit(1);
}
const timeoutMs = Number(process.env.SOLE_HEALTH_TIMEOUT_MS ?? 15000);
const results = [];

for (const origin of origins) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  try {
    const response = await fetch(new URL("/", origin), {
      redirect: "manual",
      signal: controller.signal,
      headers: { "user-agent": "sole-release-health/1.0" },
    });
    const body = await response.text();
    const elapsedMs = Math.round(performance.now() - started);
    const pass = response.status === 200 && /<html|<!doctype/i.test(body);
    results.push({ origin, status: response.status, elapsedMs, pass });
  } catch (error) {
    results.push({
      origin,
      status: 0,
      elapsedMs: Math.round(performance.now() - started),
      pass: false,
      error: error.message,
    });
  } finally {
    clearTimeout(timer);
  }
}

const payload = { checkedAt: new Date().toISOString(), results };
if (process.env.SOLE_HEALTH_RESULT_PATH) {
  await appendFile(process.env.SOLE_HEALTH_RESULT_PATH, `${JSON.stringify(payload)}\n`);
}
console.log(JSON.stringify(payload));
if (results.some((result) => !result.pass)) process.exit(1);

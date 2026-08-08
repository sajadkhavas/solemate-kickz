import { performance } from "node:perf_hooks";

const origin = (process.env.SOLE_SMOKE_ORIGIN ?? "http://127.0.0.1:4173").replace(/\/$/, "");
const timeoutMs = Number(process.env.SOLE_SMOKE_TIMEOUT_MS ?? 15000);

async function probe(pathname) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();

  try {
    const response = await fetch(`${origin}${pathname}`, {
      redirect: "manual",
      signal: controller.signal,
      headers: { "user-agent": "sole-vps-smoke/1.0" },
    });
    const elapsedMs = Math.round(performance.now() - started);
    const body = await response.arrayBuffer();

    if (response.status !== 200) {
      throw new Error(`${pathname} returned HTTP ${response.status}`);
    }

    console.log(
      `[smoke:vps] ${pathname} HTTP 200 in ${elapsedMs}ms (${body.byteLength} bytes)`,
    );
    return elapsedMs;
  } finally {
    clearTimeout(timer);
  }
}

try {
  await probe("/favicon.svg");
  const firstHomeMs = await probe("/");
  const secondHomeMs = await probe("/");

  if (firstHomeMs > 5000) {
    console.warn(
      `[smoke:vps] First SSR response took ${firstHomeMs}ms; production is healthy but warm-up is slow.`,
    );
  }

  console.log(`[smoke:vps] Warm home response: ${secondHomeMs}ms.`);
} catch (error) {
  console.error(`[smoke:vps] FAILED: ${error.message}`);
  process.exit(1);
}

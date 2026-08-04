import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
  ].filter(Boolean);

  for (const candidate of candidates) {
    const result = spawnSync("bash", ["-lc", `command -v ${JSON.stringify(candidate)}`], {
      encoding: "utf8",
    });
    if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();
  }
  return null;
}

export async function waitForHttp(url, timeout = 30_000) {
  const started = Date.now();
  let lastError = "not ready";
  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return response;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError}`);
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.sequence = 0;
    this.pending = new Map();
    this.waiters = new Map();
    this.listeners = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result ?? {});
        return;
      }
      if (!message.method) return;
      for (const listener of this.listeners.get(message.method) ?? []) {
        listener(message.params ?? {});
      }
      const waiter = this.waiters.get(message.method)?.shift();
      if (waiter) waiter(message.params ?? {});
    });
  }

  send(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  waitFor(method, timeout = 20_000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeout);
      const waiters = this.waiters.get(method) ?? [];
      waiters.push((value) => {
        clearTimeout(timer);
        resolve(value);
      });
      this.waiters.set(method, waiters);
    });
  }

  async close() {
    try {
      await Promise.race([this.send("Page.close"), sleep(1_000)]);
    } catch {
      // The page may already be closed after a navigation failure.
    }
    this.socket.close();
  }
}

async function stopProcess(child) {
  if (child.exitCode !== null) return;
  const exited = new Promise((resolve) => child.once("exit", resolve));
  child.kill("SIGTERM");
  const graceful = await Promise.race([exited.then(() => true), sleep(3_000).then(() => false)]);
  if (!graceful && child.exitCode === null) {
    child.kill("SIGKILL");
    await Promise.race([exited, sleep(1_000)]);
  }
}

export async function openBrowser({ debugPort, logPath, width = 1280, height = 800 }) {
  const chromeBinary = findChrome();
  if (!chromeBinary) throw new Error("Chrome/Chromium executable was not found.");

  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  const log = fs.openSync(logPath, "w");
  const chrome = spawn(
    chromeBinary,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), "sole-browser-"))}`,
      `--window-size=${width},${height}`,
      "about:blank",
    ],
    { stdio: ["ignore", log, log] },
  );

  await waitForHttp(`http://127.0.0.1:${debugPort}/json/version`, 20_000);
  const targetResponse = await fetch(
    `http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent("about:blank")}`,
    { method: "PUT" },
  );
  if (!targetResponse.ok) throw new Error(`Could not create Chrome target: ${targetResponse.status}`);
  const target = await targetResponse.json();
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await Promise.all([
    client.send("Page.enable"),
    client.send("Runtime.enable"),
    client.send("Log.enable"),
    client.send("Network.enable"),
  ]);

  return {
    client,
    async close() {
      await client.close();
      await stopProcess(chrome);
      fs.closeSync(log);
    },
  };
}

export async function evaluate(client, expression) {
  const response = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(
      response.exceptionDetails.exception?.description ??
        response.exceptionDetails.text ??
        "Browser evaluation failed",
    );
  }
  return response.result?.value;
}

export async function navigate(client, url) {
  const ready = client.waitFor("Page.domContentEventFired");
  const result = await client.send("Page.navigate", { url });
  if (result.errorText) throw new Error(`${url}: ${result.errorText}`);
  await ready;
  await sleep(300);
}

export async function waitForExpression(client, expression, timeout = 10_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(client, `Boolean(${expression})`)) return;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for expression: ${expression}`);
}

export function serialiseArgument(argument) {
  if ("value" in argument) return argument.value;
  return argument.description ?? argument.type;
}

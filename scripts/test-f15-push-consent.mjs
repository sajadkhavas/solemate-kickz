import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const REPORT = path.join(ROOT, "artifacts/reports/f15-push-contracts.json");
const center = fs.readFileSync(
  path.join(ROOT, "src/components/notifications/NotificationCenter.tsx"),
  "utf8",
);
const client = fs.readFileSync(path.join(ROOT, "src/notifications/client.ts"), "utf8");
const worker = fs.readFileSync(path.join(ROOT, "public/sw.js"), "utf8");
const results = [];
const record = (name, pass) => results.push({ name, pass: Boolean(pass) });
record(
  "no permission prompt on mount",
  center.match(/Notification\.requestPermission\(\)/g)?.length === 1 &&
    center.includes("const requestPush = async"),
);
record(
  "backend absence is reported rather than mocked",
  client.includes("سرویس اعلان هنوز به Backend متصل نشده است") && !client.includes("mock"),
);
record(
  "subscription uses PushManager with user visibility",
  center.includes("pushManager.subscribe") && center.includes("userVisibleOnly: true"),
);
record(
  "failed backend registration rolls browser state back",
  center.indexOf("notificationApi.subscribe") < center.indexOf("subscription.unsubscribe"),
);
record(
  "notification click accepts only product products or account routes",
  worker.includes('url.pathname.startsWith("/product/")') &&
    worker.includes('url.pathname === "/products"') &&
    worker.includes('url.pathname === "/account"'),
);
record(
  "notification content is bounded",
  worker.includes("slice(0, 120)") && worker.includes("slice(0, 240)"),
);
const failed = results.filter((result) => !result.pass);
const report = {
  schemaVersion: 1,
  suite: "f15-push-contracts",
  generatedAt: new Date().toISOString(),
  summary: { total: results.length, passed: results.length - failed.length, failed: failed.length },
  results,
  pass: failed.length === 0,
};
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (failed.length) {
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
}

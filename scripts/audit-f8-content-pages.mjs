import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FOUNDATION = "a908b2723322dde27699fa4c92fa9c0de95e0c75";
const BRANCH = "phase/sole-f8-content-pages";
const ROUTES = ["about", "brands", "auth"];
const REPORT = path.join(ROOT, "artifacts/audits/f8-content-pages.json");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const git = (...args) => spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
const results = [];

function record(name, pass, evidence) {
  results.push({ name, pass: Boolean(pass), evidence });
}

function headings(source) {
  const levels = [...source.matchAll(/<h([1-6])\b/g)].map((match) => Number(match[1]));
  return {
    levels,
    h1: levels.filter((level) => level === 1).length,
    skips: levels.filter((level, index) => index > 0 && level > levels[index - 1] + 1),
  };
}

function labels(source) {
  const ids = [...source.matchAll(/<input[\s\S]*?\bid="([^"]+)"[\s\S]*?>/g)].map((match) => match[1]);
  const targets = new Set([...source.matchAll(/htmlFor="([^"]+)"/g)].map((match) => match[1]));
  return { ids, missing: ids.filter((id) => !targets.has(id)) };
}

function routeInventory() {
  return fs
    .readdirSync(path.join(ROOT, "src/routes"))
    .filter((file) => file.endsWith(".tsx") && file !== "__root.tsx")
    .map((file) => ({
      file: `src/routes/${file}`,
      route: file === "index.tsx" ? "/" : `/${file.replace(/\.tsx$/, "").replaceAll("$", ":").replaceAll(".", "/")}`,
    }))
    .sort((a, b) => a.route.localeCompare(b.route));
}

const branch = git("branch", "--show-current").stdout.trim();
const head = git("rev-parse", "HEAD").stdout.trim();
const inventory = routeInventory();
const sources = Object.fromEntries(ROUTES.map((route) => [route, read(`src/routes/${route}.tsx`)]));
const combined = Object.values(sources).join("\n");

record("Foundation SHA", git("merge-base", "--is-ancestor", FOUNDATION, "HEAD").status === 0, { foundation: FOUNDATION, head });
record("Expected branch", branch === BRANCH, { expected: BRANCH, actual: branch });
record("Route inventory", ROUTES.every((route) => inventory.some((entry) => entry.file === `src/routes/${route}.tsx`)), inventory);

for (const route of ROUTES) {
  const structure = headings(sources[route]);
  record(`${route}: one H1`, structure.h1 === 1, structure);
  record(`${route}: heading hierarchy`, structure.skips.length === 0, structure);
  const images = [...sources[route].matchAll(/<img\b[\s\S]*?>/g)].map((match) => match[0]);
  record(`${route}: image alt policy`, images.every((image) => /\balt=/.test(image)), images);
}

record("No Lorem Ipsum", !/lorem ipsum|dolor sit amet/i.test(combined), null);
record("No placeholder URL", !/href=["'](?:#|javascript:|https?:\/\/(?:example|test)\.)/i.test(combined), null);
record("No fabricated policy or metric", !/(مشتری راضی|سال سابقه|تضمین اصالت|ارسال رایگان|بازگشت وجه تضمینی|فروش موفق)/i.test(combined), null);

const auth = sources.auth;
record("Auth truthfulness", /Backend/.test(auth) && /متصل نیست|بدون Backend/.test(auth) && /هیچ حساب، نشست/.test(auth), null);
record("No fake auth success or OTP", !/(toast\.success|signIn\(|useStore\(|navigate\s*\(|InputOTP|generateOtp|setOtp)/i.test(auth), null);
record("No password storage", !/(localStorage|sessionStorage)\s*\.(?:setItem|removeItem)|persist\s*\(/i.test(auth), null);
const authLabels = labels(auth);
record("Form label association", authLabels.missing.length === 0, authLabels);
record("Input autocomplete", /autoComplete="email"/.test(auth) && /current-password/.test(auth) && /new-password/.test(auth) && /autoComplete="name"/.test(auth), null);
record("Error semantics", /aria-invalid=/.test(auth) && /aria-describedby=/.test(auth) && /role="alert"/.test(auth), null);
record("Double-submit prevention", /busyRef\.current/.test(auth) && /loading=\{submitting\}/.test(auth), null);
record("Backend unavailable state", /auth-backend-status/.test(auth) && /ورود واقعی انجام نمی‌شود/.test(auth), null);

const brands = sources.brands;
record("Brand data integrity", /\.\.\.new Set\(BRANDS\)/.test(brands) && /SHOES\.filter\(\(shoe\) => shoe\.brand === name\)/.test(brands) && /data-product-count=\{brand\.count\}/.test(brands), null);
record("Brand logo fallback", /BRAND_LOGO_SLUGS/.test(brands) && /نشان متنی/.test(brands) && /onError=\{onFail\}/.test(brands), null);
record("Brand no-result state", /برندی با این عبارت پیدا نشد/.test(brands), null);

const contactLinks = [...combined.matchAll(/href="((?:mailto:|tel:)[^"]+)"/g)].map((match) => match[1]);
record("Contact link validity", contactLinks.every((href) => href.startsWith("mailto:") ? /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(href) : /^tel:\+?[0-9][0-9 -]{5,}$/i.test(href)), contactLinks);

const tables = ROUTES.filter((route) => /<table\b/.test(sources[route]));
record("Table semantics", tables.every((route) => /<caption\b/.test(sources[route]) && /<th\b/.test(sources[route])), tables);
record("Static touch targets", /min-h-11/.test(brands) && /min-h-1[12]/.test(auth) && /size="lg"/.test(sources.about), null);

const trackedArtifacts = git("ls-files", "artifacts/runtime", "artifacts/visual-qa").stdout.trim().split("\n").filter(Boolean);
record("Runtime artifacts not tracked", trackedArtifacts.length === 0, trackedArtifacts);
record("Handoff presence", fs.existsSync(path.join(ROOT, "docs/handoffs/F8-CONTENT-PAGES.md")), "docs/handoffs/F8-CONTENT-PAGES.md");

const failed = results.filter((item) => !item.pass);
const report = {
  schemaVersion: 1,
  audit: "f8-content-pages",
  generatedAt: new Date().toISOString(),
  repository: "sajadkhavas/solemate-kickz",
  branch,
  foundationSha: FOUNDATION,
  head,
  routeInventory: inventory,
  checks: results,
  summary: { total: results.length, passed: results.length - failed.length, failed: failed.length },
  pass: failed.length === 0,
};

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (!report.pass) process.exitCode = 1;

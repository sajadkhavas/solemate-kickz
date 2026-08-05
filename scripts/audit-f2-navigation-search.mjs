import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const EXPECTED_BRANCH = "phase/sole-f2-navigation-search";
const FOUNDATION_SHA = "a908b2723322dde27699fa4c92fa9c0de95e0c75";
const REPORT_PATH = path.join(ROOT, "artifacts/audits/f2-navigation-search.json");
const HANDOFF_PATH = "docs/handoffs/F2-NAVIGATION-SEARCH.md";
const checks = [];

function git(args, options = {}) {
  try {
    return execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    }).trim();
  } catch (error) {
    return options.allowFailure ? "" : (() => { throw error; })();
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function add(name, pass, evidence) {
  checks.push({ name, pass: Boolean(pass), evidence });
}

function listTrackedSourceFiles() {
  return git(["ls-files", "*.ts", "*.tsx", "*.js", "*.jsx", "*.mjs", "*.md", "*.yml", "*.yaml"])
    .split("\n")
    .filter(Boolean);
}

const sourceFiles = listTrackedSourceFiles();
const sources = new Map(sourceFiles.map((file) => [file, read(file)]));
const combined = [...sources.entries()].map(([file, source]) => `\n/* ${file} */\n${source}`).join("\n");
const searchDialog = read("src/components/navigation/SearchDialog.tsx");
const desktopNavigation = read("src/components/navigation/DesktopNavigation.tsx");
const mobileNavigation = read("src/components/navigation/MobileNavigation.tsx");
const navbar = read("src/components/Navbar.tsx");
const mobileBottom = read("src/components/MobileBottomNav.tsx");
const store = read("src/store/index.ts");
const productsRoute = read("src/routes/products.tsx");
const packageJson = JSON.parse(read("package.json"));

const symbolicBranch = git(["symbolic-ref", "--short", "-q", "HEAD"], { allowFailure: true });
const branch = process.env.GITHUB_HEAD_REF || symbolicBranch || process.env.GITHUB_REF_NAME || "detached";
add("expected branch", branch === EXPECTED_BRANCH, { expected: EXPECTED_BRANCH, actual: branch });

const head = git(["rev-parse", "HEAD"]);
const foundationIsAncestor = (() => {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", FOUNDATION_SHA, head], {
      cwd: ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
})();
add("accepted Foundation is ancestor", foundationIsAncestor, { foundation: FOUNDATION_SHA, head });
add(
  "generated route tree unchanged from Foundation",
  git(["diff", "--name-only", FOUNDATION_SHA, "--", "src/routeTree.gen.ts"]) === "",
  git(["diff", "--name-only", FOUNDATION_SHA, "--", "src/routeTree.gen.ts"]),
);

const unsafeUrlFindings = [];
const positiveTabFindings = [];
for (const [file, source] of sources) {
  if (/href\s*=\s*["'](?:#|javascript:)/i.test(source)) unsafeUrlFindings.push(file);
  if (/tabIndex\s*=\s*\{?\s*[1-9]/.test(source)) positiveTabFindings.push(file);
}
add("no unsafe or placeholder URL", unsafeUrlFindings.length === 0, unsafeUrlFindings);
add("no positive tabindex", positiveTabFindings.length === 0, positiveTabFindings);

add(
  "search input has programmatic label",
  /<label\s+htmlFor="sole-global-search"/.test(searchDialog) && /id="sole-global-search"/.test(searchDialog),
  "SearchDialog label/input association",
);
add(
  "icon controls have accessible names",
  /IconButton[\s\S]*label="بازکردن جستجو"/.test(navbar) &&
    /IconButton[\s\S]*label="بازکردن منوی اصلی"/.test(mobileNavigation) &&
    /IconButton[\s\S]*label="بستن منوی اصلی"/.test(mobileNavigation) &&
    /IconButton[\s\S]*label="بستن جستجو"/.test(searchDialog),
  "named search, menu, close and cart controls",
);
add(
  "desktop and mobile triggers are native controls",
  /data-testid="desktop-menu-trigger"/.test(desktopNavigation) &&
    /<button[\s\S]*data-testid="desktop-menu-trigger"/.test(desktopNavigation) &&
    /data-testid="mobile-menu-trigger"/.test(mobileNavigation) &&
    /data-testid="search-trigger"/.test(navbar) &&
    /data-testid="mobile-search-trigger"/.test(mobileBottom),
  "desktop menu, mobile menu and search triggers",
);
add(
  "overlay scroll-lock policy uses modal primitives",
  /DialogPrimitive\.Root/.test(mobileNavigation) &&
    /DialogPrimitive\.Content/.test(mobileNavigation) &&
    /DialogPrimitive\.Root/.test(searchDialog) &&
    /DialogPrimitive\.Content/.test(searchDialog),
  "Radix modal Dialog owns body scroll lock",
);
add(
  "focus restoration is explicit or primitive-owned",
  /onCloseAutoFocus/.test(searchDialog) && /focus\(\{ preventScroll: true \}\)/.test(searchDialog) &&
    /DialogPrimitive\.Trigger/.test(mobileNavigation),
  "Search explicit restoration; Mobile Dialog trigger restoration",
);
add(
  "Escape behavior is provided by dismissible Dialog and Dropdown",
  /DropdownMenuPrimitive\.Root/.test(desktopNavigation) &&
    /DialogPrimitive\.Root/.test(mobileNavigation) &&
    /DialogPrimitive\.Root/.test(searchDialog),
  "Radix primitives",
);
add(
  "recent search persistence and removal",
  /searchHistory: string\[\]/.test(store) &&
    /addSearch:/.test(store) &&
    /removeSearch:/.test(store) &&
    /clearSearchHistory:/.test(store) &&
    /searchHistory: state\.searchHistory/.test(store) &&
    /data-testid="recent-search"/.test(searchDialog),
  "persisted Zustand slice with single/all removal",
);
add(
  "URL query, refresh and deep-link contract",
  /to: "\/products"/.test(searchDialog) &&
    /search: \{ q: normalized, sort: "newest" \}/.test(searchDialog) &&
    /q: fallback\(z\.string\(\)\.optional/.test(productsRoute) &&
    /Route\.useSearch\(\)/.test(productsRoute),
  "SearchDialog submits q; products route validates q",
);
add(
  "RTL and mixed-direction safety",
  /dir="rtl"/.test(searchDialog) &&
    /<bdi dir="ltr"/.test(searchDialog) &&
    /<bdi dir="ltr"/.test(desktopNavigation) &&
    /<bdi dir="ltr"/.test(mobileNavigation),
  "RTL overlays and isolated Latin product data",
);
add(
  "shared touch target contract",
  /min-h-11/.test(desktopNavigation) &&
    /size-11/.test(desktopNavigation) &&
    /min-h-11/.test(mobileNavigation) &&
    /min-h-11/.test(searchDialog) &&
    /min-h-11/.test(mobileBottom),
  "44px shared interaction boxes",
);
add(
  "active route has semantic and non-color state",
  /aria-current/.test(desktopNavigation) && /h-0\.5/.test(desktopNavigation) &&
    /aria-current/.test(mobileNavigation) && /rounded-full border border-current/.test(mobileNavigation) &&
    /aria-current/.test(mobileBottom),
  "aria-current plus underline/dot indicators",
);
add(
  "search suggestions use project dataset",
  /searchShoes\(deferredQuery\)/.test(searchDialog) &&
    /from "@\/components\/navigation\/search-utils"/.test(searchDialog) &&
    /SHOES/.test(read("src/components/navigation/search-utils.ts")),
  "SHOES dataset",
);
add(
  "safe highlighting avoids raw HTML",
  /function Highlight/.test(searchDialog) && !/dangerouslySetInnerHTML/.test(searchDialog),
  "React text fragments and mark",
);
add(
  "keyboard search navigation",
  /ArrowDown/.test(searchDialog) && /ArrowUp/.test(searchDialog) && /aria-activedescendant/.test(searchDialog),
  "combobox-like active descendant behavior",
);
add(
  "truthful Shell copy",
  !/ارسال رایگان|اصالت ۱۰۰٪|ضمانت بازگشت|SOLE10|۰۲۱-۸۸۸۸۸۸۸۸/.test(combined) &&
    /نسخه نمایشی فرانت‌اند/.test(navbar),
  "unsupported promotional and contact claims removed",
);

const trackedRuntime = git(["ls-files", "artifacts"])
  .split("\n")
  .filter(Boolean);
add("no runtime Artifact tracked", trackedRuntime.length === 0, trackedRuntime);
add("Bun version remains exact", packageJson.packageManager === "bun@1.3.14", packageJson.packageManager);

const handoffExists = fs.existsSync(path.join(ROOT, HANDOFF_PATH));
const handoff = handoffExists ? read(HANDOFF_PATH) : "";
add("F2 handoff exists", handoffExists, HANDOFF_PATH);
add(
  "F2 handoff is complete",
  handoffExists &&
    /Foundation SHA/.test(handoff) &&
    /Visual QA/.test(handoff) &&
    /Working Tree/.test(handoff) &&
    /Ready for supervisor review: Yes/.test(handoff) &&
    !/\bPending\b/i.test(handoff),
  handoffExists ? "content checked" : "missing",
);

const failed = checks.filter((check) => !check.pass);
const report = {
  schemaVersion: 1,
  audit: "f2-navigation-search",
  generatedAt: new Date().toISOString(),
  repository: "sajadkhavas/solemate-kickz",
  branch,
  foundationSha: FOUNDATION_SHA,
  head,
  summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length },
  checks,
  pass: failed.length === 0,
};

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
console.log(`F2 audit report: ${path.relative(ROOT, REPORT_PATH)}`);
if (!report.pass) process.exitCode = 1;

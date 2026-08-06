import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const OWNER_BRANCH = "phase/sole-f2-navigation-search";
const INTEGRATION_BRANCH = "integration/sole-frontend-v2";
const CONTROLLED_PHASE = /^phase\/sole-f(?:\d+)(?:-f\d+)?-[a-z0-9-]+$/;
const CONTROLLED_RELEASE = /^release\/sole-frontend-v2(?:-|$)/;
const FOUNDATION_SHA = "a908b2723322dde27699fa4c92fa9c0de95e0c75";
const REPORT_PATH = path.join(ROOT, "artifacts/audits/f2-navigation-search.json");
const HANDOFF_PATH = "docs/handoffs/F2-NAVIGATION-SEARCH.md";
const checks = [];

function git(args, { allowFailure = false } = {}) {
  try {
    return execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    if (allowFailure) return "";
    throw error;
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function add(name, pass, evidence) {
  checks.push({ name, pass: Boolean(pass), evidence });
}

const files = {
  navbar: read("src/components/Navbar.tsx"),
  desktop: read("src/components/navigation/DesktopNavigation.tsx"),
  mobile: read("src/components/navigation/MobileNavigation.tsx"),
  search: read("src/components/navigation/SearchDialog.tsx"),
  searchUtils: read("src/components/navigation/search-utils.ts"),
  bottom: read("src/components/MobileBottomNav.tsx"),
  store: read("src/store/index.ts"),
  products: read("src/routes/products.tsx"),
  navigationCss: read("src/components/navigation/navigation.css"),
  behavior: read("scripts/test-f2-navigation-search.mjs"),
  visual: read("scripts/visual-qa-f2-navigation-search.mjs"),
};
const packageJson = JSON.parse(read("package.json"));
const branch =
  process.env.GITHUB_HEAD_REF ||
  git(["symbolic-ref", "--short", "-q", "HEAD"], { allowFailure: true }) ||
  process.env.GITHUB_REF_NAME ||
  "detached";
const head = git(["rev-parse", "HEAD"]);

const controlledBranch =
  branch === OWNER_BRANCH ||
  branch === INTEGRATION_BRANCH ||
  CONTROLLED_PHASE.test(branch) ||
  CONTROLLED_RELEASE.test(branch);
add("controlled phase or integration branch", controlledBranch, {
  owner: OWNER_BRANCH,
  integration: INTEGRATION_BRANCH,
  actual: branch,
});

let foundationIsAncestor = false;
try {
  execFileSync("git", ["merge-base", "--is-ancestor", FOUNDATION_SHA, head], {
    cwd: ROOT,
    stdio: "ignore",
  });
  foundationIsAncestor = true;
} catch {
  foundationIsAncestor = false;
}
add("accepted Foundation is ancestor", foundationIsAncestor, {
  foundation: FOUNDATION_SHA,
  head,
});
add(
  "generated route tree unchanged",
  git(["diff", "--name-only", FOUNDATION_SHA, "--", "src/routeTree.gen.ts"]) === "",
  "src/routeTree.gen.ts",
);

const trackedSourceFiles = git([
  "ls-files",
  "*.ts",
  "*.tsx",
  "*.js",
  "*.jsx",
  "*.mjs",
  "*.yml",
  "*.yaml",
])
  .split("\n")
  .filter(Boolean);
const unsafeUrls = [];
const positiveTabindex = [];
for (const file of trackedSourceFiles) {
  const source = read(file);
  if (/href\s*=\s*["']#["']/i.test(source) || /href\s*=\s*["']javascript:/i.test(source))
    unsafeUrls.push(file);
  if (/tabIndex\s*=\s*\{?\s*[1-9]/.test(source)) positiveTabindex.push(file);
}
add("no unsafe or placeholder URL", unsafeUrls.length === 0, unsafeUrls);
add("no positive tabindex", positiveTabindex.length === 0, positiveTabindex);

add(
  "search input has programmatic label",
  /<label\s+htmlFor="sole-global-search"/.test(files.search) &&
    /id="sole-global-search"/.test(files.search),
  "SearchDialog label/input association",
);
add(
  "icon controls have accessible names",
  /label="بازکردن جستجو"/.test(files.navbar) &&
    /label="بازکردن منوی اصلی"/.test(files.mobile) &&
    /label="بستن منوی اصلی"/.test(files.mobile) &&
    /label="بستن جستجو"/.test(files.search),
  "named search, menu and close controls",
);
add(
  "desktop and mobile triggers are native controls",
  /DropdownMenuPrimitive\.Trigger/.test(files.desktop) &&
    /data-testid="desktop-menu-trigger"/.test(files.desktop) &&
    /DialogPrimitive\.Trigger/.test(files.mobile) &&
    /data-testid="mobile-menu-trigger"/.test(files.mobile) &&
    /data-testid="search-trigger"/.test(files.navbar) &&
    /data-testid="mobile-search-trigger"/.test(files.bottom),
  "Radix/native button triggers",
);
add(
  "modal scroll-lock policy",
  /DialogPrimitive\.Root/.test(files.mobile) &&
    /DialogPrimitive\.Content/.test(files.mobile) &&
    /DialogPrimitive\.Root/.test(files.search) &&
    /DialogPrimitive\.Content/.test(files.search) &&
    /data-scroll-locked/.test(files.navigationCss),
  "Radix modal dialogs with mobile compensation policy",
);
add(
  "focus restoration policy",
  /openerRef = useRef<HTMLElement \| null>/.test(files.search) &&
    /document\.activeElement instanceof HTMLElement/.test(files.search) &&
    /onCloseAutoFocus/.test(files.search) &&
    /openerRef\.current\?\.focus\(\{ preventScroll: true \}\)/.test(files.search) &&
    /triggerRef/.test(files.mobile) &&
    /actual desktop and mobile opener/.test(files.behavior),
  "Search Dialog restores the actual opener; Mobile Dialog restores its trigger",
);
add(
  "Escape behavior uses dismissible primitives",
  /DropdownMenuPrimitive\.Root/.test(files.desktop) &&
    /DialogPrimitive\.Root/.test(files.mobile) &&
    /DialogPrimitive\.Root/.test(files.search),
  "Radix DropdownMenu and Dialog",
);
add(
  "recent search persistence and removal",
  /searchHistory: string\[\]/.test(files.store) &&
    /addSearch:/.test(files.store) &&
    /removeSearch:/.test(files.store) &&
    /clearSearchHistory:/.test(files.store) &&
    /searchHistory: state\.searchHistory/.test(files.store) &&
    /data-testid="recent-search"/.test(files.search),
  "persisted Zustand search history",
);
add(
  "URL query, refresh and deep-link contract",
  /search: \{ q: normalized, sort: "newest" \}/.test(files.search) &&
    /q: fallback\(z\.string\(\)\.optional/.test(files.products) &&
    /Route\.useSearch\(\)/.test(files.products),
  "SearchDialog submits q; products route validates q",
);
add(
  "RTL and mixed-direction safety",
  /dir="rtl"/.test(files.search) &&
    /<bdi dir="ltr"/.test(files.search) &&
    /<bdi dir="ltr"/.test(files.desktop) &&
    /<bdi dir="ltr"/.test(files.mobile),
  "RTL overlays and isolated Latin product data",
);
add(
  "touch target contract",
  /min-h-11|size-11/.test(files.desktop) &&
    /min-h-11|size-11/.test(files.mobile) &&
    /min-h-11/.test(files.search) &&
    /min-h-11/.test(files.bottom),
  "44px shared interaction boxes",
);
add(
  "active route has semantic and non-color state",
  /aria-current/.test(files.desktop) &&
    /h-0\.5/.test(files.desktop) &&
    /aria-current/.test(files.mobile) &&
    /rounded-full border border-current/.test(files.mobile) &&
    /aria-current/.test(files.bottom),
  "aria-current plus underline/dot indicators",
);
add(
  "search suggestions use project dataset",
  /searchShoes\(deferredQuery\)/.test(files.search) && /SHOES/.test(files.searchUtils),
  "SHOES dataset",
);
add(
  "safe highlighting avoids raw HTML",
  /function Highlight/.test(files.search) && !/dangerouslySetInnerHTML/.test(files.search),
  "React text fragments and mark",
);
add(
  "keyboard search navigation",
  /ArrowDown/.test(files.search) &&
    /ArrowUp/.test(files.search) &&
    /aria-activedescendant/.test(files.search) &&
    /event\.key === "Enter"/.test(files.search),
  "Arrow and Enter contracts",
);
add(
  "truthful Shell copy",
  !/ارسال رایگان|اصالت ۱۰۰٪|ضمانت بازگشت|SOLE10|۰۲۱-۸۸۸۸۸۸۸۸/.test(
    files.navbar + files.mobile + files.search,
  ) && /نسخه نمایشی فرانت‌اند/.test(files.navbar),
  "unsupported Shell claims removed",
);
add(
  "behavior and Visual QA scripts exist",
  fs.existsSync(path.join(ROOT, "scripts/test-f2-navigation-search.mjs")) &&
    fs.existsSync(path.join(ROOT, "scripts/visual-qa-f2-navigation-search.mjs")),
  "F2 browser suites",
);
add(
  "official package gate includes F2",
  packageJson.scripts?.["audit:f2"] === "node scripts/audit-f2-navigation-search.mjs" &&
    packageJson.scripts?.["test:f2"] === "node scripts/test-f2-navigation-search.mjs" &&
    packageJson.scripts?.["qa:visual:f2"] === "node scripts/visual-qa-f2-navigation-search.mjs" &&
    packageJson.scripts?.check?.includes("bun run audit:f2") &&
    packageJson.scripts?.check?.includes("bun run test:f2") &&
    packageJson.scripts?.check?.includes("bun run qa:visual:f2"),
  packageJson.scripts?.check,
);
add(
  "Bun version remains exact",
  packageJson.packageManager === "bun@1.3.14",
  packageJson.packageManager,
);

const trackedRuntime = git(["ls-files", "artifacts"]).split("\n").filter(Boolean);
add("no runtime Artifact tracked", trackedRuntime.length === 0, trackedRuntime);
add(
  "no temporary F2 development workflow",
  !fs.existsSync(path.join(ROOT, ".github/workflows/f2-acceptance-dev.yml")),
  ".github/workflows/f2-acceptance-dev.yml",
);

const handoffExists = fs.existsSync(path.join(ROOT, HANDOFF_PATH));
const handoff = handoffExists ? read(HANDOFF_PATH) : "";
add("F2 handoff exists", handoffExists, HANDOFF_PATH);
add(
  "F2 handoff is complete",
  handoffExists &&
    /Foundation SHA/.test(handoff) &&
    /Final SHA/.test(handoff) &&
    /Visual QA/.test(handoff) &&
    /Working Tree/.test(handoff) &&
    /Ready for supervisor review: Yes/.test(handoff) &&
    !/\bPending\b/i.test(handoff),
  handoffExists ? "content checked" : "missing",
);

const failed = checks.filter((check) => !check.pass);
const report = {
  schemaVersion: 2,
  audit: "f2-navigation-search",
  generatedAt: new Date().toISOString(),
  repository: "sajadkhavas/solemate-kickz",
  branch,
  foundationSha: FOUNDATION_SHA,
  head,
  summary: {
    total: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
  },
  checks,
  pass: failed.length === 0,
};

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (failed.length) {
  for (const check of failed) {
    console.error(`FAILED: ${check.name}`, check.evidence);
  }
}
console.log(`F2 audit report: ${path.relative(ROOT, REPORT_PATH)}`);
if (!report.pass) process.exitCode = 1;

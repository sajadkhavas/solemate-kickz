import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const FOUNDATION_SHA = "a908b2723322dde27699fa4c92fa9c0de95e0c75";
const REPORT_PATH = path.join(ROOT, "artifacts/audits/f3-homepage.json");

const HOME_FILES = [
  "src/routes/index.tsx",
  "src/components/ShoeViewer3D.tsx",
  "src/components/sections/HomeImage.tsx",
  "src/components/sections/Hero.tsx",
  "src/components/sections/QuickShopPaths.tsx",
  "src/components/sections/FeaturedDrops.tsx",
  "src/components/sections/MerchandisingShowcase.tsx",
  "src/components/sections/Categories.tsx",
  "src/components/sections/BrandWall.tsx",
  "src/components/sections/HypeSection.tsx",
  "src/components/sections/TrustBadges.tsx",
  "src/components/sections/Newsletter.tsx",
];

const checks = [];

function record(name, pass, evidence) {
  checks.push({ name, pass: Boolean(pass), evidence });
  if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function runGit(args) {
  return spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
}

function count(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function main() {
  const missing = HOME_FILES.filter(
    (relativePath) => !fs.existsSync(path.join(ROOT, relativePath)),
  );
  record("F3 source files exist", missing.length === 0, { missing });

  const sources = Object.fromEntries(
    HOME_FILES.filter((relativePath) => fs.existsSync(path.join(ROOT, relativePath))).map(
      (relativePath) => [relativePath, read(relativePath)],
    ),
  );
  const combined = Object.values(sources).join("\n");
  const indexSource = sources["src/routes/index.tsx"] ?? "";
  const heroSource = sources["src/components/sections/Hero.tsx"] ?? "";
  const viewerSource = sources["src/components/ShoeViewer3D.tsx"] ?? "";
  const quickShopSource = sources["src/components/sections/QuickShopPaths.tsx"] ?? "";
  const featuredSource = sources["src/components/sections/FeaturedDrops.tsx"] ?? "";
  const merchandisingSource = sources["src/components/sections/MerchandisingShowcase.tsx"] ?? "";
  const stylesSource = read("src/styles.css");
  const motionStylesSource = fs.existsSync(path.join(ROOT, "src/motion.css"))
    ? read("src/motion.css")
    : "";

  const head = runGit(["rev-parse", "HEAD"]);
  const foundationExists = runGit(["cat-file", "-e", `${FOUNDATION_SHA}^{commit}`]);
  const foundationAncestor = runGit(["merge-base", "--is-ancestor", FOUNDATION_SHA, "HEAD"]);
  record(
    "Foundation SHA",
    head.status === 0 && foundationExists.status === 0 && foundationAncestor.status === 0,
    {
      expectedFoundation: FOUNDATION_SHA,
      head: head.stdout.trim() || null,
      foundationExists: foundationExists.status === 0,
      foundationIsAncestor: foundationAncestor.status === 0,
    },
  );

  const h1Count = count(combined, /<h1\b/g);
  record("Exactly one h1", h1Count === 1, { h1Count });

  const sectionIds = [
    "home-quick-shop-title",
    "home-featured-title",
    "home-merchandising-title",
    "home-categories-title",
    "home-brands-title",
    "home-editorial-title",
    "home-trust-title",
    "home-final-cta-title",
  ];
  const missingHeadings = sectionIds.filter((id) => !combined.includes(`id="${id}"`));
  record("Heading hierarchy contract", missingHeadings.length === 0, {
    sectionH2Count: count(combined, /<h2\b/g),
    sectionH3Count: count(combined, /<h3\b/g),
    missingHeadings,
  });

  const unsafeUrls = [...combined.matchAll(/(?:href|to)=\{?['"](javascript:|#)['"]/gi)].map(
    (match) => match[0],
  );
  const allowedRoutes = new Set(["/products", "/brands", "/about", "/product/$id"]);
  const routeTargets = [...combined.matchAll(/\bto="([^"]+)"/g)].map((match) => match[1]);
  const invalidTargets = routeTargets.filter((target) => !allowedRoutes.has(target));
  record("CTA destinations", unsafeUrls.length === 0 && invalidTargets.length === 0, {
    routeTargets: [...new Set(routeTargets)],
    unsafeUrls,
    invalidTargets,
  });

  const forbiddenClaims = [
    /۲۳۲\+|232\+/i,
    /۱۸\s*برند|18\s*brands?/i,
    /ارسال رایگان/i,
    /بازگشت\s*۷\s*روزه|بازگشت هفت روزه/i,
    /اصالت تضمینی|۱۰۰٪\s*اورجینال|100%\s*original/i,
    /پرداخت امن|درگاه رسمی/i,
    /limited stock|موجودی محدود/i,
    /countdown|شمارش معکوس/i,
    /customer count|تعداد مشتری/i,
    /پرفروش|best\s*seller/i,
  ];
  const claimMatches = forbiddenClaims.flatMap((pattern) => {
    const match = combined.match(pattern);
    return match ? [match[0]] : [];
  });
  record("Truthfulness checks", claimMatches.length === 0, { claimMatches });

  record(
    "Demo disclosure",
    /storefront نمایشی|ویترین نمایشی/.test(combined) &&
      /قیمت نمایشی/.test(combined) &&
      /موجودی زنده/.test(combined),
    {
      storefrontDisclosure: /storefront نمایشی|ویترین نمایشی/.test(combined),
      priceDisclosure: /قیمت نمایشی/.test(combined),
      liveInventoryDisclosure: /موجودی زنده/.test(combined),
    },
  );

  const verifiedSaleGuard = (source) =>
    source.includes("shoe.sale_price < shoe.price") &&
    source.includes("shoe.sale_price > 0") &&
    source.includes("shoe.price > 0");
  record(
    "Sale truthfulness",
    verifiedSaleGuard(featuredSource) &&
      verifiedSaleGuard(quickShopSource) &&
      verifiedSaleGuard(merchandisingSource),
    {
      featuredGuard: verifiedSaleGuard(featuredSource),
      quickShopGuard: verifiedSaleGuard(quickShopSource),
      merchandisingGuard: verifiedSaleGuard(merchandisingSource),
    },
  );

  record(
    "Commercial discovery contracts",
    quickShopSource.includes('quick: "new"') &&
      quickShopSource.includes('quick: "sale"') &&
      quickShopSource.includes('quick: "limited"') &&
      quickShopSource.includes('category: "lifestyle"') &&
      merchandisingSource.includes('role="tablist"') &&
      merchandisingSource.includes('role="tabpanel"') &&
      merchandisingSource.includes("aria-selected={selected}") &&
      merchandisingSource.includes("setMode(item.id)"),
    {
      quickNew: quickShopSource.includes('quick: "new"'),
      quickSale: quickShopSource.includes('quick: "sale"'),
      quickLimited: quickShopSource.includes('quick: "limited"'),
      lifestylePath: quickShopSource.includes('category: "lifestyle"'),
      accessibleTabs:
        merchandisingSource.includes('role="tablist"') &&
        merchandisingSource.includes('role="tabpanel"') &&
        merchandisingSource.includes("aria-selected={selected}"),
    },
  );

  const imageTags = [...combined.matchAll(/<img\b[\s\S]*?>/g)].map((match) => match[0]);
  const imagesWithoutAlt = imageTags.filter((tag) => !/\balt=/.test(tag));
  record("Alt policy", imagesWithoutAlt.length === 0, {
    imageTagCount: imageTags.length,
    imagesWithoutAlt,
    HomeImageRequiresAlt: /alt:\s*string/.test(
      sources["src/components/sections/HomeImage.tsx"] ?? "",
    ),
  });

  record(
    "Hero image dimensions and LCP policy",
    /width=\{900\}/.test(viewerSource) &&
      /height=\{900\}/.test(viewerSource) &&
      /loading=\{priority \? "eager" : "lazy"\}/.test(viewerSource) &&
      /fetchPriority=\{priority \? "high" : "auto"\}/.test(viewerSource) &&
      /priority/.test(heroSource),
    {
      width: 900,
      height: 900,
      heroPriority: heroSource.includes("priority"),
      heroLazyLoaded: false,
    },
  );

  const reducedMotionCss =
    stylesSource.includes("prefers-reduced-motion: reduce") ||
    motionStylesSource.includes("prefers-reduced-motion: reduce");
  const hydrationSafeReducedMotion =
    viewerSource.includes("useReducedMotion") &&
    viewerSource.includes("prefersReducedMotion") &&
    viewerSource.includes("hydrated") &&
    viewerSource.includes("const reduced = hydrated && prefersReducedMotion === true");
  record("Reduced motion hooks", hydrationSafeReducedMotion && reducedMotionCss, {
    componentHook: viewerSource.includes("useReducedMotion"),
    hydrationSafe: hydrationSafeReducedMotion,
    cssHook: reducedMotionCss,
  });

  const touchContractCount = count(combined, /data-f3-touch-target="true"/g);
  record("Touch target contract", touchContractCount >= 18, {
    declaredTargets: touchContractCount,
    minimumClassPresent: /min-h-11|size-11/.test(combined),
  });

  const progressive3D =
    viewerSource.includes('data-testid="shoe-viewer-enable-3d"') &&
    viewerSource.includes('import("@google/model-viewer")') &&
    viewerSource.includes('import("@/lib/create-shoe-model")') &&
    viewerSource.includes("IntersectionObserver") &&
    viewerSource.includes("activated && inView && documentVisible") &&
    viewerSource.includes("!reduced") &&
    !viewerSource.includes("auto-rotate");
  record(
    "Homepage resilient states",
    combined.includes('data-image-fallback="true"') &&
      combined.includes('data-testid="home-featured-empty"') &&
      heroSource.includes("?? SHOES[0]") &&
      viewerSource.includes('data-testid="hero-poster"') &&
      progressive3D,
    {
      imageFailure: combined.includes('data-image-fallback="true"'),
      emptyState: combined.includes('data-testid="home-featured-empty"'),
      missingProductFallback: heroSource.includes("?? SHOES[0]"),
      staticPoster: viewerSource.includes('data-testid="hero-poster"'),
      progressive3D,
    },
  );

  const homeFlow = [
    "<Hero />",
    "<QuickShopPaths />",
    "<FeaturedDrops />",
    "<MerchandisingShowcase />",
    "<Categories />",
    "<BrandWall />",
    "<HypeSection />",
    "<TrustBadges />",
    "<Newsletter />",
  ];
  const flowPositions = homeFlow.map((token) => indexSource.indexOf(token));
  const orderedFlow = flowPositions.every(
    (position, index) => position >= 0 && (index === 0 || position > flowPositions[index - 1]),
  );
  record(
    "Product-first information architecture",
    !indexSource.includes("Marquee") && !indexSource.includes("RevealOnScroll") && orderedFlow,
    {
      marqueeRemoved: !indexSource.includes("Marquee"),
      revealDependencyRemoved: !indexSource.includes("RevealOnScroll"),
      orderedFlow,
      flowPositions,
    },
  );

  record(
    "Stable homepage media",
    !combined.includes("images.unsplash.com") &&
      featuredSource.includes("FEATURED_IDS") &&
      featuredSource.includes("[2, 3, 16, 22]"),
    {
      remoteHomepageMediaLiteral: combined.includes("images.unsplash.com"),
      localFeaturedIds: [2, 3, 16, 22],
    },
  );

  const handoffPath = "docs/handoffs/F3-HOMEPAGE.md";
  record("Handoff presence", fs.existsSync(path.join(ROOT, handoffPath)), { handoffPath });

  const trackedArtifacts = runGit(["ls-files", "artifacts"]);
  const tracked =
    trackedArtifacts.status === 0
      ? trackedArtifacts.stdout
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
      : [];
  record("Runtime artifacts are not committed", tracked.length === 0, { tracked });

  const report = {
    schemaVersion: 1,
    audit: "f3-homepage",
    foundationSha: FOUNDATION_SHA,
    generatedAt: new Date().toISOString(),
    pass: checks.every((check) => check.pass),
    totals: {
      checks: checks.length,
      passed: checks.filter((check) => check.pass).length,
      failed: checks.filter((check) => !check.pass).length,
    },
    checks,
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.totals));
  process.exitCode = report.pass ? 0 : 1;
}

try {
  main();
} catch (error) {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  const report = {
    schemaVersion: 1,
    audit: "f3-homepage",
    foundationSha: FOUNDATION_SHA,
    generatedAt: new Date().toISOString(),
    pass: false,
    fatalError: error instanceof Error ? (error.stack ?? error.message) : String(error),
    checks,
  };
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.error(report.fatalError);
  process.exitCode = 1;
}

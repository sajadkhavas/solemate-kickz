import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const BASELINE = "f1bd39e348d4fb4774874ccfdabe491bc9b2d0a4";
const REPORT = path.join(ROOT, "artifacts/audits/f10-motion-3d.json");
const checks = [];

function record(name, pass, evidence = null) {
  checks.push({ name, pass: Boolean(pass), evidence });
  if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
}
function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}
function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}
function git(...args) {
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout.trim(), stderr: result.stderr.trim() };
}

const requiredFiles = [
  "src/lib/motion-system.ts",
  "src/motion.css",
  "src/components/ShoeViewer3D.tsx",
  "src/components/MagneticCursor.tsx",
  "src/hooks/useMouseParallax.ts",
  "scripts/f10-browser-runner.mjs",
  "scripts/audit-f10-motion-3d.mjs",
  "scripts/test-f10-motion-3d.mjs",
  "scripts/visual-qa-f10-motion-3d.mjs",
  "docs/handoffs/F10-MOTION-3D-INTERACTION.md",
  "src/lib/create-shoe-model.ts",
];

const branch = git("branch", "--show-current");
record(
  "branch is controlled",
  branch.stdout === "phase/sole-f10-motion-3d-interaction" || process.env.CI === "true",
  branch,
);
record(
  "accepted Integration baseline is an ancestor",
  git("merge-base", "--is-ancestor", BASELINE, "HEAD").status === 0,
  BASELINE,
);
for (const file of requiredFiles) record(`${file} exists`, exists(file), file);

const modelFactoryBytes = exists("src/lib/create-shoe-model.ts")
  ? fs.statSync(path.join(ROOT, "src/lib/create-shoe-model.ts")).size
  : Number.POSITIVE_INFINITY;
record("oversized baseline GLB is removed", !exists("public/models/shoe.glb"), "public/models/shoe.glb");
record(
  "lazy procedural 3D source stays far below the preferred 3MB budget",
  modelFactoryBytes <= 3 * 1024 * 1024,
  modelFactoryBytes,
);

const viewer = read("src/components/ShoeViewer3D.tsx");
const modelFactory = read("src/lib/create-shoe-model.ts");
const cursor = read("src/components/MagneticCursor.tsx");
const parallax = read("src/hooks/useMouseParallax.ts");
const reveal = read("src/components/RevealOnScroll.tsx");
const kinetic = read("src/components/KineticText.tsx");
const motionCss = read("src/motion.css");
const root = read("src/routes/__root.tsx");
const packageJson = read("package.json");
const workflow = read(".github/workflows/frontend-ci.yml");
const verifier = read("scripts/verify-cumulative-quality.mjs");
const visual = read("scripts/visual-qa-f10-motion-3d.mjs");
const behavior = read("scripts/test-f10-motion-3d.mjs");

record(
  "3D is explicit progressive enhancement",
  viewer.includes('data-testid="shoe-viewer-enable-3d"') &&
    viewer.includes('import("@google/model-viewer")') &&
    viewer.includes('import("@/lib/create-shoe-model")') &&
    viewer.includes("activated && inView && documentVisible") &&
    !viewer.includes("auto-rotate"),
);
record(
  "procedural model is generated as a GLB blob only after lazy import",
  modelFactory.includes("createShoeModelBlob") &&
    modelFactory.includes("0x46546c67") &&
    modelFactory.includes("model/gltf-binary"),
);
record(
  "3D has static, WebGL, reduced-motion and load-error fallback",
  viewer.includes("hero-poster") &&
    viewer.includes("hasWebGL") &&
    viewer.includes("useReducedMotion") &&
    viewer.includes("setErrored(true)"),
);
record(
  "3D pauses offscreen and when the document is hidden",
  viewer.includes("IntersectionObserver") &&
    viewer.includes("observer.disconnect()") &&
    viewer.includes('document.addEventListener("visibilitychange"') &&
    viewer.includes("!documentVisible"),
);
record(
  "3D touch keeps vertical page scrolling available",
  viewer.includes('touchAction: "pan-y"'),
);
record(
  "legacy custom pointer is retired rather than hiding native input",
  cursor.includes("return null") &&
    !cursor.includes('document.body.style.cursor = "none"') &&
    !cursor.includes("requestAnimationFrame"),
);
record(
  "pointer parallax is event-driven without recursive RAF",
  parallax.includes('window.addEventListener("pointermove"') &&
    parallax.includes("requestAnimationFrame(flush)") &&
    !parallax.includes("requestAnimationFrame(tick)") &&
    parallax.includes('document.addEventListener("visibilitychange"'),
);
record(
  "content reveal follows Constitution travel and timing",
  reveal.includes("y: 18") &&
    reveal.includes("x: -18") &&
    reveal.includes("scale: 0.98") &&
    reveal.includes("motionTransitions.reveal") &&
    !reveal.includes("60") &&
    !reveal.includes("0.7"),
);
record(
  "kinetic text removes large 3D flip and respects reduced motion",
  kinetic.includes("useReducedMotion") &&
    kinetic.includes("y: 10") &&
    !kinetic.includes("rotateX: -60") &&
    kinetic.includes("motionTransitions.reveal"),
);
record(
  "shared motion grammar is mounted after base styling",
  root.includes("motion.css?url") && root.includes('data-motion="navigation-feedback"'),
);
record(
  "legacy ambient infinite loops are disabled",
  [".animate-marquee", ".animate-float", ".animate-pulse-glow", ".animate-spin-slow", ".hero-particle"].every(
    (selector) => motionCss.includes(selector),
  ) && motionCss.includes("animation: none !important"),
);
record(
  "dialog drawer product cart and reduced-motion contracts exist",
  motionCss.includes("--motion-duration-dialog: 240ms") &&
    motionCss.includes('[data-testid="search-dialog"]') &&
    motionCss.includes('[data-testid="cart-drawer-item"]') &&
    motionCss.includes("@media (prefers-reduced-motion: reduce)"),
);
record(
  "F10 commands and cumulative verifier are registered",
  packageJson.includes('"audit:f10"') &&
    packageJson.includes('"test:f10"') &&
    packageJson.includes('"qa:visual:f10"') &&
    packageJson.includes("bun run audit:f10") &&
    packageJson.includes("bun run test:f10") &&
    packageJson.includes("bun run qa:visual:f10") &&
    verifier.includes('"f10-motion-3d"'),
);
record(
  "Frontend CI runs F10 exact-head audit behavior and visual gates",
  workflow.includes("F10 motion 3D interaction completion audit") &&
    workflow.includes("F10 motion 3D interaction browser behavior tests") &&
    workflow.includes("F10 motion 3D interaction Visual QA") &&
    workflow.includes("contents: read") &&
    !workflow.includes("contents: write"),
);
record(
  "F10 behavior gate covers lazy 3D reduced motion pointer and Escape",
  behavior.includes("3D stays lazy before explicit activation") &&
    behavior.includes("Reduced motion keeps the static product poster") &&
    behavior.includes("Native pointer remains available") &&
    behavior.includes("Cart drawer Escape remains immediate"),
);
record(
  "F10 Visual QA covers required viewports and interaction modes",
  [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920].every((width) =>
    visual.includes(`[${width},`),
  ) &&
    visual.includes("reduced-motion") &&
    visual.includes("touch") &&
    visual.includes("slow-device") &&
    visual.includes("offscreen-infinite-animations"),
);
record(
  "runtime artifacts are not tracked",
  git("ls-files", "artifacts").stdout === "",
  git("ls-files", "artifacts").stdout,
);

const failed = checks.filter((check) => !check.pass);
const report = {
  schemaVersion: 1,
  suite: "f10-motion-3d-audit",
  generatedAt: new Date().toISOString(),
  baseline: BASELINE,
  modelFactoryBytes,
  summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length },
  checks,
  pass: failed.length === 0,
};
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (!report.pass) process.exitCode = 1;

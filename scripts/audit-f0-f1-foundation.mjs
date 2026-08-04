import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import ts from "typescript";

const ROOT = process.cwd();
const BASELINE = "137344f1d89373a55e3bf4bb4d82b48d8247b45f";
const OUTPUT_PATH = path.join(ROOT, "artifacts/reports/f0-f1-foundation.json");
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function addCheck(id, pass, evidence, severity = "error") {
  checks.push({ id, status: pass ? "pass" : "fail", severity, evidence });
}

function gitLines(args) {
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 0) return [];
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function walk(directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (
      [".git", "node_modules", "dist", ".output", ".vinxi", ".nitro", "artifacts"].includes(
        entry.name,
      )
    )
      continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolutePath, files);
    else files.push(absolutePath);
  }
  return files;
}

function relative(absolutePath) {
  return path.relative(ROOT, absolutePath).replaceAll(path.sep, "/");
}

function jsxTagName(node) {
  const tagName = node.tagName;
  if (ts.isIdentifier(tagName)) return tagName.text;
  return tagName.getText();
}

function findJsxAttribute(attributes, attributeName) {
  return attributes.properties.find(
    (candidate) =>
      ts.isJsxAttribute(candidate) &&
      ts.isIdentifier(candidate.name) &&
      candidate.name.text === attributeName,
  );
}

function attributeValue(attributes, attributeName) {
  const attribute = findJsxAttribute(attributes, attributeName);
  if (!attribute || !ts.isJsxAttribute(attribute) || !attribute.initializer) return null;
  if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer.text;
  if (ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression) {
    const expression = attribute.initializer.expression;
    if (ts.isNumericLiteral(expression)) return Number(expression.text);
    if (ts.isStringLiteral(expression)) return expression.text;
    if (expression.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (expression.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (ts.isPrefixUnaryExpression(expression) && ts.isNumericLiteral(expression.operand)) {
      const value = Number(expression.operand.text);
      return expression.operator === ts.SyntaxKind.MinusToken ? -value : value;
    }
  }
  return null;
}

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function inspectTsxFile(absolutePath) {
  const filePath = relative(absolutePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  const sourceFile = ts.createSourceFile(
    absolutePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    absolutePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const issues = [];
  const interactiveStack = [];

  function inspectOpening(node) {
    const name = jsxTagName(node);
    const normalized = name.toLowerCase();
    const href = attributeValue(node.attributes, "href");
    const tabIndex = attributeValue(node.attributes, "tabIndex");
    const asChild = Boolean(findJsxAttribute(node.attributes, "asChild"));

    if (
      href === "#" ||
      (typeof href === "string" && href.toLowerCase().startsWith("javascript:"))
    ) {
      issues.push({
        type: "unsafe-url",
        file: filePath,
        line: lineOf(sourceFile, node),
        detail: href,
      });
    }
    if (typeof tabIndex === "number" && tabIndex > 0) {
      issues.push({
        type: "positive-tabindex",
        file: filePath,
        line: lineOf(sourceFile, node),
        detail: tabIndex,
      });
    }

    const isLink = normalized === "a" || name === "Link" || name.endsWith("Link");
    const isButton =
      !asChild && (normalized === "button" || name === "Button" || name.endsWith("Button"));
    const ancestor = interactiveStack.at(-1);
    if (ancestor?.isLink && isButton) {
      issues.push({
        type: "button-inside-link",
        file: filePath,
        line: lineOf(sourceFile, node),
        detail: `${ancestor.name} > ${name}`,
      });
    }
    if (ancestor?.isButton && isLink) {
      issues.push({
        type: "link-inside-button",
        file: filePath,
        line: lineOf(sourceFile, node),
        detail: `${ancestor.name} > ${name}`,
      });
    }
    return { name, isLink, isButton };
  }

  function visit(node) {
    if (ts.isJsxElement(node)) {
      const interaction = inspectOpening(node.openingElement);
      const interactive = interaction.isLink || interaction.isButton;
      if (interactive) interactiveStack.push(interaction);
      for (const child of node.children) visit(child);
      if (interactive) interactiveStack.pop();
      return;
    }
    if (ts.isJsxSelfClosingElement(node)) inspectOpening(node);
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return issues;
}

const constitutionPath = "docs/frontend/SOLE_FRONTEND_CONSTITUTION.md";
const designSystemPath = "docs/frontend/SOLE_DESIGN_SYSTEM.md";
const handoffPath = "docs/handoffs/F0-F1-FOUNDATION.md";
const workflowPath = ".github/workflows/frontend-ci.yml";
const rootPath = "src/routes/__root.tsx";
const foundationCssPath = "src/foundation.css";
const commercePath = "src/components/ui/commerce-primitives.tsx";
const behaviorPath = "scripts/test-f0-f1-behavior.mjs";
const sourceContractPath = "scripts/test-f0-f1-primitives.mjs";

for (const requiredPath of [
  constitutionPath,
  designSystemPath,
  handoffPath,
  workflowPath,
  rootPath,
  foundationCssPath,
  commercePath,
  behaviorPath,
  sourceContractPath,
]) {
  addCheck(`file.exists:${requiredPath}`, exists(requiredPath), requiredPath);
}

const trackedFiles = gitLines(["ls-files"]);
const forbiddenExact = ["src/routes/__root.next.tsx", "tmp-test-do-not-use"];
const forbiddenPattern =
  /(?:^|\/)(?:[^/]*(?:\.tmp|\.bak|\.orig|\.rej)|[^/]*(?:replacement|probe|scratch|one[-_.]?shot|finalize[-_.]?once|handoff[-_.]?once|connector[-_.]?capability)[^/]*)$/i;
const forbiddenTracked = trackedFiles.filter(
  (file) => forbiddenExact.includes(file) || forbiddenPattern.test(file),
);
addCheck("tree.no-temporary-files", forbiddenTracked.length === 0, forbiddenTracked);

const trackedArtifacts = trackedFiles.filter((file) => file.startsWith("artifacts/"));
addCheck("tree.no-runtime-artifacts", trackedArtifacts.length === 0, trackedArtifacts);

const workflowFiles = trackedFiles.filter((file) => /^\.github\/workflows\/.*\.ya?ml$/.test(file));
const workflowViolations = [];
for (const file of workflowFiles) {
  const source = read(file);
  if (/permissions:\s*[\s\S]*?contents:\s*write/i.test(source))
    workflowViolations.push({ file, type: "contents-write" });
  if (/bun-version:\s*(?:latest|["']latest["'])/i.test(source))
    workflowViolations.push({ file, type: "bun-latest" });
  if (/\bgit\s+(?:commit|push)\b/i.test(source))
    workflowViolations.push({ file, type: "git-write" });
  if (/continue-on-error:\s*true/i.test(source))
    workflowViolations.push({ file, type: "continue-on-error" });
}
addCheck("workflow.read-only", workflowViolations.length === 0, workflowViolations);
addCheck(
  "workflow.single-quality-gate",
  workflowFiles.length === 1 && workflowFiles[0] === workflowPath,
  workflowFiles,
);

const workflow = exists(workflowPath) ? read(workflowPath) : "";
const requiredWorkflowPatterns = [
  ["pull_request", /\bpull_request\s*:/],
  ["phase-push", /phase\/\*\*/],
  ["integration-push", /integration\/\*\*/],
  ["contents-read", /contents:\s*read/],
  ["node-22.23.1", /node-version:\s*["']?22\.23\.1/],
  ["bun-1.3.14", /bun-version:\s*["']?1\.3\.14/],
  ["frozen-lockfile", /bun install --frozen-lockfile/],
  ["audit", /bun run audit:f0-f1/],
  ["source-contract", /bun run audit:source-contracts/],
  ["behavior", /bun run test:foundation/],
  ["typecheck", /bun run typecheck/],
  ["lint", /bun run lint/],
  ["format-check", /bun run format:check/],
  ["build", /bun run build/],
  ["visual", /bun run qa:visual:f0-f1/],
  ["artifact-upload", /actions\/upload-artifact@v4/],
];
const missingWorkflowRequirements = requiredWorkflowPatterns
  .filter(([, pattern]) => !pattern.test(workflow))
  .map(([name]) => name);
addCheck(
  "workflow.complete-gate",
  missingWorkflowRequirements.length === 0,
  missingWorkflowRequirements,
);

const packageJson = JSON.parse(read("package.json"));
addCheck(
  "toolchain.package-manager",
  packageJson.packageManager === "bun@1.3.14",
  packageJson.packageManager,
);
addCheck(
  "scripts.behavior-test",
  packageJson.scripts?.["test:foundation"] === "node scripts/run-browser-check.mjs behavior",
  packageJson.scripts?.["test:foundation"],
);
addCheck(
  "scripts.visual-test",
  packageJson.scripts?.["qa:visual:f0-f1"] === "node scripts/run-browser-check.mjs visual",
  packageJson.scripts?.["qa:visual:f0-f1"],
);
addCheck(
  "scripts.source-contract-audit",
  Boolean(packageJson.scripts?.["audit:source-contracts"]),
  packageJson.scripts?.["audit:source-contracts"],
);
addCheck(
  "scripts.check-has-format",
  /bun run format:check/.test(packageJson.scripts?.check ?? ""),
  packageJson.scripts?.check,
);
addCheck(
  "scripts.check-has-behavior",
  /bun run test:foundation/.test(packageJson.scripts?.check ?? ""),
  packageJson.scripts?.check,
);
addCheck(
  "scripts.check-has-visual",
  /bun run qa:visual:f0-f1/.test(packageJson.scripts?.check ?? ""),
  packageJson.scripts?.check,
);

const rootSource = exists(rootPath) ? read(rootPath) : "";
const foundationCss = exists(foundationCssPath) ? read(foundationCssPath) : "";
const commerceSource = exists(commercePath) ? read(commercePath) : "";
addCheck("document.lang-fa", /<html[^>]*lang=["']fa["']/.test(rootSource), rootPath);
addCheck("document.dir-rtl", /<html[^>]*dir=["']rtl["']/.test(rootSource), rootPath);
addCheck(
  "document.skip-link",
  /href=["']#main-content["']/.test(rootSource) && /id=["']main-content["']/.test(rootSource),
  rootPath,
);
addCheck("document.foundation-css", /foundation\.css\?url/.test(rootSource), rootPath);
addCheck("focus.visible", /:focus-visible/.test(foundationCss), foundationCssPath);
addCheck(
  "motion.reduced",
  /prefers-reduced-motion:\s*reduce/.test(foundationCss),
  foundationCssPath,
);
addCheck(
  "layout.document-overflow-guard",
  /#main-content[\s\S]*overflow-x:\s*clip/.test(foundationCss),
  foundationCssPath,
);
addCheck(
  "touch.shared-minimum",
  /--size-touch/.test(foundationCss) && /min-block-size:\s*var\(--size-touch\)/.test(foundationCss),
  foundationCssPath,
);

const sourceFiles = walk(path.join(ROOT, "src")).filter(
  (file) => /\.(?:ts|tsx)$/.test(file) && !file.endsWith("routeTree.gen.ts"),
);
const interactionIssues = sourceFiles.flatMap(inspectTsxFile);
for (const type of [
  "unsafe-url",
  "positive-tabindex",
  "button-inside-link",
  "link-inside-button",
]) {
  const issues = interactionIssues.filter((issue) => issue.type === type);
  addCheck(`interaction.no-${type}`, issues.length === 0, issues);
}

const requiredCommerceExports = [
  "IconButton",
  "TextLink",
  "SearchInput",
  "Price",
  "DiscountPrice",
  "StockState",
  "QuantityStepper",
  "Spinner",
  "EmptyState",
  "ErrorState",
  "VisuallyHidden",
];
const missingCommerceExports = requiredCommerceExports.filter(
  (name) => !new RegExp(`\\b${name}\\b`).test(commerceSource),
);
addCheck("primitives.commerce", missingCommerceExports.length === 0, missingCommerceExports);

const handoff = exists(handoffPath) ? read(handoffPath) : "";
addCheck("handoff.no-pending", !/\bPending\b/i.test(handoff), handoffPath);
addCheck("handoff.ready", /Ready for supervisor review:\s*Yes/i.test(handoff), handoffPath);
const validatedSha =
  handoff.match(/Validated implementation SHA:\s*`?([a-f0-9]{40})`?/i)?.[1] ?? null;
addCheck("handoff.validated-sha", Boolean(validatedSha), validatedSha);
addCheck(
  "handoff.command-results",
  /bun install --frozen-lockfile[\s\S]*Exit code:\s*0/i.test(handoff) &&
    /bun run check[\s\S]*Exit code:\s*0/i.test(handoff),
  handoffPath,
);
addCheck(
  "handoff.visual-result",
  /Visual QA[\s\S]*foundationCriticalFindings:\s*0/i.test(handoff),
  handoffPath,
);
addCheck(
  "handoff.behavior-result",
  /Browser behavior tests[\s\S]*failed:\s*0/i.test(handoff),
  handoffPath,
);
addCheck(
  "handoff.phase-map",
  /F2 — Global Shell, Navigation and Search/.test(handoff) &&
    /F12 — Accessibility and Final QA/.test(handoff),
  handoffPath,
);

const sourceContract = exists(sourceContractPath) ? read(sourceContractPath) : "";
const behaviorSource = exists(behaviorPath) ? read(behaviorPath) : "";
addCheck(
  "tests.source-contract-labelled",
  /source-contract/i.test(sourceContract),
  sourceContractPath,
);
const requiredBehaviorNames = [
  "Button default type",
  "Button loading and disabled behavior",
  "IconButton accessible name",
  "QuantityStepper minimum and maximum behavior",
  "Price direction rendering",
  "Cart Drawer open and body scroll lock",
  "Cart Drawer focus trap",
  "Cart Drawer Escape close and focus restoration",
  "Cart Drawer overlay dismissal policy",
  "Route-change focus",
  "Skip-link target",
  "Reduced-motion behavior",
];
const missingBehaviorTests = requiredBehaviorNames.filter((name) => !behaviorSource.includes(name));
addCheck("tests.behavior-coverage", missingBehaviorTests.length === 0, missingBehaviorTests);

const constitution = exists(constitutionPath) ? read(constitutionPath) : "";
const designSystem = exists(designSystemPath) ? read(designSystemPath) : "";
addCheck(
  "constitution.performance-budget",
  /initial route JS/i.test(constitution) &&
    /LCP/.test(constitution) &&
    /3D model/.test(constitution),
  constitutionPath,
);
addCheck(
  "constitution.truthfulness",
  /Truthfulness policy/i.test(constitution) && /fabricated reviews/i.test(constitution),
  constitutionPath,
);
addCheck(
  "design-system.overlay-contract",
  /Overlay contract/i.test(designSystem) && /focus is trapped/i.test(designSystem),
  designSystemPath,
);

const failures = checks.filter((check) => check.severity === "error" && check.status === "fail");
const report = {
  schemaVersion: 2,
  audit: "f0-f1-foundation",
  baseline: BASELINE,
  generatedAt: new Date().toISOString(),
  pass: failures.length === 0,
  summary: {
    total: checks.length,
    passed: checks.filter((check) => check.status === "pass").length,
    failed: checks.filter((check) => check.status === "fail").length,
  },
  checks,
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
console.log(`Foundation audit report: ${relative(OUTPUT_PATH)}`);
if (!report.pass) {
  for (const failure of failures)
    console.error(`FAIL ${failure.id}: ${JSON.stringify(failure.evidence)}`);
  process.exitCode = 1;
}

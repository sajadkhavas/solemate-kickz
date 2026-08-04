import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const ROOT = process.cwd();
const OUTPUT_PATH = path.join(ROOT, "artifacts/audits/f0-f1-foundation.json");
const BASELINE = "137344f1d89373a55e3bf4bb4d82b48d8247b45f";

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

function walk(directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", "dist", ".output", ".vinxi", "artifacts"].includes(entry.name)) continue;
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

function attributeValue(attributes, attributeName) {
  const attribute = attributes.properties.find(
    (candidate) => ts.isJsxAttribute(candidate) && candidate.name.text === attributeName,
  );
  if (!attribute || !ts.isJsxAttribute(attribute) || !attribute.initializer) return null;
  if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer.text;
  if (ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression) {
    const expression = attribute.initializer.expression;
    if (ts.isNumericLiteral(expression)) return Number(expression.text);
    if (ts.isStringLiteral(expression)) return expression.text;
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

  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const name = jsxTagName(node);
      const normalizedName = name.toLowerCase();
      const href = attributeValue(node.attributes, "href");
      const tabIndex = attributeValue(node.attributes, "tabIndex");

      if (href === "#" || (typeof href === "string" && href.trim().toLowerCase().startsWith("javascript:"))) {
        issues.push({
          type: "unsafe-url",
          file: relative(absolutePath),
          line: lineOf(sourceFile, node),
          detail: String(href),
        });
      }

      if (typeof tabIndex === "number" && tabIndex > 0) {
        issues.push({
          type: "positive-tabindex",
          file: relative(absolutePath),
          line: lineOf(sourceFile, node),
          detail: String(tabIndex),
        });
      }

      const isLink = normalizedName === "a" || name === "Link" || name.endsWith("Link");
      const isButton = normalizedName === "button" || name === "Button" || name.endsWith("Button");
      const parentInteractive = interactiveStack.at(-1);

      if (parentInteractive?.isLink && isButton) {
        issues.push({
          type: "button-inside-link",
          file: relative(absolutePath),
          line: lineOf(sourceFile, node),
          detail: `${parentInteractive.name} > ${name}`,
        });
      }
      if (parentInteractive?.isButton && isLink) {
        issues.push({
          type: "link-inside-button",
          file: relative(absolutePath),
          line: lineOf(sourceFile, node),
          detail: `${parentInteractive.name} > ${name}`,
        });
      }

      if (ts.isJsxOpeningElement(node)) {
        interactiveStack.push({ name, isLink, isButton });
        ts.forEachChild(node, visit);
        interactiveStack.pop();
        return;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return issues;
}

const constitutionPath = "docs/frontend/SOLE_FRONTEND_CONSTITUTION.md";
const designSystemPath = "docs/frontend/SOLE_DESIGN_SYSTEM.md";
const handoffPath = "docs/handoffs/F0-F1-FOUNDATION.md";
const rootPath = "src/routes/__root.tsx";
const stylesPath = "src/styles.css";
const commercePath = "src/components/ui/commerce-primitives.tsx";

addCheck("constitution.exists", exists(constitutionPath), constitutionPath);
addCheck("design-system.exists", exists(designSystemPath), designSystemPath);
addCheck("handoff.exists", exists(handoffPath), handoffPath);

const constitution = exists(constitutionPath) ? read(constitutionPath) : "";
const designSystem = exists(designSystemPath) ? read(designSystemPath) : "";
const rootSource = exists(rootPath) ? read(rootPath) : "";
const stylesSource = exists(stylesPath) ? read(stylesPath) : "";
const commerceSource = exists(commercePath) ? read(commercePath) : "";

addCheck("document.lang-fa", /<html[^>]*\blang=["']fa["']/.test(rootSource), rootPath);
addCheck("document.dir-rtl", /<html[^>]*\bdir=["']rtl["']/.test(rootSource), rootPath);
addCheck(
  "document.skip-link",
  /className=["'][^"']*skip-link/.test(rootSource) && /href=["']#main-content["']/.test(rootSource),
  rootPath,
);
addCheck(
  "focus.global-visible",
  /:focus-visible/.test(stylesSource) && /--(?:color-)?focus/.test(stylesSource),
  stylesPath,
);
addCheck(
  "motion.reduced-foundation",
  /prefers-reduced-motion:\s*reduce/.test(stylesSource) && /animation-duration:\s*0\.01ms/.test(stylesSource),
  stylesPath,
);

const sourceFiles = walk(path.join(ROOT, "src")).filter(
  (file) => /\.(?:ts|tsx)$/.test(file) && !file.endsWith("routeTree.gen.ts"),
);
const interactionIssues = sourceFiles.flatMap(inspectTsxFile);
const issuesByType = (type) => interactionIssues.filter((issue) => issue.type === type);

addCheck("interaction.no-unsafe-url", issuesByType("unsafe-url").length === 0, issuesByType("unsafe-url"));
addCheck(
  "interaction.no-positive-tabindex",
  issuesByType("positive-tabindex").length === 0,
  issuesByType("positive-tabindex"),
);
addCheck(
  "interaction.no-button-inside-link",
  issuesByType("button-inside-link").length === 0,
  issuesByType("button-inside-link"),
);
addCheck(
  "interaction.no-link-inside-button",
  issuesByType("link-inside-button").length === 0,
  issuesByType("link-inside-button"),
);

const requiredTokens = [
  "--background",
  "--surface",
  "--surface-elevated",
  "--interactive",
  "--primary",
  "--secondary",
  "--muted",
  "--success",
  "--warning",
  "--danger",
  "--stock-in",
  "--stock-low",
  "--stock-out",
  "--sale",
  "--focus",
  "--disabled",
  "--overlay",
  "--duration-fast",
  "--ease-standard",
  "--container-standard",
  "--z-modal",
];
const missingTokens = requiredTokens.filter((token) => !stylesSource.includes(token));
addCheck("tokens.semantic", missingTokens.length === 0, { missing: missingTokens });

const existingPrimitiveFiles = {
  Button: "src/components/ui/button.tsx",
  Input: "src/components/ui/input.tsx",
  Textarea: "src/components/ui/textarea.tsx",
  Select: "src/components/ui/select.tsx",
  Checkbox: "src/components/ui/checkbox.tsx",
  RadioGroup: "src/components/ui/radio-group.tsx",
  Switch: "src/components/ui/switch.tsx",
  Slider: "src/components/ui/slider.tsx",
  Badge: "src/components/ui/badge.tsx",
  Skeleton: "src/components/ui/skeleton.tsx",
  Alert: "src/components/ui/alert.tsx",
  Toast: "src/components/ui/sonner.tsx",
  Tooltip: "src/components/ui/tooltip.tsx",
  Popover: "src/components/ui/popover.tsx",
  Dialog: "src/components/ui/dialog.tsx",
  Drawer: "src/components/ui/drawer.tsx",
  Accordion: "src/components/ui/accordion.tsx",
  Tabs: "src/components/ui/tabs.tsx",
  Breadcrumb: "src/components/ui/breadcrumb.tsx",
  Pagination: "src/components/ui/pagination.tsx",
};
const missingPrimitiveFiles = Object.entries(existingPrimitiveFiles)
  .filter(([, primitivePath]) => !exists(primitivePath))
  .map(([name, primitivePath]) => ({ name, path: primitivePath }));
addCheck("primitives.shared-files", missingPrimitiveFiles.length === 0, missingPrimitiveFiles);

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
addCheck("primitives.commerce", missingCommerceExports.length === 0, {
  path: commercePath,
  missing: missingCommerceExports,
});

const remoteFontPatterns = [
  /fonts\.googleapis\.com/i,
  /fonts\.gstatic\.com/i,
  /rel:\s*["']stylesheet["'][\s\S]{0,120}https?:\/\//i,
];
addCheck(
  "fonts.no-render-blocking-remote",
  remoteFontPatterns.every((pattern) => !pattern.test(rootSource)),
  rootPath,
);

addCheck(
  "performance.budget-documented",
  /initial route JS/i.test(constitution) && /LCP/.test(constitution) && /3D model/.test(constitution),
  constitutionPath,
);
addCheck(
  "truthfulness.policy-documented",
  /Truthfulness policy/i.test(constitution) && /fabricated reviews/i.test(constitution),
  constitutionPath,
);
addCheck(
  "overlay.contract-documented",
  /Overlay contract/i.test(designSystem) && /focus is trapped/i.test(designSystem),
  designSystemPath,
);

const errorFailures = checks.filter((check) => check.severity === "error" && check.status === "fail");
const report = {
  schemaVersion: 1,
  audit: "f0-f1-foundation",
  baseline: BASELINE,
  generatedAt: new Date().toISOString(),
  pass: errorFailures.length === 0,
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
  for (const failure of errorFailures) {
    console.error(`FAIL ${failure.id}: ${JSON.stringify(failure.evidence)}`);
  }
  process.exitCode = 1;
}

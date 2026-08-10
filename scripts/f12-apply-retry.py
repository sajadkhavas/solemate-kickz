from pathlib import Path
import json


def replace(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"missing replacement target in {path}: {old[:100]!r}")
    p.write_text(text.replace(old, new, 1))


# Homepage render containment. Keep literal component tokens so inherited F3 source audits remain valid.
replace(
    "src/routes/index.tsx",
    'import { createFileRoute } from "@tanstack/react-router";\n',
    'import { createFileRoute } from "@tanstack/react-router";\nimport type { ReactNode } from "react";\n',
)
replace(
    "src/routes/index.tsx",
    "function Home() {\n",
    'function PerfSection({ children }: { children: ReactNode }) {\n  return (\n    <div\n      data-f12-content-visibility="auto"\n      className="[contain-intrinsic-size:auto_900px] [content-visibility:auto]"\n    >\n      {children}\n    </div>\n  );\n}\n\nfunction Home() {\n',
)
for component in [
    "MerchandisingShowcase",
    "Categories",
    "BrandWall",
    "HypeSection",
    "TrustBadges",
    "Newsletter",
]:
    replace(
        "src/routes/index.tsx",
        f"        <{component} />",
        f"        <PerfSection>\n          <{component} />\n        </PerfSection>",
    )

# Negotiate modern remote formats while preserving the curated Unsplash IDs and dimensions.
replace(
    "src/data/shoes.ts",
    '?w=900&h=900&fit=crop&crop=${crop}&q=80`;',
    '?w=900&h=900&fit=crop&crop=${crop}&auto=format&q=78`;',
)

# Product cards: only the first two cards per rendered list get eager/high priority.
replace(
    "src/components/ShoeCard.tsx",
    '  className,\n}: {\n  shoe: Shoe;\n  source: string;\n  imageRef: RefObject<HTMLImageElement | null>;\n  className: string;\n}) {',
    '  className,\n  priority,\n}: {\n  shoe: Shoe;\n  source: string;\n  imageRef: RefObject<HTMLImageElement | null>;\n  className: string;\n  priority: boolean;\n}) {',
)
replace(
    "src/components/ShoeCard.tsx",
    '      loading="lazy"\n      width={640}\n      height={640}\n',
    '      loading={priority ? "eager" : "lazy"}\n      fetchPriority={priority ? "high" : "auto"}\n      decoding="async"\n      width={640}\n      height={640}\n',
)
replace(
    "src/components/ShoeCard.tsx",
    '            className={`h-full w-full object-cover transition-transform duration-500 hover:scale-105 motion-reduce:transition-none ${shoe.isSoldOut ? "grayscale opacity-60" : ""}`}\n          />',
    '            className={`h-full w-full object-cover transition-transform duration-500 hover:scale-105 motion-reduce:transition-none ${shoe.isSoldOut ? "grayscale opacity-60" : ""}`}\n            priority={index < 2}\n          />',
)
replace(
    "src/components/ShoeCard.tsx",
    '            className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none ${shoe.isSoldOut ? "grayscale opacity-60" : ""}`}\n          />',
    '            className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none ${shoe.isSoldOut ? "grayscale opacity-60" : ""}`}\n            priority={index < 2}\n          />',
)

# PDP: primary image is LCP-oriented; thumbnail requests remain lazy and low priority.
replace(
    "src/components/product/ProductGallery.tsx",
    '  testId?: string;\n  onFailure?: () => void;\n};',
    '  testId?: string;\n  onFailure?: () => void;\n  loading?: "eager" | "lazy";\n  fetchPriority?: "high" | "low" | "auto";\n  width?: number;\n  height?: number;\n};',
)
replace(
    "src/components/product/ProductGallery.tsx",
    "function SafeImage({ src, alt, className, testId, onFailure }: SafeImageProps) {",
    'function SafeImage({\n  src,\n  alt,\n  className,\n  testId,\n  onFailure,\n  loading = "lazy",\n  fetchPriority = "auto",\n  width,\n  height,\n}: SafeImageProps) {',
)
replace(
    "src/components/product/ProductGallery.tsx",
    '      alt={alt}\n      className={className}\n',
    '      alt={alt}\n      loading={loading}\n      fetchPriority={fetchPriority}\n      decoding="async"\n      width={width}\n      height={height}\n      className={className}\n',
)
replace(
    "src/components/product/ProductGallery.tsx",
    '          testId="product-main-image"\n          className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-[1.02]"\n',
    '          testId="product-main-image"\n          loading="eager"\n          fetchPriority="high"\n          width={900}\n          height={900}\n          className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-[1.02]"\n',
)
replace(
    "src/components/product/ProductGallery.tsx",
    '<SafeImage src={image} alt="" className="h-full w-full object-cover" />',
    '<SafeImage\n                src={image}\n                alt=""\n                loading="lazy"\n                fetchPriority="low"\n                width={220}\n                height={220}\n                className="h-full w-full object-cover"\n              />',
)

# Phase scripts: no dependency or lockfile edits.
package_path = Path("package.json")
package = json.loads(package_path.read_text())
scripts = package["scripts"]
scripts["audit:f12"] = "node scripts/audit-f12-performance-media.mjs"
scripts["qa:perf:f12"] = "node scripts/qa-f12-build-budgets.mjs"
scripts["format:f12"] = "prettier --write docs/handoffs/F12-PERFORMANCE-MEDIA.md scripts/audit-f12-performance-media.mjs scripts/qa-f12-build-budgets.mjs scripts/verify-cumulative-quality.mjs src/routes/index.tsx src/data/shoes.ts src/components/ShoeCard.tsx src/components/product/ProductGallery.tsx .github/workflows/frontend-ci.yml package.json"
scripts["check"] = scripts["check"].replace(
    "bun run audit:f11 && bun run audit:deploy",
    "bun run audit:f11 && bun run audit:f12 && bun run audit:deploy",
).replace(
    "bun run format:check && bun run build && bun run qa:visual:f0-f1",
    "bun run format:check && bun run build && bun run qa:perf:f12 && bun run qa:visual:f0-f1",
)
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n")

replace(
    "scripts/verify-cumulative-quality.mjs",
    '  "f11-technical-seo",\n];',
    '  "f11-technical-seo",\n  "f12-performance-media",\n];',
)

# Add the F12 source gate before deployment checks and build-budget gate immediately after production build.
replace(
    ".github/workflows/frontend-ci.yml",
    "      - name: VPS deployment contract audit\n        run: bun run audit:deploy\n",
    "      - name: F12 performance/media source audit\n        run: bun run audit:f12\n\n      - name: VPS deployment contract audit\n        run: bun run audit:deploy\n",
)
replace(
    ".github/workflows/frontend-ci.yml",
    "      - name: VPS Node-server build\n        run: bun run build:vps\n",
    "      - name: F12 build performance budgets\n        run: bun run qa:perf:f12\n\n      - name: VPS Node-server build\n        run: bun run build:vps\n",
)

replace(
    "docs/handoffs/F12-PERFORMANCE-MEDIA.md",
    "Status: In progress",
    "Status: Candidate — exact-head CI pending",
)

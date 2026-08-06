import json
from pathlib import Path

package_path = Path("package.json")
package = json.loads(package_path.read_text())
scripts = package["scripts"]
scripts["verify:cumulative"] = "node scripts/verify-cumulative-quality.mjs"
if "bun run verify:cumulative" not in scripts["check"]:
    scripts["check"] += " && bun run verify:cumulative"
for key in ("format:foundation", "format:check"):
    marker = "scripts/test-f2-navigation-search.mjs"
    replacement = marker + " scripts/verify-cumulative-quality.mjs"
    if "scripts/verify-cumulative-quality.mjs" not in scripts[key]:
        scripts[key] = scripts[key].replace(marker, replacement)
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n")

workflow_path = Path(".github/workflows/frontend-ci.yml")
workflow = workflow_path.read_text()

behavior_marker = """      - name: Homepage browser behavior tests
        run: node scripts/test-f3-homepage.mjs

      - name: F4-F5 catalog completion audit
"""
behavior_replacement = """      - name: Homepage browser behavior tests
        run: node scripts/test-f3-homepage.mjs

      - name: Navigation and search completion audit
        run: bun run audit:f2

      - name: Navigation and search browser behavior tests
        run: bun run test:f2

      - name: Content pages completion audit
        run: bun run audit:f8

      - name: Content pages browser behavior tests
        run: bun run test:f8

      - name: F4-F5 catalog completion audit
"""
if "Navigation and search completion audit" not in workflow:
    if behavior_marker not in workflow:
        raise SystemExit("Behavior insertion marker not found")
    workflow = workflow.replace(behavior_marker, behavior_replacement, 1)

visual_marker = """      - name: Foundation Visual QA
        run: bun run qa:visual:f0-f1

      - name: Homepage Visual QA
"""
visual_replacement = """      - name: Foundation Visual QA
        run: bun run qa:visual:f0-f1

      - name: Navigation and search Visual QA
        run: bun run qa:visual:f2

      - name: Content pages Visual QA
        run: bun run qa:visual:f8

      - name: Homepage Visual QA
"""
if "Navigation and search Visual QA" not in workflow:
    if visual_marker not in workflow:
        raise SystemExit("Visual insertion marker not found")
    workflow = workflow.replace(visual_marker, visual_replacement, 1)

workflow = workflow.replace(
    "      - name: Aggregate cumulative quality gate\n        run: bun run check\n",
    "      - name: Aggregate cumulative evidence verification\n        run: bun run verify:cumulative\n",
    1,
)
workflow_path.write_text(workflow)

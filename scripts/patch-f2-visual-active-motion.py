from pathlib import Path

path = Path("scripts/visual-qa-f2-navigation-search.mjs")
text = path.read_text()
old = "return frames.some((frame) => frame.transform && frame.transform !== 'none') && Number(timing?.duration || 0) > 20;"
new = "return (animation.playState === 'running' || animation.playState === 'pending') && frames.some((frame) => frame.transform && frame.transform !== 'none') && Number(timing?.duration || 0) > 20;"
if old not in text:
    raise SystemExit("Reduced-motion animation predicate not found")
text = text.replace(old, new, 1)
old_report = "    if (!report.pass) process.exitCode = 1;"
new_report = "    if (criticalFindings.length) console.error(JSON.stringify(criticalFindings, null, 2));\n    if (!report.pass) process.exitCode = 1;"
if old_report not in text:
    raise SystemExit("F2 visual report exit anchor not found")
path.write_text(text.replace(old_report, new_report, 1))

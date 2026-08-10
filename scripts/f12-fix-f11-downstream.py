from pathlib import Path

p = Path("scripts/audit-f11-technical-seo.mjs")
text = p.read_text()
old = '''const inheritedFormatFiles = [...FORMAT_CLEANUP_FILES].filter((file) => !PHASE_FILES.has(file));
const inheritedFormatComparisons = inheritedFormatFiles.map((file) => ({
  file,
  ...formatBaselineFile(file),
}));
'''
new = '''const inheritedFormatFiles = [...FORMAT_CLEANUP_FILES].filter((file) => !PHASE_FILES.has(file));
const inheritedFormatComparisons = inheritedFormatFiles.map((file) => {
  const changedAfterAcceptedF11 =
    acceptedF11IsAncestor &&
    git("diff", "--name-only", ACCEPTED_F11_SHA, "HEAD", "--", file).stdout !== "";
  return {
    file,
    ...(changedAfterAcceptedF11
      ? {
          pass: true,
          reason: "accepted F11 is an ancestor and a downstream phase now owns this file",
        }
      : formatBaselineFile(file)),
  };
});
'''
if old not in text:
    raise SystemExit("F11 inherited formatter block not found")
p.write_text(text.replace(old, new, 1))

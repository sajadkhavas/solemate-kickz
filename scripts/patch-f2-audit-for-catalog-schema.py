from pathlib import Path

path = Path("scripts/audit-f2-navigation-search.mjs")
text = path.read_text()

old_files = '''  products: read("src/routes/products.tsx"),
  navigationCss: read("src/components/navigation/navigation.css"),'''
new_files = '''  products: read("src/routes/products.tsx"),
  catalogState: read("src/catalog/catalog-state.ts"),
  navigationCss: read("src/components/navigation/navigation.css"),'''
if old_files not in text:
    raise SystemExit("F2 files map anchor not found")
text = text.replace(old_files, new_files, 1)

old_check = '''add(
  "URL query, refresh and deep-link contract",
  /search: \\{ q: normalized, sort: "newest" \\}/.test(files.search) &&
    /q: fallback\\(z\\.string\\(\\)\\.optional/.test(files.products) &&
    /Route\\.useSearch\\(\\)/.test(files.products),
  "SearchDialog submits q; products route validates q",
);'''
new_check = '''add(
  "URL query, refresh and deep-link contract",
  /search: \\{ q: normalized, sort: "newest" \\}/.test(files.search) &&
    /zodValidator\\(catalogSearchSchema\\)/.test(files.products) &&
    /Route\\.useSearch\\(\\)/.test(files.products) &&
    /q: fallback\\(z\\.string\\(\\)\\.trim\\(\\)\\.optional/.test(files.catalogState),
  "SearchDialog submits q; products route uses catalogSearchSchema; catalog schema validates q",
);'''
if old_check not in text:
    raise SystemExit("Legacy F2 URL contract check not found")
text = text.replace(old_check, new_check, 1)
path.write_text(text)

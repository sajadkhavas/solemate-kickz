from pathlib import Path

path = Path("src/routes/products.tsx")
text = path.read_text()
old = '''  const updateSearch = (patch: Partial<CatalogSearch>, options: { replace?: boolean } = {}) => {
    navigate({
      replace: options.replace,
      search: (previous) => ({ ...previous, ...patch }) as never,
    });
  };'''
new = '''  const updateSearch = (patch: Partial<CatalogSearch>, options: { replace?: boolean } = {}) => {
    navigate({
      to: "/products",
      replace: options.replace,
      search: { ...search, ...patch } as never,
    });
  };'''
if old not in text:
    raise SystemExit("Legacy search navigation block not found")
path.write_text(text.replace(old, new, 1))

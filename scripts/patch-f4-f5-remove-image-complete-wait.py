from pathlib import Path

path = Path("scripts/visual-qa-f4-f5-catalog-product-card.mjs")
text = path.read_text()
old = '''  await waitForExpression(
    client,
    `[...document.querySelectorAll('[data-testid="product-card"] img')].every((image) => image.complete)`,
  );
'''
if old not in text:
    raise SystemExit("Blocked-image completion wait not found")
path.write_text(text.replace(old, "", 1))

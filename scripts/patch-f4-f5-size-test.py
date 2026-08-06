from pathlib import Path

path = Path("scripts/test-f4-f5-catalog-product-card.mjs")
text = path.read_text()
old = '    await clickText(client, \'[data-testid="catalog-filters"] button\', "42");'
new = '''    await evaluate(
      client,
      `([...document.querySelectorAll('[data-testid="catalog-filters"] button')]
        .find((button) => button.textContent?.trim() === '42'))?.click()`,
    );'''
if old not in text:
    raise SystemExit("Exact legacy size selector was not found")
path.write_text(text.replace(old, new, 1))

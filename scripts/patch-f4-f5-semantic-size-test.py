from pathlib import Path

path = Path("scripts/test-f4-f5-catalog-product-card.mjs")
text = path.read_text()
old_click = '''    await evaluate(
      client,
      `([...document.querySelectorAll('[data-testid="catalog-filters"] button')]
        .find((button) => button.textContent?.trim() === '42'))?.click()`,
    );'''
new_click = '''    await click(client, '[data-testid="catalog-size-filter"][data-size="42"]');'''
old_deep = '''        sizePressed: [...document.querySelectorAll('[data-testid="catalog-filters"] button')].some((button) => button.textContent?.trim() === '42' && button.getAttribute('aria-pressed') === 'true'),'''
new_deep = '''        sizePressed: document.querySelector('[data-testid="catalog-size-filter"][data-size="42"]')?.getAttribute('aria-pressed') === 'true','''
if old_click not in text:
    raise SystemExit("Legacy size click not found")
if old_deep not in text:
    raise SystemExit("Legacy deep-link size check not found")
path.write_text(text.replace(old_click, new_click, 1).replace(old_deep, new_deep, 1))

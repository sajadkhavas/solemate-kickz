from pathlib import Path

path = Path("scripts/test-f4-f5-catalog-product-card.mjs")
text = path.read_text()
old = '''    await click(client, '[data-testid="catalog-size-filter"][data-size="42"]');
    await waitForExpression(client, `new URLSearchParams(location.search).get('sizes') === '42'`);'''
new = '''    const sizeFocused = await evaluate(
      client,
      `(() => {
        const target = [...document.querySelectorAll('[data-testid="catalog-size-filter"][data-size="42"]')]
          .find((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
              style.visibility !== 'hidden';
          });
        target?.focus();
        return document.activeElement === target;
      })()`,
    );
    if (!sizeFocused) throw new Error("Visible size 42 control could not receive focus");
    await press(client, " ", "Space");
    await waitForExpression(client, `new URLSearchParams(location.search).get('sizes') === '42'`);'''
if old not in text:
    raise SystemExit("Visible pointer size block not found")
path.write_text(text.replace(old, new, 1))

from pathlib import Path


def replace(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"target not found in {path}")
    p.write_text(text.replace(old, new, 1))


replace(
    "scripts/test-f7-cart-checkout.mjs",
    '''      target.scrollIntoView({ block: 'center', inline: 'center' });
      target?.click();
      return Boolean(target);
    })()`,
  );
  if (!selected) throw new Error(`Product size option ${index} was not selectable`);
''',
    '''      target.scrollIntoView({ block: 'center', inline: 'center' });
      target.focus({ preventScroll: true });
      target.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      }));
      return true;
    })()`,
  );
  if (!selected) throw new Error(`Product size option ${index} was not selectable`);
''',
)

replace(
    "scripts/visual-qa-f2-navigation-search.mjs",
    '''      await navigate(client, `${BASE_URL}/`);
      await evaluate(client, `window.scrollTo(0, 900); true`);
      await waitForExpression(
''',
    '''      await navigate(client, `${BASE_URL}/`);
      await waitForExpression(
        client,
        `document.querySelector('[data-testid="global-header"]')?.dataset.hydrated === 'true'`,
      );
      await evaluate(
        client,
        `window.scrollTo(0, 900); window.dispatchEvent(new Event('scroll')); true`,
      );
      await waitForExpression(
''',
)

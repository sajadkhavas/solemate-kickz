from pathlib import Path

path = Path("scripts/test-f2-navigation-search.mjs")
text = path.read_text()

desktop = '''    await waitForExpression(client, `!document.querySelector('[data-testid="search-dialog"]')`);
    await waitForExpression(client, `!${bodyLockedExpression}`);
    const desktopSearchClosed = await evaluate('''
desktop_replacement = '''    await waitForExpression(client, `!document.querySelector('[data-testid="search-dialog"]')`);
    await waitForExpression(client, `!${bodyLockedExpression}`);
    await waitForExpression(
      client,
      `document.activeElement?.dataset.testid === "search-trigger"`,
    );
    const desktopSearchClosed = await evaluate('''
if desktop not in text:
    raise SystemExit("Desktop search focus anchor not found")
text = text.replace(desktop, desktop_replacement, 1)

mobile = '''    await waitForExpression(client, `!document.querySelector('[data-testid="search-dialog"]')`);
    await waitForExpression(client, `!${bodyLockedExpression}`);
    const mobileSearchClosed = await evaluate('''
mobile_replacement = '''    await waitForExpression(client, `!document.querySelector('[data-testid="search-dialog"]')`);
    await waitForExpression(client, `!${bodyLockedExpression}`);
    await waitForExpression(
      client,
      `document.activeElement?.dataset.testid === "mobile-search-trigger"`,
    );
    const mobileSearchClosed = await evaluate('''
if mobile not in text:
    raise SystemExit("Mobile search focus anchor not found")
text = text.replace(mobile, mobile_replacement, 1)

path.write_text(text)

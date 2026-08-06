from pathlib import Path

path = Path("src/components/ShoeCard.tsx")
text = path.read_text()
replacements = {
    'className="mt-1 block rounded-sm"': 'className="mt-1 flex min-h-11 w-full items-center rounded-sm"',
    'className="mt-2 block rounded-sm"': 'className="mt-2 flex min-h-11 flex-col justify-center rounded-sm"',
}
for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f"Expected Product Card link class not found: {old}")
    text = text.replace(old, new, 1)
path.write_text(text)

path = Path("scripts/audit-f4-f5-catalog-product-card.mjs")
text = path.read_text()
anchor = '''check(
  "image failure states are present",
  card.includes("تصویر در دسترس نیست") && quickView.includes("پیش‌نمایش تصویر در دسترس نیست"),
);'''
addition = '''check(
  "Product Card detail links meet the 44px target contract",
  card.includes("mt-1 flex min-h-11 w-full items-center rounded-sm") &&
    card.includes("mt-2 flex min-h-11 flex-col justify-center rounded-sm"),
);
'''
if anchor not in text:
    raise SystemExit("Formatted audit insertion anchor not found")
path.write_text(text.replace(anchor, addition + anchor, 1))

from pathlib import Path

# ShoeCard: pass the actual opener element to the parent.
path = Path("src/components/ShoeCard.tsx")
text = path.read_text()
text = text.replace(
    'import { useEffect, useRef, useState, type RefObject } from "react";',
    'import { useEffect, useRef, useState, type MouseEvent, type RefObject } from "react";',
)
text = text.replace(
    '  onQuickView?: (shoe: Shoe) => void;',
    '  onQuickView?: (shoe: Shoe, opener: HTMLElement) => void;',
)
text = text.replace(
    '  const openQuickView = () => onQuickView?.(shoe);',
    '  const openQuickView = (event: MouseEvent<HTMLButtonElement>) =>\n    onQuickView?.(shoe, event.currentTarget);',
)
path.write_text(text)

# Products route: retain the opener and pass it into the controlled dialog.
path = Path("src/routes/products.tsx")
text = path.read_text()
text = text.replace(
    '  const [quickViewShoe, setQuickViewShoe] = useState<Shoe | null>(null);\n  const [localQuery, setLocalQuery] = useState(search.q ?? "");',
    '  const [quickViewShoe, setQuickViewShoe] = useState<Shoe | null>(null);\n  const [quickViewOpener, setQuickViewOpener] = useState<HTMLElement | null>(null);\n  const [localQuery, setLocalQuery] = useState(search.q ?? "");',
)
anchor = '''  const setSizeFilters = (sizes: number[]) => {
    updateSearch({ sizes: serialiseSizes(sizes) });
  };

  const categoryLabel'''
replacement = '''  const setSizeFilters = (sizes: number[]) => {
    updateSearch({ sizes: serialiseSizes(sizes) });
  };

  const openQuickView = (shoe: Shoe, opener: HTMLElement) => {
    setQuickViewOpener(opener);
    setQuickViewShoe(shoe);
  };

  const categoryLabel'''
if anchor not in text:
    raise SystemExit("Products size-filter anchor not found")
text = text.replace(anchor, replacement, 1)
text = text.replace('                    onQuickView={setQuickViewShoe}', '                    onQuickView={openQuickView}')
text = text.replace(
    '''      <QuickViewDialog
        shoe={quickViewShoe}
        open={quickViewShoe !== null}''',
    '''      <QuickViewDialog
        shoe={quickViewShoe}
        opener={quickViewOpener}
        open={quickViewShoe !== null}''',
)
path.write_text(text)

# Quick View: explicitly restore focus for the controlled-dialog pattern.
path = Path("src/components/catalog/QuickViewDialog.tsx")
text = path.read_text()
text = text.replace(
    'import { useEffect, useState } from "react";',
    'import { useEffect, useRef, useState } from "react";',
)
text = text.replace(
    '''interface QuickViewDialogProps {
  shoe: Shoe | null;
  open: boolean;''',
    '''interface QuickViewDialogProps {
  shoe: Shoe | null;
  opener?: HTMLElement | null;
  open: boolean;''',
)
text = text.replace(
    'export function QuickViewDialog({ shoe, open, onOpenChange }: QuickViewDialogProps) {',
    '''export function QuickViewDialog({
  shoe,
  opener,
  open,
  onOpenChange,
}: QuickViewDialogProps) {''',
)
text = text.replace(
    '  const [selectedSize, setSelectedSize] = useState<number | null>(null);',
    '  const openerRef = useRef<HTMLElement | null>(null);\n  const [selectedSize, setSelectedSize] = useState<number | null>(null);',
)
old_effect = '''  useEffect(() => {
    if (!open) return;
    setSelectedSize(null);
    setImageFailed(false);
  }, [open, shoe?.id]);'''
new_effect = '''  useEffect(() => {
    if (!open) return;
    if (opener) openerRef.current = opener;
    setSelectedSize(null);
    setImageFailed(false);
  }, [open, opener, shoe?.id]);'''
if old_effect not in text:
    raise SystemExit("Quick View open effect not found")
text = text.replace(old_effect, new_effect, 1)
text = text.replace(
    '''          data-testid="quick-view-dialog"
          dir="rtl"''',
    '''          data-testid="quick-view-dialog"
          dir="rtl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            openerRef.current?.focus({ preventScroll: true });
          }}''',
)
path.write_text(text)

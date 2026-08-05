import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useNavigate } from "@tanstack/react-router";
import { Clock3, Search, Trash2, X } from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import {
  getDatasetSuggestions,
  normalizeSearchText,
  searchShoes,
} from "@/components/navigation/search-utils";
import { IconButton, Price, SearchInput } from "@/components/ui/commerce-primitives";
import { useStore } from "@/store";
import type { Shoe } from "@/data/shoes";

function Highlight({ text, query }: { text: string; query: string }) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return <>{text}</>;

  const normalizedText = normalizeSearchText(text);
  const index = normalizedText.indexOf(normalizedQuery);
  if (index < 0) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-primary/20 px-0.5 text-foreground">
        {text.slice(index, index + normalizedQuery.length)}
      </mark>
      {text.slice(index + normalizedQuery.length)}
    </>
  );
}

function SearchSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 font-fa text-xs font-bold text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function SearchDialog() {
  const open = useStore((state) => state.isSearchOpen);
  const setOpen = useStore((state) => state.setSearchOpen);
  const searchHistory = useStore((state) => state.searchHistory);
  const addSearch = useStore((state) => state.addSearch);
  const removeSearch = useStore((state) => state.removeSearch);
  const clearSearchHistory = useStore((state) => state.clearSearchHistory);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const deferredQuery = useDeferredValue(query);
  const suggestions = useMemo(() => getDatasetSuggestions(), []);
  const results = useMemo(() => searchShoes(deferredQuery), [deferredQuery]);
  const normalizedQuery = normalizeSearchText(query);
  const searching =
    normalizedQuery.length > 0 && normalizedQuery !== normalizeSearchText(deferredQuery);

  useEffect(() => {
    if (!open) {
      setActiveIndex(-1);
      setQuery("");
    }
  }, [open]);

  const close = () => setOpen(false);

  const rememberAndNavigateToProducts = (term: string) => {
    const normalized = term.trim();
    if (!normalized) return;
    addSearch(normalized);
    close();
    navigate({ to: "/products", search: { q: normalized, sort: "newest" } as never });
  };

  const chooseResult = (shoe: Shoe) => {
    addSearch(query.trim() || `${shoe.brand} ${shoe.name}`);
    close();
    navigate({ to: "/product/$id", params: { id: String(shoe.id) } });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeIndex >= 0 && results[activeIndex]) {
      chooseResult(results[activeIndex]);
      return;
    }
    rememberAndNavigateToProducts(query);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        chooseResult(results[activeIndex]);
      } else {
        rememberAndNavigateToProducts(event.currentTarget.value);
      }
      return;
    }
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-testid="search-overlay"
          className="fixed inset-0 z-[var(--z-overlay)] bg-overlay backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 motion-reduce:animate-none"
        />
        <DialogPrimitive.Content
          data-testid="search-dialog"
          dir="rtl"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            openerRef.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
            inputRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            openerRef.current?.focus({ preventScroll: true });
          }}
          className="fixed inset-x-0 top-0 z-[var(--z-modal)] mx-auto flex max-h-[min(90dvh,48rem)] w-full max-w-3xl flex-col border-b border-border-strong bg-surface-elevated shadow-[var(--shadow-overlay)] outline-none sm:top-8 sm:rounded-2xl sm:border"
        >
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:p-5">
            <div>
              <DialogPrimitive.Title className="font-fa text-lg font-bold">
                جستجو در داده‌های محصولات
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 font-fa text-xs leading-5 text-muted-foreground">
                نتایج فقط از Dataset داخلی فعلی پروژه ساخته می‌شوند.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <IconButton label="بستن جستجو" variant="ghost" data-testid="search-close">
                <X aria-hidden="true" className="size-5" />
              </IconButton>
            </DialogPrimitive.Close>
          </div>

          <form role="search" onSubmit={submit} className="border-b border-border p-4 sm:p-5">
            <label htmlFor="sole-global-search" className="sr-only">
              نام برند، مدل، رنگ یا شناسه محصول
            </label>
            <SearchInput
              ref={inputRef}
              id="sole-global-search"
              data-testid="search-input"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={handleInputKeyDown}
              onClear={() => {
                setQuery("");
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
              placeholder="مثلاً Nike، Air Max یا Silver Bullet"
              autoComplete="off"
              aria-controls={results.length ? "sole-search-results" : undefined}
              aria-activedescendant={
                activeIndex >= 0 ? `sole-search-result-${results[activeIndex]?.id}` : undefined
              }
              className="h-12 bg-background font-fa"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="font-fa text-xs text-muted-foreground">
                Enter: جستجوی فروشگاه · جهت بالا/پایین: انتخاب پیشنهاد · Escape: بستن
              </p>
              <button
                type="submit"
                disabled={!normalizedQuery}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 font-fa text-sm font-bold text-primary-foreground transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search aria-hidden="true" className="size-4" />
                جستجو
              </button>
            </div>
          </form>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-5">
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {searching
                ? "در حال جستجو"
                : normalizedQuery.length >= 2
                  ? `${results.length} نتیجه پیدا شد`
                  : "برای جستجو حداقل دو نویسه وارد کنید"}
            </p>

            {searching ? (
              <div
                data-testid="search-loading"
                role="status"
                className="py-12 text-center font-fa text-sm text-muted-foreground"
              >
                در حال بررسی Dataset داخلی…
              </div>
            ) : normalizedQuery.length >= 2 ? (
              results.length ? (
                <div
                  id="sole-search-results"
                  role="listbox"
                  aria-label="پیشنهادهای جستجو"
                  className="space-y-2"
                >
                  {results.map((shoe, index) => (
                    <button
                      key={shoe.id}
                      type="button"
                      id={`sole-search-result-${shoe.id}`}
                      role="option"
                      aria-selected={activeIndex === index}
                      data-testid="search-result"
                      onMouseMove={() => setActiveIndex(index)}
                      onClick={() => chooseResult(shoe)}
                      className={`flex min-h-16 w-full items-center gap-3 rounded-xl border p-2 text-right outline-none transition-colors ${
                        activeIndex === index
                          ? "border-primary bg-interactive"
                          : "border-border bg-background hover:border-border-strong hover:bg-interactive"
                      }`}
                    >
                      <img
                        src={shoe.image}
                        alt={`${shoe.brand} ${shoe.name}`}
                        width={56}
                        height={56}
                        className="size-14 shrink-0 rounded-lg bg-surface object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <bdi
                          dir="ltr"
                          className="block truncate font-display text-xs text-muted-foreground"
                        >
                          <Highlight text={shoe.brand} query={query} />
                        </bdi>
                        <bdi
                          dir="ltr"
                          className="block truncate font-display text-sm font-bold text-foreground"
                        >
                          <Highlight text={shoe.name} query={query} />
                        </bdi>
                        <bdi dir="ltr" className="block truncate text-xs text-muted-foreground">
                          <Highlight text={shoe.colorway} query={query} />
                        </bdi>
                      </span>
                      <Price value={shoe.sale_price ?? shoe.price} className="shrink-0 text-sm" />
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  data-testid="search-no-results"
                  className="rounded-xl border border-dashed border-border p-8 text-center"
                >
                  <p className="font-fa text-base font-bold text-foreground">
                    نتیجه‌ای در Dataset پیدا نشد
                  </p>
                  <p className="mt-2 font-fa text-sm text-muted-foreground">
                    عبارت دیگری امتحان کنید یا همین عبارت را در صفحه فروشگاه باز کنید.
                  </p>
                  <button
                    type="button"
                    onClick={() => rememberAndNavigateToProducts(query)}
                    className="mt-4 inline-flex min-h-11 items-center rounded-md border border-border-strong px-4 font-fa text-sm font-semibold hover:bg-interactive"
                  >
                    بازکردن جستجوی فروشگاه
                  </button>
                </div>
              )
            ) : (
              <div data-testid="search-empty-state" className="space-y-6">
                {searchHistory.length ? (
                  <SearchSection title="جستجوهای اخیر">
                    <div className="space-y-2">
                      {searchHistory.map((term) => (
                        <div
                          key={term}
                          className="flex items-center gap-2 rounded-lg border border-border bg-background p-1"
                        >
                          <button
                            type="button"
                            data-testid="recent-search"
                            onClick={() => {
                              setQuery(term);
                              inputRef.current?.focus();
                            }}
                            className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md px-3 text-right font-fa text-sm hover:bg-interactive"
                          >
                            <Clock3
                              aria-hidden="true"
                              className="size-4 shrink-0 text-muted-foreground"
                            />
                            <bdi dir="auto" className="truncate">
                              {term}
                            </bdi>
                          </button>
                          <IconButton
                            label={`حذف جستجوی ${term}`}
                            size="sm"
                            variant="ghost"
                            data-testid="remove-recent-search"
                            onClick={() => removeSearch(term)}
                          >
                            <Trash2 aria-hidden="true" className="size-4" />
                          </IconButton>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={clearSearchHistory}
                      className="mt-3 inline-flex min-h-11 items-center rounded-md px-2 font-fa text-xs font-semibold text-muted-foreground hover:text-danger"
                    >
                      پاک‌کردن همه جستجوهای اخیر
                    </button>
                  </SearchSection>
                ) : null}

                <SearchSection title="پیشنهادهای واقعی از Dataset">
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setQuery(term);
                          inputRef.current?.focus();
                        }}
                        className="inline-flex min-h-11 items-center rounded-full border border-border bg-background px-4 font-display text-xs font-semibold transition-colors hover:border-border-strong hover:bg-interactive"
                      >
                        <bdi dir="ltr">{term}</bdi>
                      </button>
                    ))}
                  </div>
                </SearchSection>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

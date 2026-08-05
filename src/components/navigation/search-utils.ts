import { SHOES, type Shoe } from "@/data/shoes";

const PERSIAN_CHARACTER_MAP: Record<string, string> = {
  ي: "ی",
  ى: "ی",
  ك: "ک",
  ة: "ه",
};

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[يىكة]/g, (character) => PERSIAN_CHARACTER_MAP[character] ?? character)
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("fa");
}

export function getShoeSearchText(shoe: Shoe) {
  return normalizeSearchText(
    [shoe.brand, shoe.name, shoe.colorway, shoe.category, shoe.sku, ...shoe.tags].join(" "),
  );
}

export function searchShoes(query: string, limit = 8) {
  const normalized = normalizeSearchText(query);
  if (normalized.length < 2) return [];

  const terms = normalized.split(" ").filter(Boolean);
  return SHOES.filter((shoe) => {
    const searchable = getShoeSearchText(shoe);
    return terms.every((term) => searchable.includes(term));
  }).slice(0, limit);
}

export function getDatasetSuggestions(limit = 5) {
  return SHOES.slice(0, limit).map((shoe) => `${shoe.brand} ${shoe.name}`);
}

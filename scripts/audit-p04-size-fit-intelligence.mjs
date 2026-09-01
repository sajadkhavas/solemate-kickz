import { readFile } from "node:fs/promises";

const failures = [];
async function source(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    failures.push(`missing ${path}`);
    return "";
  }
}

const [dialog, purchase, catalog, shoes, registry] = await Promise.all([
  source("src/components/product/SizeGuideDialog.tsx"),
  source("src/components/product/ProductPurchasePanel.tsx"),
  source("src/catalog/production-catalog.server.ts"),
  source("src/data/shoes.ts"),
  source("contracts/production-phase-registry.json"),
]);

for (const marker of [
  "aria-live",
  "confidence",
  "تضمین نیست",
  "در Analytics",
  "ذخیره نمی‌شود",
  "180",
  "340",
]) {
  if (!dialog.includes(marker)) failures.push(`size guidance missing ${marker}`);
}
for (const marker of ["sizeGuide={shoe.sizeGuide}", "سایز به‌صورت خودکار انتخاب نمی‌شود"]) {
  if (!purchase.includes(marker)) failures.push(`PDP fit contract missing ${marker}`);
}
for (const marker of ["size_guide", "foot_length_min_mm", "verified_at", "width_profile"]) {
  if (!catalog.includes(marker)) failures.push(`production catalog fit schema missing ${marker}`);
}
if (!shoes.includes("sizeGuide?:"))
  failures.push("Shoe domain lacks optional authoritative size guide");
if (/localStorage|sessionStorage|fetch\(/.test(dialog))
  failures.push("raw foot measurement must stay ephemeral in the dialog");

const parsed = JSON.parse(registry);
const p04 = parsed.phases.find((phase) => phase.id === "P04");
if (!p04 || !["registered", "in_progress", "completed"].includes(p04.status))
  failures.push("P04 registry entry is invalid");

if (failures.length) {
  console.error("P04 size/fit audit failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("P04 size/fit audit passed.");

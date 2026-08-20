import { readFile } from "node:fs/promises";
import path from "node:path";

function fail(message) {
  console.error(`[environment] ${message}`);
  process.exit(1);
}

function parseEnv(source) {
  const values = {};
  for (const [index, raw] of source.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match) fail(`invalid line ${index + 1}`);
    if (Object.hasOwn(values, match[1])) fail(`duplicate key ${match[1]}`);
    values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return values;
}

const [environment, envPath] = process.argv.slice(2);
if (!environment || !envPath) {
  fail("usage: validate-environment.mjs <development|preview|production> <env-file>");
}
if (!/^(development|preview|production)$/.test(environment)) fail("unknown environment");

const root = process.cwd();
const schemaPath = path.join(root, "config/environments", `${environment}.env.schema.json`);
const [schemaRaw, envRaw] = await Promise.all([
  readFile(schemaPath, "utf8"),
  readFile(envPath, "utf8"),
]);
const schema = JSON.parse(schemaRaw);
const values = parseEnv(envRaw);
const failures = [];

for (const key of schema.required) {
  if (!values[key]) failures.push(`missing ${key}`);
}
for (const key of Object.keys(values)) {
  if (!schema.allowed.includes(key)) failures.push(`unknown key ${key}`);
}
for (const [key, expected] of Object.entries(schema.constraints)) {
  if (values[key] !== expected) failures.push(`${key} must equal ${expected}`);
}
if (schema.forbiddenKeyPattern) {
  const forbiddenKey = new RegExp(schema.forbiddenKeyPattern.replace(/^\(\?i\)/, ""), "i");
  for (const key of Object.keys(values))
    if (forbiddenKey.test(key)) failures.push(`forbidden key ${key}`);
}
if (schema.forbiddenValuePattern) {
  const forbiddenValue = new RegExp(schema.forbiddenValuePattern.replace(/^\(\?i\)/, ""), "i");
  for (const [key, value] of Object.entries(values)) {
    if (forbiddenValue.test(value)) failures.push(`forbidden value in ${key}`);
  }
}
if (values.SOLE_RELEASE_SHA && !/^[0-9a-f]{40}$/.test(values.SOLE_RELEASE_SHA)) {
  failures.push("SOLE_RELEASE_SHA must be a full 40-character Git SHA");
}
for (const key of ["SOLE_SITE_URL", "SOLE_API_URL"].filter((key) => values[key])) {
  try {
    const url = new URL(values[key]);
    if (environment === "production" && url.protocol !== "https:")
      failures.push(`${key} must use HTTPS`);
  } catch {
    failures.push(`${key} must be a valid absolute URL`);
  }
}

if (failures.length) fail(failures.join("; "));
console.log(`[environment] ${environment} contract passed (${Object.keys(values).length} keys).`);

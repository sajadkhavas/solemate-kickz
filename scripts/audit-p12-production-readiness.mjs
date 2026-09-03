import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const read = (file) => {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) {
    failures.push(`missing ${file}`);
    return "";
  }
  return fs.readFileSync(absolute, "utf8");
};

const handoff = read("docs/handoffs/P12-WORKING-HANDOFF.md");
const rehearsalDoc = read("docs/production/P12-SERVER-REHEARSAL.md");
const nginx = read("deploy/nginx/sole-sites.conf.example");
const limits = read("deploy/nginx/sole-http-limits.conf.example");
const service = read("deploy/systemd/sole-frontend.service.example");
const evidence = read("scripts/deployment/server-readiness-evidence.sh");
const rehearsal = read("scripts/deployment/server-readiness-rehearsal.sh");
const prepare = read("scripts/deployment/prepare-immutable-release.sh");
const budgets = read("scripts/qa-f12-build-budgets.mjs");
const verifier = read("scripts/verify-cumulative-quality.mjs");

for (const marker of ["P12.1", "P12.2", "P12.3", "P12.4", "P12.5", "P12.6", "P12.7", "P12.8", "P12.9"]) {
  if (!handoff.includes(marker)) failures.push(`handoff missing ${marker}`);
}
for (const marker of ["INACTIVE_ONLY", "sole_restore_*", "PUBLIC_ACTIVATION", "P14"]) {
  if (!rehearsalDoc.includes(marker)) failures.push(`rehearsal contract missing ${marker}`);
}
for (const marker of [
  "proxy_pass http://127.0.0.1:4173",
  "root /var/www/sole-backend/current/public",
  "location = /index.php",
  "fastcgi_pass unix:/run/php/php8.3-fpm.sock",
  "location ~ \\.php$",
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "client_max_body_size 12m",
]) {
  if (!nginx.includes(marker)) failures.push(`nginx contract missing ${marker}`);
}
if (!limits.includes("limit_req_zone $binary_remote_addr")) failures.push("nginx request-limit zone missing");
for (const marker of ["KillMode=control-group", "NoNewPrivileges=true", "ProtectSystem=full", "MemoryMax=384M", "LimitNOFILE=65535"]) {
  if (!service.includes(marker)) failures.push(`frontend systemd contract missing ${marker}`);
}
for (const marker of ["EXPECTED_FRONTEND_SHA", "EXPECTED_BACKEND_SHA", "systemd-analyze security", "nginx -t", "sole:production:check --json --connections", "FRONTEND_LOOPBACK_4173", "sha256sum"]) {
  if (!evidence.includes(marker)) failures.push(`server evidence runner missing ${marker}`);
}
for (const forbidden of ["printenv", "/proc/1/environ", "cat $ENV", "cat \"$ENV", "ps eww"]) {
  if (evidence.includes(forbidden)) failures.push(`server evidence runner contains unsafe environment disclosure: ${forbidden}`);
}
for (const marker of ["SOLE_P12_REHEARSAL", "INACTIVE_ONLY", "mysql-restore-drill.sh", "mktemp -d /var/tmp/sole-p12-symlink", "PUBLIC_ACTIVATION=NO"]) {
  if (!rehearsal.includes(marker)) failures.push(`inactive rehearsal missing ${marker}`);
}
for (const forbidden of ["mv -Tf \"$NEXT\" \"$ROOT/current\"", "systemctl restart", "systemctl reload"]) {
  if (prepare.includes(forbidden)) failures.push(`inactive frontend preparation must not activate services: ${forbidden}`);
}
for (const marker of ["610_000", "190_000", "650_000", "125_000", "22_000"]) {
  if (!budgets.includes(marker)) failures.push(`F12 budget changed or missing ${marker}`);
}
if (!verifier.includes("p12-production-readiness")) failures.push("cumulative verifier must require P12 evidence");

const result = {
  schemaVersion: 1,
  suite: "p12-production-readiness-audit",
  pass: failures.length === 0,
  failed: failures.length,
  failures,
};
fs.mkdirSync(path.join(root, "artifacts/audits"), { recursive: true });
fs.writeFileSync(path.join(root, "artifacts/audits/p12-production-readiness-audit.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
if (failures.length) process.exit(1);

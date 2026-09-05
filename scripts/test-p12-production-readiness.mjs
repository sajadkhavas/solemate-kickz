import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");
const check = (name, pass) => checks.push({ name, pass: Boolean(pass) });

const evidence = source("scripts/deployment/server-readiness-evidence.sh");
const rehearsal = source("scripts/deployment/server-readiness-rehearsal.sh");
const ownership = source("scripts/deployment/bootstrap-p12-ownership.sh");
const runbooks = source("docs/production/P12-INCIDENT-RUNBOOKS.md");
const nginx = source("deploy/nginx/sole-sites.conf.example");
const service = source("deploy/systemd/sole-frontend.service.example");
const handoff = source("docs/handoffs/P12-WORKING-HANDOFF.md");

check("read-only evidence requires exact frontend SHA", evidence.includes("EXPECTED_FRONTEND_SHA"));
check("read-only evidence requires exact backend SHA", evidence.includes("EXPECTED_BACKEND_SHA"));
check("frontend candidate can be exact-SHA verified", evidence.includes("SOLE_FRONTEND_CANDIDATE"));
check("frontend port must be loopback", evidence.includes("FRONTEND_LOOPBACK_4173"));
check("database public bind fails", evidence.includes("PORT_${port}_NOT_PUBLIC"));
check("nginx config is syntax tested", evidence.includes("nginx -t"));
check("systemd security is measured", evidence.includes("systemd-analyze security"));
check("backend runtime connections are checked", evidence.includes("--connections"));
check(
  "pinned frontend runtime versions are checked",
  evidence.includes("v22.23.1") && evidence.includes("1.3.14"),
);
check("P00 capacity minimum remains enforced", evidence.includes("MEMORY_P00_MINIMUM"));
check("evidence is checksummed", evidence.includes("sha256sum"));
check(
  "evidence checksum covers final readiness result",
  evidence.indexOf("value READINESS_RESULT") < evidence.indexOf('sha256sum "$REPORT"'),
);
check("rehearsal has explicit inactive guard", rehearsal.includes("INACTIVE_ONLY"));
check("rehearsal performs disposable restore", rehearsal.includes("mysql-restore-drill.sh"));
check("rehearsal never authorizes public activation", rehearsal.includes("PUBLIC_ACTIVATION=NO"));
check(
  "nginx only executes index.php",
  nginx.includes("location = /index.php") && nginx.includes("location ~ \\.php$"),
);
check("frontend systemd keeps process group kill", service.includes("KillMode=control-group"));
check(
  "ownership bootstrap rejects wildcard git trust",
  ownership.includes("GLOBAL_GIT_SAFE_DIRECTORY_WILDCARD_FORBIDDEN"),
);
check("incident runbooks include rollback decision", runbooks.includes("Rollback decision"));
check("handoff closes pre-server scope", handoff.includes("SERVER_REQUIRED: `false`"));
check(
  "real-host evidence is transferred without waiver",
  handoff.includes("transferred intact to P14") && handoff.includes("not a waiver"),
);

const failed = checks.filter((entry) => !entry.pass);
const report = {
  schemaVersion: 1,
  suite: "p12-production-readiness-contract",
  summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length },
  checks,
  pass: failed.length === 0,
};
fs.mkdirSync(path.join(root, "artifacts/reports"), { recursive: true });
fs.writeFileSync(
  path.join(root, "artifacts/reports/p12-production-readiness-contract.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report));
if (failed.length) process.exit(1);

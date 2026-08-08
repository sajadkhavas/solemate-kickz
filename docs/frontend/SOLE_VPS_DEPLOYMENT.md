# SOLE — VPS / Node Deployment Contract

This document turns the 2026-08-08 real VPS preview into a permanent deployment contract.

## What the VPS test exposed

The test server had about 1 GiB RAM and was already running critical VPN services. The following facts were observed:

- the project declares Node `22.23.1`, while the server initially had Node 24;
- the standard Bun x64 binary crashed with `Illegal instruction` because the CPU exposed AVX but not AVX2;
- a Bun x64 baseline binary executed successfully on the same CPU;
- the Lovable wrapper defaults production Nitro builds toward Cloudflare, which is not the right output shape for a plain Node VPS;
- `vite dev` consumed about 300 MiB and the first SSR request took about 9 seconds while Vite optimized dependencies;
- binding the preview to `127.0.0.1:4173` kept it private and avoided opening another public port.

These were deployment-path problems, not application-feature failures.

## Permanent rules

1. Production VPS runtime is Node `22.23.1`.
2. Bun is a package manager/build bootstrap only; the production HTTP process runs Node.
3. Normal Lovable preview/build behavior remains unchanged.
4. A self-hosted build must use `bun run build:vps`. That command opts into Nitro `node-server` and verifies `.output/server/index.mjs`.
5. Do not run `vite dev` or `vite preview` as the production service.
6. Shared/critical servers must use the cgroup-limited install/build helpers.
7. Preview access should bind to `127.0.0.1` and use an SSH tunnel until a deliberate reverse-proxy configuration is approved.
8. Never change firewall, Nginx, Xray, x-ui, or unrelated services from SOLE deployment scripts.

TanStack Start documents Node deployment as a Nitro build followed by `node .output/server/index.mjs`. SOLE follows that shape.

## 1. Preflight

From the repository root:

```bash
bash scripts/deployment/vps-preflight.sh
```

The preflight is read-only. It checks Node, CPU capabilities, memory, disk, the preview port, and required utilities.

If Node is not exactly `22.23.1`, fix the Node runtime before continuing. `.nvmrc` and `.node-version` both pin that version.

## 2. Bootstrap a CPU-compatible Bun locally

Do not install or replace a global Bun runtime on a shared server.

```bash
bash scripts/deployment/bootstrap-bun-vps.sh
```

The script writes only `.runtime/bun`.

On x64:

- AVX2 CPU -> standard Bun x64;
- SSE4.2 without AVX2 -> x64 baseline Bun;
- older than SSE4.2 -> deployment stops.

The repository remains pinned to Bun `1.3.14`. If that baseline executable cannot run on an older VPS CPU, the bootstrap has the explicitly isolated compatibility fallback that was validated during the 2026-08-08 server test.

## 3. Install from the lockfile with resource limits

On a shared or memory-constrained host:

```bash
bash scripts/deployment/install-vps-safe.sh
```

It uses `systemd-run` when available and applies CPU, RAM, swap, task, and niceness limits. It does not restart or modify any system service.

## 4. Build the correct Node artifact

Preferred on a shared host:

```bash
bash scripts/deployment/build-vps-safe.sh
```

On a dedicated build machine:

```bash
bun run build:vps
```

`build:vps`:

- requires Node `22.23.1`;
- sets `SOLE_DEPLOY_TARGET=node-server`;
- builds with Vite/Nitro;
- fails unless `.output/server/index.mjs` and `.output/public` exist.

A normal `bun run build` is intentionally left available for the Lovable-connected workflow. It is not the VPS deployment command.

## 5. Production service

Use `deploy/systemd/sole-frontend.service.example` as a reviewed template. Do not blindly overwrite an existing unit.

The template:

- runs `node .output/server/index.mjs`;
- binds only to `127.0.0.1:4173`;
- has Node heap, CPU, memory, swap and task limits;
- enables systemd hardening;
- never starts a Vite development server.

Adjust `User`, `Group`, and `WorkingDirectory` to the dedicated deployment account/path before enabling it.

## 6. Smoke test before exposure

After the production Node service is running:

```bash
bun run smoke:vps
```

or:

```bash
node scripts/deployment/smoke-node-server.mjs
```

The smoke test checks the favicon and two SSR requests to the home page. A slow first request is reported, but HTTP failures stop the test.

## 7. Private preview through SSH

Keep the service bound to loopback. From the workstation:

```bash
ssh -N -L 4173:127.0.0.1:4173 user@server
```

Then open:

```text
http://127.0.0.1:4173
```

No public firewall rule is required for port 4173.

## 8. Shared server safety

For a server that already hosts critical workloads:

- do not build without cgroup limits;
- do not expose 4173 publicly just for preview;
- do not restart Nginx or unrelated services to test SOLE;
- verify critical services before and after any manual deployment change;
- stop and remove only the SOLE unit/files when cleaning up.

The safest production model is still a dedicated application host. These safeguards exist so an unavoidable shared-host preview does not become a deployment dependency.

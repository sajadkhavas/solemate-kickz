<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Mandatory SOLE continuation protocol

These instructions apply to every human contributor and AI coding chat.

1. Before planning or editing, read `PROJECT_STATUS.md` completely.
2. Read `contracts/production-phase-registry.json`, the production roadmap, the engineering constitution and the relevant phase handoff.
3. Verify live GitHub branch/SHA/PR/CI state. Never rely only on chat memory.
4. Do not work directly on `main`. Use one phase branch and PR per production phase.
5. Do not force-push, rebase, amend or rewrite published history.
6. Use official primary documentation for technical decisions and record links in the handoff.
7. Do not claim tests, CI, deploys or health checks passed without exact evidence.
8. At the close of every phase, update in the same PR:
   - `PROJECT_STATUS.md`
   - `contracts/production-phase-registry.json`
   - the phase handoff under `docs/handoffs/`
   - the roadmap if dependencies or scope changed
   - `README.md` if the headline state changed
9. Every phase handoff must record START_SHA, END_SHA, branch, PR, scope, exclusions, commands, QA/CI evidence, limitations, rollback impact, official references and next phase.
10. Production engineering rules in `PROJECT_STATUS.md` and `docs/production/PRODUCTION-ENGINEERING-CONSTITUTION.md` are mandatory across frontend, backend, QA and deployment.

Current next dependency-ready phase at the time of this instruction: **P01 — Backend, Admin and Product Truth**.

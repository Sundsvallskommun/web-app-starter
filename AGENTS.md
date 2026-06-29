# AGENTS.md — web-app-starter

Instructions for AI agents (and humans) working in this repository. Read this
before making changes.

## What this repo is

`web-app-starter` is the **base template** that other Sundsvall web apps are
forked from. It is a monorepo with three packages:

- **`backend/`** — TypeScript + Express 5 + routing-controllers API server (the proxy/BFF).
- **`frontend/`** — Next.js (App Router) citizen/handläggar frontend.
- **`admin/`** — Next.js (Pages Router) admin UI.

Because every project inherits from this one, **keep it modern, lean and green**.
New patterns added here propagate to every downstream app, so hold a high bar.

## Architecture: end-to-end typing via generated data contracts

Typing must be correct the whole way through. The flow is:

1. **Upstream APIs → backend data-contracts.** `backend/src/config/api-config.ts`
   lists the subscribed APIs. `yarn generate:contracts` in `backend/` downloads each
   API's OpenAPI doc and generates `backend/src/data-contracts/{name}/data-contracts.ts`
   (models only). **These files are generated — never edit them by hand.**
2. **Backend responses & DTOs (hand-written, one concern per file).** The backend
   builds its own request DTOs and response types consuming the generated contracts,
   and exposes its own OpenAPI/swagger.
3. **Backend API → frontend/admin interfaces.** `yarn generate:contracts` in
   `frontend/` and `admin/` downloads the backend's swagger and generates their
   `src/data-contracts/backend/` clients.

Result: upstream API → backend data-contract → backend response/DTO → frontend
interface. Correct types at every hop, no hand-maintained duplicates. When an
upstream API changes, regenerate — do not patch generated files.

## Conventions

- **Small, single-purpose files.** Split by concern. No monoliths.
- **Correct typing end-to-end.** Derive types from generated data-contracts; never
  hand-duplicate API shapes. **Avoid `any`** — reach for `unknown` + narrowing.
- **Reuse components and utilities** before writing new ones. Prefer composition.
- **Build UI from `@sk-web-gui/react`** components instead of hand-rolling markup.
- **Descriptive names** — no single-letter variables or functions.
- **Never hand-edit generated files** under `*/data-contracts/`.
- **When in doubt, ask** before introducing a new pattern, dependency, or scope.

## Quality gates & testing

This repo enforces strict, type-aware quality gates. Run them from the repo root
(`yarn verify` fans out to all three packages) or per package. Before pushing, code
must pass — and the pre-push hook runs the full gate so failures surface locally first.

- **Lint** (`yarn lint:strict`): ESLint flat config, `strictTypeChecked` +
  `stylisticTypeChecked`, **`any` is forbidden**, `simple-import-sort` +
  `unused-imports`, `no-console` (warn/error only), zero warnings. Generated
  `*/data-contracts/**` are excluded.
- **Format** (`yarn format:check`): Prettier; `endOfLine: lf` enforced repo-wide via
  `.gitattributes` + `.editorconfig`.
- **Type-check** (`yarn type-check`): `tsc --noEmit`, `strict` + `noUncheckedIndexedAccess`
  + `noImplicitOverride`/`noImplicitReturns`. Never reach for `any` to silence it.
- **Knip** (`yarn knip`): dead code — **blocks** on unused files, exports, types and
  dependencies. Default is to delete unused code. If something is unused *on purpose*
  (intended public API or not-yet-wired scaffolding), opt it out explicitly so it shows
  in the diff: `/** @public */` above the export, or an entry in the package `knip.json`
  (`ignore` / `ignoreDependencies` / `entry`). Don't disable Knip — opt out the symbol.
- **Tests** (`yarn test`): Vitest — backend (node, SWC for decorators), frontend & admin
  (jsdom + React Testing Library). E2E via Playwright (`yarn test:e2e`). **No Cypress, no Jest.**
- **Build** (`yarn build`): backend `tsc && tsc-alias`, plus Next builds for frontend
  and admin using deterministic test env values.
- **Hooks**: pre-commit (console.log + PII scan + lint-staged), commit-msg (Conventional
  Commits), pre-push (`yarn verify`: lint + format + type-check + knip + unit tests +
  build across all packages). Don't `--no-verify` to dodge them.

Fix the root cause; do not weaken a rule or add `any`/`eslint-disable` without a written
reason. New code should ship with a test.

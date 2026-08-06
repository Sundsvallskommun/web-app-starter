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

## Dependency upgrades — intentional pins & deferrals

Keep deps current, but a few majors are **deliberately held back**. Before "upgrading"
one of these, confirm the blocker below has actually cleared — don't rediscover it:

- **Tailwind CSS → stay on v3** (`tailwindcss ^3.4.x`, frontend + admin). `@sk-web-gui/core`
  ships a **v3 JS preset** (`preset()`, consumed in `tailwind.config.js`) — an API Tailwind 4
  removed. v4 installs but breaks sk-web-gui theming/utilities. Move only once the design
  system ships a v4-compatible release.
- **ESLint → stay on v9 in frontend + admin** (`eslint ^9`). `eslint-config-next 16` bundles
  `eslint-plugin-import` / `-react` / `-jsx-a11y` that still cap ESLint at `^9`. Backend has no
  `eslint-config-next` and runs **ESLint 10**. Re-align frontend/admin once Next bumps those plugins.
- **`typescript-eslint` → exact `8.61.0` in frontend + admin** (no caret). Must match the version
  `eslint-config-next 16` resolves so the `@typescript-eslint` plugin dedupes to a single instance
  (otherwise: *"Cannot redefine plugin @typescript-eslint"*). Backend floats (`^8.62.0`). See the
  note in each `eslint.config.mjs`.
- **`class-validator` → stay on `^0.14`** (backend). `routing-controllers@0.11.3` (peer `^0.14.1`)
  and `class-validator-jsonschema@5.1.0` (peer `^0.14.0`) exclude `0.15`. Bump all three together
  once those consumers ship `0.15`-compatible peers.
- **`@types/node` → stay on `^24`** (all packages). Types track the Node 24 runtime
  (`engines.node`, `.nvmrc`); leading them to 26 lets `tsc` green-light APIs absent at runtime.
- **`sharp` → resolve Next's copy to `0.35.x`** (frontend + admin). Next 16.2.12 still
  requests vulnerable `sharp ^0.34.5`, and that line has no patched release. The Yarn
  resolution deliberately crosses Next's declared range; CI exercises Next's own image
  optimizer against the resolved Sharp version. Remove the resolution once Next declares
  support for a non-vulnerable Sharp range, not merely to silence Yarn's warning.
- **TypeScript 6** (all packages) sits under the `<6.1.0` ceiling allowed by `typescript-eslint`.
  `baseUrl` is gone (path-map targets are `./`-relative); backend uses `moduleResolution: nodenext`
  with an explicit `rootDir: src`.

**Node:** install/build on **Node 24** (`.nvmrc`) — `lint-staged 17` requires `>=22.22.1`.
`vite` stays at the locked `8.0.x` (range `^8` already allows 8.1; a `yarn upgrade vite` trips a
yarn-1 nested-link bug via vitest's optional peer, so let it float on the next clean lockfile regen).

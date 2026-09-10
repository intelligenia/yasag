## Context

OAS3 support already isolates version differences in `src/adapters/*`. This change adds an *output*-side
seam: a `TargetProfile` derived from `--target` that drives emission, mirroring how the adapters drive
input normalization. The downstream template code reads profile booleans instead of the loose
`config.standalone`.

## Decisions

### TargetProfile as the single switch
`src/target-profile.ts` exports `NgTarget = 'ng22'|'ng16'|'legacy'`, `TargetProfile`, and `profileFor()`.
`generate()` builds `config.profile` once; `config.standalone` becomes a derived alias
(`= profile.standalone`) so the already-standalone-aware forms modules need no change. New reads:
`profile.inject`, `profile.signals`, `profile.httpResource`, `profile.providedInRoot`,
`profile.typedFormsDefault`.

| target | standalone | inject | providedInRoot | signals | httpResource | typedFormsDefault |
|--------|-----------|--------|----------------|---------|--------------|-------------------|
| ng22   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ng16   | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| legacy | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

`--typed-forms` / `--untyped-forms` override `typedFormsDefault` explicitly.

### Compile matrix, not one node_modules
Two `@angular/core` versions can't coexist in one `node_modules`. Each target compiles in its own consumer
project `tests/e2e-consumers/<target>/` with an isolated `npm install` (`npm run e2e:setup`, node_modules
gitignored). This is the real multi-version proof requested; cost is 3 installs (slow, CI/local only).
ng16 target compiles against Angular 18 (no `httpResource` symbol) — that absence is the guard proving the
profile omits it.

### resource reader shape
Signal-in, resource-out: `<op>Resource(params: Signal<XParams | undefined>)` built with `rxResource`,
**delegating to the existing Observable method** so no request/param logic is duplicated or lost (directly
serves the "don't lose functionality in the translation" requirement):
`rxResource({ params: () => params(), stream: ({ params }) => this.<op>(params) })`. GET only. Mutations
stay Observable. The profile flag is named `httpResource` but the emitted primitive is `rxResource`
(reuses the method); a raw `httpResource()` was rejected because it would re-implement URL/param/response
handling and risk drift.

## Non-goals
- No component emission → no control-flow/`input()`/`viewChild()` work.
- No change to Swagger-2 normalization or to `legacy` output shape (byte-identical, snapshot-fenced).
- Consumer migration (drop `ApiFormsModule`, add `provideHttpClient`) is separate.

## Risks / Trade-offs
- TS 4.9→5.9 may harden the tool's own typecheck → minor fixes (Phase 0).
- `httpResource` requires Angular ≥19.2; peerDeps note ng22 needs ≥19.
- Default→ng22 is breaking for regenerators expecting NgModules → `--target legacy` + snapshot.

## Migration
None for the tool's CLI beyond the renamed flag (`--standalone` removed in favor of `--target`; its old
behavior = `--target ng16`-ish/standalone). Consumers pick a target explicitly.

## Context

`yasag` is a code generator (Node/TS CLI). Its architecture already isolates version differences in
`src/adapters/*`: `detectVersion` picks the spec version and `normalizeSchema` converts everything to
the Swagger-2 shape the rest of the generator consumes. This means OAS3 support is a pure input-adapter
concern — the downstream generator (`requests/`, `forms/`, `definitions.ts`, `clean-arch/`) does not
need to change. That is the seam we build on.

## Decisions

### YAML parser: `yaml` (eemeli)
- Rung check: no YAML parser is installed; parsing YAML 1.2 correctly is not a few lines, so a dep is
  justified. `yaml` is zero-dependency, actively maintained, YAML 1.2 compliant (matters for OAS3.1),
  and returns plain JS objects. Alternative `js-yaml` is YAML 1.1 and heavier on quirks. Choose `yaml`.
- Integration point: `generate.ts` currently does `JSON.parse`, and on failure sniffs for YAML and
  aborts. Replace the abort with `YAML.parse(content)`. Keep JSON.parse first (fast path, and JSON is
  valid YAML anyway) so existing behavior is byte-identical for JSON inputs.

### Test strategy
- Runner is already `node --test` via `tsx` (`npm test`). Keep it — no new framework (YAGNI).
- Unit tests assert one Scenario each against the normalizer; the fixture is the single source of truth.
- The e2e test is the real guard: generate → `tsc --noEmit` on the output. A normalizer that produces
  plausible-but-wrong shapes is caught only by compiling the emitted client, not by shape assertions.

### Non-goals
- Do not touch the Swagger-2 normalization path or generated-client shape for existing inputs. The 40
  existing tests + a swagger.json smoke-check are the regression fence.
- Do not add multi-file/remote `$ref` resolution (external documents) — out of scope; only in-document
  `#/components/...` refs, which is what OpenAPI 3 generators emit.
- Do not upgrade Angular target of the generated client in this change.

## Risks / Trade-offs

- **Risk:** YAML anchors/aliases or 3.1 constructs the normalizer hasn't seen. **Mitigation:** the e2e
  compile gate + a representative fixture; expand fixture as real specs surface gaps.
- **Trade-off:** TSLint→ESLint migration (Phase 4) is optional polish; if it balloons, drop the dead
  lint script instead of forcing a migration (lazy exit is acceptable, tests are the real gate).

## Migration

None for consumers. yasag stays a build-time CLI; only its accepted input set widens (YAML, OAS3).

# openapi-client-generator Specification

## Purpose
El generador del cliente de API: acepta spec YAML o JSON, detecta la versión, normaliza OpenAPI 3 al formato interno, emite código compilable con DI moderna y ofrece perfiles por target de Angular, con signals y resource readers en el target ng22.

## Requirements
### Requirement: Accept YAML and JSON spec input

The generator SHALL accept an OpenAPI/Swagger specification supplied as YAML or JSON. YAML input
SHALL be parsed into the same object graph a JSON spec produces and then normalized through the
existing version-detection pipeline, so YAML and the equivalent JSON yield identical generated output.

#### Scenario: YAML OpenAPI 3 spec is parsed and normalized

- **WHEN** the generator reads a spec file whose contents are valid YAML declaring `openapi: 3.0.x`
- **THEN** it parses the YAML to an object and normalizes it to the internal Swagger-2 shape
- **AND** it does not abort asking the user to convert to JSON

#### Scenario: YAML and JSON of the same spec produce the same normalized result

- **WHEN** the same OpenAPI 3 spec is provided once as YAML and once as JSON
- **THEN** the normalized schema objects are deeply equal

#### Scenario: Invalid YAML/JSON reports a clear error

- **WHEN** the spec file is neither valid JSON nor valid YAML
- **THEN** the generator reports a parse error naming the file and exits without generating

### Requirement: Detect the OpenAPI/Swagger spec version

The generator SHALL detect Swagger 1.x, Swagger 2.0, OpenAPI 3.0.x and OpenAPI 3.1.x from explicit
version fields, and fall back to structural heuristics when the version field is missing.

#### Scenario: Explicit OpenAPI 3.1 version

- **WHEN** the spec has `openapi: "3.1.0"`
- **THEN** `detectVersion` returns `openapi31`

#### Scenario: Heuristic detection from components/servers

- **WHEN** the spec has no `openapi`/`swagger` field but contains `components.schemas` or `servers`
- **THEN** `detectVersion` returns an OpenAPI 3 version

### Requirement: Normalize OpenAPI 3 structures to the internal Swagger-2 format

The generator SHALL convert OpenAPI 3.0/3.1 constructs into the Swagger-2 shape the downstream
generator consumes, covering servers, component schemas and references, request bodies, parameters,
responses, composition keywords and nullability.

#### Scenario: components.schemas and $ref become definitions

- **WHEN** the spec defines `components.schemas.X` and references `#/components/schemas/X`
- **THEN** the result exposes `definitions.X` and every reference is rewritten to `#/definitions/X`

#### Scenario: requestBody JSON becomes a body parameter

- **WHEN** an operation has `requestBody.content["application/json"].schema`
- **THEN** the operation gains a parameter `{ in: "body", name: "body", schema }`

#### Scenario: multipart binary field becomes a file form parameter

- **WHEN** a `multipart/form-data` request body has a property of `type: string, format: binary`
- **THEN** that property becomes a `{ in: "formData", type: "file" }` parameter

#### Scenario: parameter schema is flattened

- **WHEN** a path/query parameter carries its type in a nested `schema` object
- **THEN** the type/format/enum/constraints are flattened onto the parameter for Swagger-2 compatibility

#### Scenario: response content schema is lifted

- **WHEN** a response has `content["application/json"].schema`
- **THEN** the normalized response exposes `schema` directly

#### Scenario: allOf is merged and nullability is preserved

- **WHEN** a schema uses `allOf` and marks a field nullable (`nullable: true` or `type: ["T","null"]`)
- **THEN** the properties are merged into one definition and `x-nullable: true` is set

#### Scenario: server URL variables are resolved into host/basePath/schemes

- **WHEN** `servers[0].url` contains `{variable}` placeholders with defaults
- **THEN** host, basePath and schemes are derived from the resolved URL

### Requirement: OpenAPI 3 generation produces compilable output

The generator SHALL emit TypeScript for an OpenAPI 3 spec that compiles under the target Angular project's
TypeScript config, for every supported `--target`, proving the OAS3 path works end-to-end.

#### Scenario: Generated client from an OAS3 fixture compiles

- **WHEN** the generator runs over the OpenAPI 3 test fixture with the default target into a temporary
  Angular-22 project
- **THEN** the emitted TypeScript type-checks with no errors

### Requirement: Select an Angular target profile

The generator SHALL accept a `--target <ng>` option (`ng22` | `ng16` | `legacy`, default `ng22`) that
selects an idiom preset. The target SHALL be resolved to a `TargetProfile` of booleans
(`standalone`, `inject`, `providedInRoot`, `signals`, `httpResource`, `typedFormsDefault`) that drives all
code emission.

#### Scenario: Default target is ng22

- **WHEN** no `--target` is passed
- **THEN** the profile is `ng22` with `standalone`, `inject`, `providedInRoot`, `signals`, `httpResource`
  and `typedFormsDefault` all true

#### Scenario: ng16 target disables signals and httpResource

- **WHEN** `--target ng16` is selected
- **THEN** `standalone`/`inject`/`providedInRoot`/`typedFormsDefault` are true and `signals`/`httpResource`
  are false

#### Scenario: legacy target keeps NgModule/constructor style

- **WHEN** `--target legacy` is selected
- **THEN** `standalone`/`inject`/`providedInRoot`/`signals`/`httpResource`/`typedFormsDefault` are all false

### Requirement: Modern DI in all emitted layers

The generator SHALL, for any target with `inject` enabled, emit every `@Injectable` class (controllers,
apiconfig, clean-arch repositories and usecases, per-operation form services) using `inject()` for
dependencies (no constructor injection) and decorated `@Injectable({ providedIn: 'root' })`.

#### Scenario: ng22/ng16 controller uses inject and providedIn:'root'

- **WHEN** a controller service is generated for `ng22` or `ng16`
- **THEN** it contains `inject(HttpClient)` and `@Injectable({ providedIn: 'root' })` and no `constructor(`

#### Scenario: clean-arch repositories and usecases use inject and providedIn:'root'

- **WHEN** clean-arch is generated for `ng22` or `ng16`
- **THEN** the repository impl and usecase classes use `inject()` and `@Injectable({ providedIn: 'root' })`

#### Scenario: legacy keeps constructor DI

- **WHEN** a controller service is generated for `legacy`
- **THEN** it uses `constructor(` injection and no `inject(`

### Requirement: Signals and resource readers on the ng22 target (additive)

For a target with `signals` enabled, the abstract form services SHALL expose `loading` and `serverErrors`
as signals (via `@angular/core/rxjs-interop` `toSignal`) **alongside** the existing `loading$`/`serverErrors$`
Observables (additive, nothing removed). For a target with `httpResource` enabled, each GET operation SHALL
additionally emit a signal-based resource reader (`<op>Resource`) implemented with `rxResource` that
**delegates to the existing Observable method**, so no request/param logic is duplicated or lost. The
original Observable methods SHALL remain. HTTP mutations (POST/PUT/PATCH/DELETE) SHALL remain `Observable`
in all targets, with no resource reader.

#### Scenario: ng22 emits state signals and a GET resource reader without removing the Observable method

- **WHEN** the client is generated for `ng22`
- **THEN** the abstract get service contains `toSignal(` and still declares `loading$`/`serverErrors$`
- **AND** each GET controller method has a companion `<op>Resource` reader using `rxResource(` that calls
  the original method, and the original `Observable`-returning method is still present

#### Scenario: POST operations get no resource reader

- **WHEN** the client is generated for `ng22`
- **THEN** a POST operation has no `<op>Resource` companion

#### Scenario: ng16 emits neither signals nor resource readers

- **WHEN** the client is generated for `ng16`
- **THEN** no emitted file contains `toSignal(` or `rxResource(`

### Requirement: Emitted output type-checks against its target Angular version

For each target, the generated client SHALL type-check (`tsc --noEmit`) against a project pinned to that
target's Angular version.

#### Scenario: ng22 output compiles against Angular 22

- **WHEN** the fixture is generated with `--target ng22` into an Angular-22 project
- **THEN** `tsc --noEmit` reports zero errors

#### Scenario: ng16 output compiles against Angular <19 (no httpResource available)

- **WHEN** the fixture is generated with `--target ng16` into an Angular-18 project
- **THEN** `tsc --noEmit` reports zero errors

#### Scenario: legacy output compiles with NgModules

- **WHEN** the fixture is generated with `--target legacy`
- **THEN** the emitted NgModules type-check with zero errors


# yasag — Generador de cliente API (OpenAPI 3 + multi-target Angular)

> Soporte OpenAPI 3 / YAML y sistema **multi-target**, que emite código Angular moderno (ng22)
> o de transición/legado.

---

## 1. Qué es

`yasag` (*Yet Another Swagger Angular Generator*) genera un cliente TypeScript para Angular a partir de
una especificación OpenAPI/Swagger: servicios HTTP, interfaces de modelo, form-services y, opcionalmente,
capas de clean architecture.

- **Naturaleza**: CLI Node (`dist/index.js`). No importa Angular en runtime; `peerDependencies` amplias
  (`@angular/* >= 16`). El código **emitido** es el que se consume en la app Angular.

## 2. Formatos de entrada

Detección automática de versión + normalización al formato interno Swagger-2 que consume el generador.
La lógica de entrada vive aislada en `src/adapters/`:

| Fichero | Rol |
|---|---|
| `adapters/parse-spec.ts` | `parseSpec()` — parsea **JSON o YAML** (JSON primero, YAML de fallback) |
| `adapters/openapi-detector.ts` | `detectVersion()` — Swagger 1.x / 2.0 / OpenAPI 3.0 / 3.1 (+ heurísticas) |
| `adapters/openapi3-normalizer.ts` | `normalizeOpenApi3()` — OAS3 → shape Swagger-2 (730 líneas) |
| `adapters/swagger2-normalizer.ts` / `swagger1-normalizer.ts` | passthrough / normalización |

Versiones soportadas: **Swagger 2.0, OpenAPI 3.0.x, OpenAPI 3.1.x**, en **JSON o YAML**.

Cobertura OAS3 del normalizer: `servers` (incl. variables de URL, relativas y protocol-relative),
`components.schemas`/`parameters`/`responses`/`requestBodies` con resolución de `$ref`, `requestBody`
(JSON, multipart/binary incl. array-of-file), `allOf` (merge), `oneOf`/`anyOf`, `discriminator`,
`nullable` (3.0) y `type: [T, "null"]` (3.1).

```bash
# Mismo comando para Swagger 2 u OpenAPI 3, JSON o YAML
node dist/index.js -s api.yaml   -d src/api
node dist/index.js -s swagger.json -d src/api
```

## 3. Targets de Angular (`--target`)

El núcleo del sistema multi-versión es un **`TargetProfile`** (`src/target-profile.ts`) derivado del flag
`--target`, que dirige toda la emisión. Por defecto **`ng22`**.

| Flag del profile | `ng22` (default) | `ng16` (transición) | `legacy` |
|---|:---:|:---:|:---:|
| `standalone` (sin NgModules) | ✓ | ✓ | ✗ |
| `inject` (DI vía `inject()`) | ✓ | ✓ | ✗ |
| `providedInRoot` | ✓ | ✓ | ✗ |
| `signals` (estado como signal) | ✓ | ✗ | ✗ |
| `httpResource` (lectores resource GET) | ✓ | ✗ | ✗ |
| `typedFormsDefault` | ✓ | ✓ | ✗ |
| Angular objetivo | ≥ 19 (probado 22) | 16–19 (probado 18) | ≤ 16 (probado 16) |

- **`ng22`** — código Angular 22+ idiomático: standalone, `inject()`, `providedIn:'root'`, signals de
  estado, lectores `httpResource`/`rxResource` para GET, typed forms.
- **`ng16`** — standalone + `inject()` + typed forms, **sin** signals ni resource readers (no existen <19).
- **`legacy`** — el estilo clásico: NgModules + constructor DI (compat consumidores antiguos).

> Angular 22 soporta todos los idioms de `ng22`; es el target por defecto.

## 4. Qué se emite y cómo cambia por target

### Servicios de controlador (`controllers/<Name>.ts`)

**ng22 / ng16** (`inject()` + `providedIn:'root'`, sin constructor):
```ts
@Injectable({ providedIn: 'root' })
export class PetsService {
  private http = inject(HttpClient);
  private apiConfigService = inject(APIConfigService);

  getPet(params: GetPetParams, multipart = false): Observable<__model.Pet> { ... }

  // Solo ng22: lector signal-based ADITIVO (no reemplaza al método Observable)
  getPetResource(params: Signal<GetPetParams | undefined>) {
    return rxResource({
      params: () => params(),
      stream: ({ params }) => this.getPet(params),
    });
  }
}
```

**legacy** (constructor DI, `@Injectable()` a secas, provisto vía NgModule):
```ts
@Injectable()
export class PetsService {
  constructor(
    private http: HttpClient,
    private apiConfigService: APIConfigService) {}
  getPet(...) { ... }
}
```

### Form-services (abstract get/post)

Bajo `signals` (ng22) los abstractos exponen el estado como **signals además** de los Observables
(`src/forms/service-get-abstract.ts`, `service-post-abstract.ts`):
```ts
loading$: Observable<boolean>;      // se mantiene
serverErrors$: Observable<any>;     // se mantiene
loading!: Signal<boolean>;          // añadido (toSignal)
serverErrors!: Signal<any>;         // añadido (toSignal)
// en init():
this.loading = toSignal(this.loading$, { initialValue: false });
this.serverErrors = toSignal(this.serverErrors$);
```

### `apiconfig.service.ts`

ng22/ng16 usan `inject()` e inicialización de campos inline (sin constructor); legacy mantiene el
constructor. Ambos siguen `providedIn:'root'`.

### NgModules

Solo en `legacy`: `ApiFormsModule`, `<tag>FormModule`, per-op modules, `FormsSharedModule`. ng22/ng16 no
emiten ningún `@NgModule` (servicios self-provided por `providedIn:'root'`).

### Clean architecture (`-a`)

`domain/`, `data/repositories/`, `usecases/`. Bajo perfil `inject`, repos y usecases usan `inject()` +
`providedIn:'root'`. Repos y usecases importan correctamente los tipos de
parámetros (`XParams` desde el controlador) y `__model` (detectado por el tipo de respuesta); la matriz
de compilación cubre el output con `-a` en los 3 targets.

### Typed forms

`typedFormsDefault` (ng22/ng16) emite `FormControl<T>` tipados. Los `FormArray` dinámicos siguen como
`UntypedFormArray` (limitación conocida de FormArray tipado). Override con `--untyped-forms`.

### cloneDeep

Targets standalone importan `import { cloneDeep } from 'lodash-es'` (tree-shakable); legacy mantiene
`import cloneDeep from 'lodash/cloneDeep'`.

### Cabecera de fichero

Cada `.ts` generado empieza con `/* eslint-disable */` + `// Generated by yasag — do not edit.`

## 5. Garantía aditiva (no se pierde funcionalidad)

La modernización es **estrictamente aditiva**: la "traducción" a lo nuevo no elimina nada de lo previo.

- Los métodos Observable (`getPet`, `createPet`, …) se **mantienen** en todos los targets; ng22 solo
  **añade** lectores `<op>Resource` para GET.
- `loading$`/`serverErrors$` se **mantienen**; ng22 **añade** las signals `loading`/`serverErrors`.
- Los `<op>Resource` **delegan** al método Observable (`rxResource({ stream: () => this.<op>(...) })`):
  cero duplicación de lógica de URL/params/respuesta → cero riesgo de divergencia.
- `inject()` usa las mismas dependencias que el constructor; `providedIn:'root'` sustituye el wiring de
  los NgModules sin cambiar el resultado de DI.

Blindado por `tests/parity.test.ts`: el conjunto de métodos de cada controlador en ng22/ng16 es un
**superset** del de legacy (excluyendo `constructor`, que es mecanismo de DI, no API).

## 6. Referencia CLI

| Flag | Descripción |
|---|---|
| `-s, --src <file>` | Spec de entrada (JSON o YAML) |
| `-d, --dest <dir>` | Directorio de salida |
| `--target <ng>` | `ng22` (default) · `ng16` · `legacy` |
| `--no-store` | No generar la capa de forms/store |
| `-a, --clean-architecture` | Generar domain/data/usecases |
| `-t, --typed-forms` | Forzar typed forms on |
| `--untyped-forms` | Forzar typed forms off (override del target) |
| `-w, --unwrap-single-param-methods` | Método `_()` con el único parámetro desempaquetado |
| `-u, --swagger-url-path <path>` | Path de la UI Swagger |
| `-o, --omit-version` · `-b, --omit-basepath` · `-h, --omit-header` | Omitir metadatos |
| `-v, --environment-var <name>` · `-c, --environment-cache <name>` | Vars de entorno |
| `-r, --read-only <ending>` | Omitir atributos con sufijo en PUT/POST/PATCH |

## 7. Desarrollo y verificación

```bash
npm install
npm run check      # lint (eslint) + build (tsc 5.9) + test (node:test vía tsx) — 114 tests
```

- **Toolchain**: TypeScript ~5.9, devDeps `@angular/* ^22`, ESLint 9 flat config (`eslint.config.mjs`).
- **Runner de tests**: `node --test` vía `tsx` (NO Vitest/Jest — es una tool Node standalone).

### Matriz de compilación multi-versión

Prueba real de que cada target compila contra **su** versión de Angular (no conviven dos `@angular/core`
en un `node_modules`, por eso cada target tiene su propio proyecto consumidor):

```bash
npm run e2e:setup   # instala Angular 22 / 18 / 16 en tests/e2e-consumers/{ng22,ng16,legacy}
npm run e2e:matrix  # genera el fixture por target → tsc --noEmit contra su Angular
```

`tests/matrix.e2e.test.ts` hace *skip* limpio si `e2e:setup` no se ejecutó, así que `npm test` no exige
la instalación pesada.

## 8. Estrategia de tests (TDD)

| Test | Cubre |
|---|---|
| `targetProfile.test.ts` | Matriz de flags de cada target |
| `emitDi.test.ts` | `inject()`/`providedIn` (ng22/ng16) vs constructor (legacy), aislando repo-impl |
| `emitModules.test.ts` | `@NgModule` solo en legacy |
| `emitSignals.test.ts` | `toSignal`/`rxResource` en ng22 (reader delega en el método Observable), ausentes en ng16; Observable preservado |
| `emitCleanArch.test.ts` | Repos + usecases clean-arch con `inject`/`providedIn` por target |
| `emitTypedForms.test.ts` | typed default por target + override `--untyped-forms` |
| `parity.test.ts` | ng22/ng16 superset de métodos de legacy (no-regresión) |
| `matrix.e2e.test.ts` | Compilación real por target (ng22@22, ng16@18, legacy@16) |
| `generateOas3.e2e.test.ts` | OAS3 default compila (store on/off) |
| `parseSpec` / `detectVersion` / `normalizeOpenApi3(.robustness)` | Entrada OAS3/YAML |

## 9. Limitaciones conocidas y follow-ups

- **`httpResource` vs `rxResource`**: el flag del profile se llama `httpResource` pero se emite
  `rxResource` (delega al método Observable, evita reimplementar la petición). Naming a reconciliar.
- **Ejemplos de referencia**: el fixture de tests y los consumers de `tests/e2e-consumers/`. La antigua
  `demo/petstore` se elimino: no la ejercitaba ningun test y se habia quedado en una version anterior de Angular.
- **Adopción de `ng22` en un consumidor existente**: quitar `ApiFormsModule` y añadir
  `provideHttpClient` es una migración del consumidor, aparte de este trabajo.

## 10. Historial

- **OAS3 + YAML** — detección de versión,
  normalizer OAS3, entrada YAML, e2e compile-gate.
- **Multi-target Angular** — `--target ng22|ng16|legacy`,
  `TargetProfile`, `inject()`/`providedIn` en todas las capas, signals + `rxResource`, typed forms por
  defecto, tool a Angular 22 + TS 5.9, matriz de compilación.

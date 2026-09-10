import { describe, it, after } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { generate } from '../src/generate';

const yasagRoot = path.join(__dirname, '..');
const fixture = path.join(__dirname, 'fixtures', 'openapi3.yaml');
// Temp output must live under yasagRoot so generated `@angular`/`rxjs` imports
// resolve via node_modules walk-up.
const outDir = path.join(yasagRoot, '.e2e-tmp');
const tsc = path.join(yasagRoot, 'node_modules', '.bin', 'tsc');

const ENV_STUB = `export const environment = {
  apiUrl: '' as string,
  apiCacheSize: 1000,
  apiRetries: 3,
} as { [k: string]: any };
`;

const TSCONFIG = JSON.stringify({
  compilerOptions: {
    // Angular 22 ships ESM with `exports` maps -> needs bundler resolution.
    target: 'es2022', module: 'esnext', moduleResolution: 'bundler',
    lib: ['dom', 'es2022'], experimentalDecorators: true, emitDecoratorMetadata: true,
    skipLibCheck: true, strict: false, esModuleInterop: true, noEmit: true,
    baseUrl: '.', paths: { 'environments/environment': ['environments/environment'] },
  },
  include: ['**/*.ts'],
});

describe('OpenAPI 3 end-to-end generation', () => {
  after(() => fs.rmSync(outDir, { recursive: true, force: true }));

  it('generates a TypeScript client that type-checks', () => {
    fs.rmSync(outDir, { recursive: true, force: true });
    // Generate straight into a non-existent dir — proves recursive dir creation too.
    generate(fixture, outDir);

    assert.ok(fs.existsSync(path.join(outDir, 'model.ts')), 'model.ts generated');
    assert.ok(fs.existsSync(path.join(outDir, 'controllers', 'Pets.ts')), 'controller generated');

    fs.mkdirSync(path.join(outDir, 'environments'), { recursive: true });
    fs.writeFileSync(path.join(outDir, 'environments', 'environment.ts'), ENV_STUB);
    fs.writeFileSync(path.join(outDir, 'tsconfig.json'), TSCONFIG);

    typecheck(outDir);
  });

  it('generates a compilable client with the store disabled', () => {
    fs.rmSync(outDir, { recursive: true, force: true });
    generate(fixture, outDir, /* generateStore */ false);

    // No forms layer, but the barrel that imports per-op form services must not
    // be emitted either (otherwise it references non-existent modules).
    assert.ok(!fs.existsSync(path.join(outDir, 'form-service.ts')), 'no dangling form-service barrel');
    assert.ok(fs.existsSync(path.join(outDir, 'controllers', 'Pets.ts')), 'controller still generated');

    fs.mkdirSync(path.join(outDir, 'environments'), { recursive: true });
    fs.writeFileSync(path.join(outDir, 'environments', 'environment.ts'), ENV_STUB);
    fs.writeFileSync(path.join(outDir, 'tsconfig.json'), TSCONFIG);
    typecheck(outDir);
  });
});

function typecheck(dir: string): void {
  let ok = true;
  let output = '';
  try {
    execFileSync(tsc, ['-p', path.join(dir, 'tsconfig.json')], { encoding: 'utf8' });
  } catch (e: any) {
    ok = false;
    output = (e.stdout || '') + (e.stderr || '');
  }
  assert.ok(ok, `generated client should type-check, got:\n${output}`);
}

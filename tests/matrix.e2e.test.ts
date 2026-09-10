import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { generate } from '../src/generate';
import { NgTarget } from '../src/target-profile';

const yasagRoot = path.join(__dirname, '..');
const fixture = path.join(__dirname, 'fixtures', 'openapi3.yaml');
const consumersDir = path.join(__dirname, 'e2e-consumers');

const ENV_STUB = `export const environment = {
  apiUrl: '' as string,
  apiCacheSize: 1000,
  apiRetries: 3,
} as { [k: string]: any };
`;

const TSCONFIG = JSON.stringify({
  compilerOptions: {
    target: 'es2022', module: 'esnext', moduleResolution: 'bundler',
    lib: ['dom', 'es2022'], experimentalDecorators: true, emitDecoratorMetadata: true,
    skipLibCheck: true, strict: false, esModuleInterop: true, noEmit: true,
    baseUrl: '.', paths: { 'environments/environment': ['environments/environment'] },
  },
  include: ['**/*.ts'],
});

const TARGETS: NgTarget[] = ['ng22', 'ng16', 'legacy'];

function installed(target: NgTarget): boolean {
  return fs.existsSync(path.join(consumersDir, target, 'node_modules', '@angular', 'core'));
}

function compileTarget(target: NgTarget): void {
  const consumer = path.join(consumersDir, target);
  const gen = path.join(consumer, 'gen');
  fs.rmSync(gen, { recursive: true, force: true });
  // Full output incl. clean-arch (-a): services + forms + apiconfig + domain/data/usecases.
  generate(fixture, gen, true, false, undefined, false, false, undefined, false,
    false, '', undefined, true, target);

  fs.mkdirSync(path.join(gen, 'environments'), { recursive: true });
  fs.writeFileSync(path.join(gen, 'environments', 'environment.ts'), ENV_STUB);
  fs.writeFileSync(path.join(gen, 'tsconfig.json'), TSCONFIG);

  const tsc = path.join(consumer, 'node_modules', '.bin', 'tsc');
  let output = '';
  try {
    execFileSync(tsc, ['-p', path.join(gen, 'tsconfig.json')], { encoding: 'utf8' });
  } catch (e: any) {
    output = (e.stdout || '') + (e.stderr || '');
    throw new assert.AssertionError({ message: `${target} output failed to type-check:\n${output}` });
  } finally {
    fs.rmSync(gen, { recursive: true, force: true });
  }
}

describe('e2e compile matrix (each target vs its Angular version)', () => {
  for (const target of TARGETS) {
    it(`${target} output type-checks against its pinned Angular`, { skip: !installed(target) && `run "npm run e2e:setup" first` }, () => {
      compileTarget(target);
    });
  }
});

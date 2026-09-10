import { describe, it, after } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { generate } from '../src/generate';
import { NgTarget } from '../src/target-profile';

const yasagRoot = path.join(__dirname, '..');
const fixture = path.join(__dirname, 'fixtures', 'openapi3.yaml');
const dirs: string[] = [];

function gen(target: NgTarget): string {
  const out = path.join(yasagRoot, `.emit-${target}`);
  dirs.push(out);
  fs.rmSync(out, { recursive: true, force: true });
  // positional: src, dest, generateStore, unwrap, swaggerUrlPath, omitVersion,
  // omitBasepath, environmentAPI, omitHeader, typedForms, readOnly, environmentCache,
  // cleanArchitecture, target
  generate(fixture, out, true, false, undefined, false, false, undefined, false,
    false, '', undefined, true, target);
  return out;
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

function read(p: string): string {
  return fs.readFileSync(p, 'utf8');
}

/** All generated .ts concatenated (for tree-wide presence checks). */
function allTs(dir: string): string {
  return walk(dir).filter(p => p.endsWith('.ts')).map(read).join('\n');
}

function find(dir: string, suffix: string): string {
  const hit = walk(dir).find(p => p.endsWith(suffix));
  assert.ok(hit, `expected a file ending in ${suffix}`);
  return read(hit!);
}

after(() => dirs.forEach(d => fs.rmSync(d, { recursive: true, force: true })));

describe('emitted DI per target', () => {
  it('ng22 controllers use inject() + providedIn:root, no constructor', () => {
    const out = gen('ng22');
    const ctrl = read(path.join(out, 'controllers', 'Pets.ts'));
    assert.match(ctrl, /inject\(HttpClient\)/);
    assert.match(ctrl, /@Injectable\(\{\s*providedIn:\s*'root'\s*\}\)/);
    assert.doesNotMatch(ctrl, /constructor\(/);
  });

  it('ng22 apiconfig uses inject()', () => {
    const out = gen('ng22');
    const cfg = read(path.join(out, 'apiconfig.service.ts'));
    assert.match(cfg, /inject\(APIConfigServiceOptions\)/);
    assert.doesNotMatch(cfg, /constructor\(/);
  });

  it('ng22 clean-arch repo impl + usecase use inject() + providedIn:root, no constructor', () => {
    const out = gen('ng22');
    const usecase = find(out, '.usecase.ts');
    assert.match(usecase, /inject\(/);
    assert.match(usecase, /providedIn:\s*'root'/);
    assert.doesNotMatch(usecase, /constructor\(/);
    // isolate the repository implementation file itself
    const repoImpl = find(out, 'RepositoryImpl.ts');
    assert.match(repoImpl, /inject\(/);
    assert.match(repoImpl, /@Injectable\(\{\s*providedIn:\s*'root'\s*\}\)/);
    assert.doesNotMatch(repoImpl, /constructor\(/);
  });

  it('ng16 controllers also use inject() + providedIn:root, no constructor', () => {
    const ctrl = read(path.join(gen('ng16'), 'controllers', 'Pets.ts'));
    assert.match(ctrl, /inject\(HttpClient\)/);
    assert.match(ctrl, /@Injectable\(\{\s*providedIn:\s*'root'\s*\}\)/);
    assert.doesNotMatch(ctrl, /constructor\(/);
  });

  it('legacy controllers keep constructor DI, no inject()', () => {
    const out = gen('legacy');
    const ctrl = read(path.join(out, 'controllers', 'Pets.ts'));
    assert.match(ctrl, /constructor\(/);
    assert.doesNotMatch(ctrl, /inject\(HttpClient\)/);
  });
});

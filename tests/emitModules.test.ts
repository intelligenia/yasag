import { describe, it, after } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { generate } from '../src/generate';
import { NgTarget } from '../src/target-profile';

const yasagRoot = path.join(__dirname, '..');
const fixture = path.join(__dirname, 'fixtures', 'openapi3.yaml');
const dirs: string[] = [];

function genAll(target: NgTarget): string {
  const out = path.join(yasagRoot, `.mod-${target}`);
  dirs.push(out);
  fs.rmSync(out, { recursive: true, force: true });
  generate(fixture, out, true, false, undefined, false, false, undefined, false,
    false, '', undefined, true, target);
  const walk = (d: string): string[] =>
    fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  return walk(out).filter(p => p.endsWith('.ts')).map(p => fs.readFileSync(p, 'utf8')).join('\n');
}

after(() => dirs.forEach(d => fs.rmSync(d, { recursive: true, force: true })));

describe('NgModule emission per target', () => {
  it('ng22 emits no @NgModule', () => {
    assert.doesNotMatch(genAll('ng22'), /@NgModule/);
  });

  it('ng16 emits no @NgModule', () => {
    assert.doesNotMatch(genAll('ng16'), /@NgModule/);
  });

  it('legacy emits NgModules (ApiFormsModule + FormsSharedModule)', () => {
    const tree = genAll('legacy');
    assert.match(tree, /@NgModule/);
    assert.match(tree, /class ApiFormsModule/);
    assert.match(tree, /class FormsSharedModule/);
  });
});

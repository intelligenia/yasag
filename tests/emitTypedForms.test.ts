import { describe, it, after } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { generate } from '../src/generate';
import { NgTarget } from '../src/target-profile';

const yasagRoot = path.join(__dirname, '..');
const fixture = path.join(__dirname, 'fixtures', 'openapi3.yaml');
const dirs: string[] = [];

function genUtils(target: NgTarget, untypedForms = false): { utils: string; tree: string } {
  const out = path.join(yasagRoot, `.tf-${target}-${untypedForms}`);
  dirs.push(out);
  fs.rmSync(out, { recursive: true, force: true });
  generate(fixture, out, true, false, undefined, false, false, undefined, false,
    false, '', undefined, false, target, untypedForms);
  const walk = (d: string): string[] =>
    fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  return {
    utils: fs.readFileSync(path.join(out, 'yasag-utils.ts'), 'utf8'),
    tree: walk(out).filter(p => p.endsWith('.ts')).map(p => fs.readFileSync(p, 'utf8')).join('\n'),
  };
}

after(() => dirs.forEach(d => fs.rmSync(d, { recursive: true, force: true })));

describe('typed forms default per target', () => {
  it('ng22 defaults to typed forms (typed FormControl<T>, arrays kept UntypedFormArray)', () => {
    const { utils, tree } = genUtils('ng22');
    assert.match(tree, /new FormControl<[^>]+>/);
    assert.match(utils, /UntypedFormArray/);
    // typed forms keep the inferred structural FormGroup type (no widening annotation)
    assert.match(tree, /\bform = new FormGroup\(/);
    assert.doesNotMatch(tree, /form: FormGroup = new FormGroup\(/);
  });

  it('--untyped-forms overrides ng22 back to plain FormArray/FormControl', () => {
    const { utils, tree } = genUtils('ng22', true);
    assert.match(utils, /\bFormArray\b/);
    assert.doesNotMatch(utils, /UntypedFormArray/);
    assert.doesNotMatch(tree, /new FormControl<[^>]+>/);
    // untyped forms annotate the field as plain FormGroup so `.get('a.b')` stays
    // callable (else typed-FormGroup overload union → TS2349)
    assert.match(tree, /form: FormGroup = new FormGroup\(/);
  });

  it('enum $ref property emits a scalar FormControl, not an empty FormGroup', () => {
    const { tree } = genUtils('ng22');
    // status_ref -> PetStatusEnum (a hoisted enum component). Must be a scalar
    // control; an empty FormGroup would serialize to `{}` and the backend
    // rejects it with "'{}' is not a valid option".
    assert.match(tree, /status_ref: new FormControl<string[^>]*>/);
    assert.doesNotMatch(tree, /status_ref: new FormGroup/);
  });

  it('legacy defaults to untyped forms', () => {
    const { tree } = genUtils('legacy');
    assert.doesNotMatch(tree, /new FormControl<[^>]+>/);
  });
});

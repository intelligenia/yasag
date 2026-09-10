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
  const out = path.join(yasagRoot, `.par-${target}`);
  dirs.push(out);
  fs.rmSync(out, { recursive: true, force: true });
  generate(fixture, out, true, false, undefined, false, false, undefined, false,
    false, '', undefined, true, target);
  return out;
}

after(() => dirs.forEach(d => fs.rmSync(d, { recursive: true, force: true })));

/** Public method names declared in a generated controller class. */
function methodNames(ctrlSource: string): Set<string> {
  const names = new Set<string>();
  const re = /^ {2}([a-zA-Z_]\w*)\(/gm;
  let m: RegExpExecArray | null;
  // `constructor` is a DI mechanism, not an API method — inject() targets drop it
  // by design, so it is not part of the functional surface being compared.
  while ((m = re.exec(ctrlSource))) if (m[1] !== 'constructor') names.add(m[1]);
  return names;
}

function ctrl(target: NgTarget): Set<string> {
  return methodNames(fs.readFileSync(path.join(gen(target), 'controllers', 'Pets.ts'), 'utf8'));
}

describe('functional parity across targets (no functionality lost in translation)', () => {
  it('ng22 and ng16 keep every method legacy has (superset)', () => {
    const legacy = ctrl('legacy');
    assert.ok(legacy.size >= 4, 'legacy should declare the operation methods');
    for (const target of ['ng22', 'ng16'] as NgTarget[]) {
      const set = ctrl(target);
      for (const name of legacy) {
        assert.ok(set.has(name), `${target} must keep legacy method ${name}`);
      }
    }
  });

  it('ng22 adds GET resource readers on top of the legacy method set', () => {
    const legacy = ctrl('legacy');
    const ng22 = ctrl('ng22');
    for (const name of legacy) assert.ok(ng22.has(name));
    assert.ok(ng22.has('getPetResource'));
    assert.ok(ng22.has('listPetsResource'));
    assert.ok(!legacy.has('getPetResource'), 'resource readers are additive, not in legacy');
  });

  it('ng22 abstract keeps the Observable state streams alongside signals', () => {
    const abs = fs.readFileSync(path.join(gen('ng22'), 'forms', 'yasag-get.service.ts'), 'utf8');
    assert.match(abs, /loading\$/);
    assert.match(abs, /serverErrors\$/);
    assert.match(abs, /toSignal\(/);
  });
});

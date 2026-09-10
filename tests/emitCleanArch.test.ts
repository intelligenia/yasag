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
  const out = path.join(yasagRoot, `.ca-${target}`);
  dirs.push(out);
  fs.rmSync(out, { recursive: true, force: true });
  generate(fixture, out, true, false, undefined, false, false, undefined, false,
    false, '', undefined, true, target);
  return out;
}

const read = (p: string) => fs.readFileSync(p, 'utf8');
const walk = (d: string): string[] =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const find = (d: string, suffix: string) => walk(d).find(p => p.endsWith(suffix))!;

after(() => dirs.forEach(d => fs.rmSync(d, { recursive: true, force: true })));

describe('clean-arch imports (no undefined references)', () => {
  it('repository (abstract + impl) imports its param types and model', () => {
    const out = gen('ng22');
    for (const f of ['repositories/PetsRepository.ts', 'repositories/PetsRepositoryImpl.ts']) {
      const src = read(find(out, f));
      // param interface used in signatures must be imported from the controller file
      assert.match(src, /import \{[^}]*GetPetParams[^}]*\} from '..\/..\/controllers\/Pets'/);
      // response type is __model.Pet -> namespace must be imported
      assert.match(src, /import \* as __model from '\.\.\/\.\.\/model'/);
    }
  });

  it('usecase imports its param type and model', () => {
    const out = gen('ng22');
    const uc = read(find(out, 'getPet.usecase.ts'));
    assert.match(uc, /import \{ GetPetParams \} from '..\/..\/controllers\/Pets'/);
    assert.match(uc, /import \* as __model from '\.\.\/\.\.\/model'/);
  });

  it('a no-param / no-model usecase does not import them (no unused imports)', () => {
    // photo (uploadPhoto) returns void-ish and has no query/body params typed via __model
    const out = gen('ng22');
    const photo = read(find(out, 'photo.usecase.ts'));
    // photo has a path param object -> PhotoParams imported; but must not import __model if unused
    if (!/\b__model\./.test(photo)) {
      assert.doesNotMatch(photo, /import \* as __model/);
    }
  });
});

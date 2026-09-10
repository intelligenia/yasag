import { describe, it, before } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { parseSpec } from '../src/adapters/parse-spec';
import { normalizeOpenApi3 } from '../src/adapters/openapi3-normalizer';

let n: any;

before(() => {
  const raw = fs.readFileSync(path.join(__dirname, 'fixtures', 'openapi3.yaml'), 'utf8');
  n = normalizeOpenApi3(parseSpec(raw));
});

describe('normalizeOpenApi3', () => {
  it('emits swagger 2.0 envelope', () => {
    assert.strictEqual(n.swagger, '2.0');
  });

  it('resolves server URL variables into host/basePath/schemes', () => {
    assert.strictEqual(n.host, 'api.example.com');
    assert.strictEqual(n.basePath, '/v2');
    assert.deepStrictEqual(n.schemes, ['https']);
  });

  it('moves components.schemas into definitions', () => {
    assert.deepStrictEqual(
      Object.keys(n.definitions).sort(),
      ['ApiError', 'Category', 'Pet', 'PetInput', 'PetStatusEnum'],
    );
  });

  it('rewrites $ref from components/schemas to definitions', () => {
    assert.strictEqual(n.definitions.PetInput.properties.category.$ref, '#/definitions/Category');
  });

  it('merges allOf and keeps the inherited $ref plus own properties/required', () => {
    assert.strictEqual(n.definitions.Pet.$ref, '#/definitions/PetInput');
    assert.ok(n.definitions.Pet.properties.id, 'own property id merged');
    assert.deepStrictEqual(n.definitions.Pet.required, ['id']);
  });

  it('maps OAS 3.0 nullable to x-nullable', () => {
    assert.strictEqual(n.definitions.PetInput.properties.status['x-nullable'], true);
    assert.deepStrictEqual(n.definitions.PetInput.properties.status.enum, ['available', 'pending', 'sold']);
  });

  it('turns requestBody JSON into a body parameter', () => {
    const params = n.paths['/pets'].post.parameters;
    assert.deepStrictEqual(params, [{
      in: 'body', name: 'data', description: '', required: true,
      schema: { $ref: '#/definitions/PetInput' },
    }]);
  });

  it('flattens parameter.schema and resolves $ref parameters', () => {
    const params = n.paths['/pets'].get.parameters;
    const status = params.find((p: any) => p.name === 'status');
    assert.strictEqual(status.type, 'string');
    assert.deepStrictEqual(status.enum, ['available', 'pending', 'sold']);
    const limit = params.find((p: any) => p.name === 'limit'); // came from components/parameters
    assert.strictEqual(limit.in, 'query');
    assert.strictEqual(limit.type, 'integer');
    assert.strictEqual(limit.maximum, 100);
  });

  it('lifts response content schema', () => {
    const ok = n.paths['/pets'].get.responses['200'];
    assert.deepStrictEqual(ok.schema, { type: 'array', items: { $ref: '#/definitions/Pet' } });
  });

  it('resolves component response $ref', () => {
    const def = n.paths['/pets'].get.responses['default'];
    assert.strictEqual(def.schema.$ref, '#/definitions/ApiError');
  });

  it('YAML and equivalent JSON normalize to the same result', () => {
    const yaml = 'openapi: "3.0.3"\ninfo: { title: T, version: "1" }\npaths: {}\ncomponents:\n  schemas:\n    M: { type: object, properties: { n: { type: string, nullable: true } } }\n';
    const json = JSON.stringify({
      openapi: '3.0.3', info: { title: 'T', version: '1' }, paths: {},
      components: { schemas: { M: { type: 'object', properties: { n: { type: 'string', nullable: true } } } } },
    });
    assert.deepStrictEqual(
      normalizeOpenApi3(parseSpec(yaml)),
      normalizeOpenApi3(parseSpec(json)),
    );
  });

  it('turns multipart binary field into a file formData parameter', () => {
    const params = n.paths['/pets/{id}/photo'].post.parameters;
    const file = params.find((p: any) => p.name === 'file');
    assert.strictEqual(file.in, 'formData');
    assert.strictEqual(file.type, 'file');
    const caption = params.find((p: any) => p.name === 'caption');
    assert.strictEqual(caption.in, 'formData');
    assert.strictEqual(caption.type, 'string');
  });
});

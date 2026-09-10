import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { normalizeOpenApi3 } from '../src/adapters/openapi3-normalizer';

/** Minimal OAS3 doc wrapper around given components/paths/servers. */
function doc(extra: any): any {
  return normalizeOpenApi3({ openapi: '3.0.3', info: { title: 'T', version: '1' }, paths: {}, ...extra });
}

describe('normalizeOpenApi3 — servers robustness', () => {
  it('relative server URL keeps path as basePath', () => {
    const n = doc({ servers: [{ url: '/api/v1' }] });
    assert.strictEqual(n.host, 'localhost');
    assert.strictEqual(n.basePath, '/api/v1');
  });

  it('protocol-relative server URL splits host and basePath', () => {
    const n = doc({ servers: [{ url: '//api.example.com/v3' }] });
    assert.strictEqual(n.host, 'api.example.com');
    assert.strictEqual(n.basePath, '/v3');
  });

  it('absolute server URL parses host/basePath/scheme', () => {
    const n = doc({ servers: [{ url: 'http://h.test:8080/base' }] });
    assert.strictEqual(n.host, 'h.test:8080');
    assert.strictEqual(n.basePath, '/base');
    assert.deepStrictEqual(n.schemes, ['http']);
  });
});

describe('normalizeOpenApi3 — schema composition robustness', () => {
  it('OAS 3.1 type array with null -> single type + x-nullable', () => {
    const n = doc({ components: { schemas: {
      M: { type: 'object', properties: { name: { type: ['string', 'null'] } } },
    } } });
    assert.strictEqual(n.definitions.M.properties.name.type, 'string');
    assert.strictEqual(n.definitions.M.properties.name['x-nullable'], true);
  });

  it('OAS 3.1 anyOf [T, null] collapses to nullable T', () => {
    const n = doc({ components: { schemas: {
      M: { type: 'object', properties: { age: { anyOf: [{ type: 'integer' }, { type: 'null' }] } } },
    } } });
    assert.strictEqual(n.definitions.M.properties.age.type, 'integer');
    assert.strictEqual(n.definitions.M.properties.age['x-nullable'], true);
  });

  it('genuine multi-ref oneOf union collapses to any (generator-consumable)', () => {
    // The generator has no oneOf branch, so a preserved union crashes translateType.
    // A genuine union with no single real member maps to `any`.
    const n = doc({ components: { schemas: {
      A: { type: 'object' }, B: { type: 'object' },
      U: { oneOf: [{ $ref: '#/components/schemas/A' }, { $ref: '#/components/schemas/B' }] },
    } } });
    assert.strictEqual(n.definitions.U.type, 'any');
    assert.ok(!n.definitions.U.oneOf, 'oneOf removed');
  });

  it('discriminator is exposed and its mapping refs rewritten', () => {
    const n = doc({ components: { schemas: {
      Cat: { type: 'object' },
      Pet: {
        type: 'object', properties: { kind: { type: 'string' } },
        discriminator: { propertyName: 'kind', mapping: { cat: '#/components/schemas/Cat' } },
      },
    } } });
    assert.strictEqual(n.definitions.Pet['x-discriminator-property'], 'kind');
    assert.strictEqual(n.definitions.Pet['x-discriminator-mapping'].cat, '#/definitions/Cat');
  });

  it('deeply nested $ref (property -> items -> $ref) is rewritten', () => {
    const n = doc({ components: { schemas: {
      Leaf: { type: 'object' },
      Root: { type: 'object', properties: { list: { type: 'array', items: { $ref: '#/components/schemas/Leaf' } } } },
    } } });
    assert.strictEqual(n.definitions.Root.properties.list.items.$ref, '#/definitions/Leaf');
  });
});

describe('normalizeOpenApi3 — requestBody robustness', () => {
  it('resolves components/requestBodies $ref into a body parameter', () => {
    const n = doc({
      paths: { '/x': { post: {
        operationId: 'doX', tags: ['x'],
        requestBody: { $ref: '#/components/requestBodies/Payload' },
        responses: { '200': { description: 'ok' } },
      } } },
      components: {
        requestBodies: { Payload: { required: true, content: {
          'application/json': { schema: { $ref: '#/components/schemas/P' } },
        } } },
        schemas: { P: { type: 'object' } },
      },
    });
    const params = n.paths['/x'].post.parameters;
    assert.strictEqual(params.length, 1);
    assert.strictEqual(params[0].in, 'body');
    assert.strictEqual(params[0].schema.$ref, '#/definitions/P');
  });

  it('array-of-binary multipart field becomes a file parameter', () => {
    const n = doc({
      paths: { '/up': { post: {
        operationId: 'up', tags: ['up'],
        requestBody: { content: { 'multipart/form-data': { schema: {
          type: 'object',
          properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } },
        } } } },
        responses: { '200': { description: 'ok' } },
      } } },
    });
    const files = n.paths['/up'].post.parameters.find((p: any) => p.name === 'files');
    assert.strictEqual(files.in, 'formData');
    assert.strictEqual(files.type, 'file');
  });
});

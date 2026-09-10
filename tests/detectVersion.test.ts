import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { detectVersion } from '../src/adapters/openapi-detector';

describe('detectVersion', () => {
  it('detects OpenAPI 3.1 from explicit field', () => {
    assert.strictEqual(detectVersion({ openapi: '3.1.0' }), 'openapi31');
  });

  it('detects OpenAPI 3.0 from explicit field', () => {
    assert.strictEqual(detectVersion({ openapi: '3.0.3' }), 'openapi30');
  });

  it('detects Swagger 2.0 from explicit field', () => {
    assert.strictEqual(detectVersion({ swagger: '2.0' }), 'swagger2');
  });

  it('detects Swagger 1.x from swaggerVersion', () => {
    assert.strictEqual(detectVersion({ swaggerVersion: '1.2' }), 'swagger1');
  });

  it('treats unknown 3.x as latest known (3.1)', () => {
    assert.strictEqual(detectVersion({ openapi: '3.2.0' }), 'openapi31');
  });

  it('heuristic: components.schemas without version field -> OpenAPI 3', () => {
    assert.strictEqual(detectVersion({ components: { schemas: {} }, paths: {} }), 'openapi30');
  });

  it('heuristic: servers array without version field -> OpenAPI 3', () => {
    assert.strictEqual(detectVersion({ servers: [{ url: '/' }], paths: {} }), 'openapi30');
  });

  it('heuristic: definitions -> Swagger 2.0', () => {
    assert.strictEqual(detectVersion({ definitions: {}, paths: {} }), 'swagger2');
  });
});

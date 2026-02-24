import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { translateType, normalizeDef } from '../src/common';

describe('translateType', () => {
  it('should translate native types', () => {
    assert.deepStrictEqual(translateType('string'), { type: 'string', native: true, arraySimple: true });
    assert.deepStrictEqual(translateType('integer'), { type: 'number', native: true, arraySimple: true });
    assert.deepStrictEqual(translateType('boolean'), { type: 'boolean', native: true, arraySimple: true });
    assert.deepStrictEqual(translateType('number'), { type: 'number', native: true, arraySimple: true });
  });

  it('should translate $ref to definitions', () => {
    const result = translateType('#/definitions/Pet');
    assert.strictEqual(result.type, '__model.Pet');
    assert.strictEqual(result.native, false);
  });

  it('should translate $ref to components/schemas (OpenAPI 3)', () => {
    const result = translateType('#/components/schemas/Pet');
    assert.strictEqual(result.type, '__model.Pet');
    assert.strictEqual(result.native, false);
  });

  it('should translate Collection to array', () => {
    const result = translateType('#/definitions/Collection\u00ABPet\u00BB');
    assert.ok(result.type.endsWith('[]'));
    assert.strictEqual(result.native, false);
  });

  it('should translate Map to Record', () => {
    const result = translateType('#/definitions/Map\u00ABstring,number\u00BB');
    assert.ok(result.type.startsWith('Record<'));
    assert.strictEqual(result.native, true);
  });

  it('should pass through unknown types as-is', () => {
    const result = translateType('customType');
    assert.strictEqual(result.type, 'customType');
    assert.strictEqual(result.native, true);
  });
});

describe('normalizeDef', () => {
  it('should pass through simple names', () => {
    assert.strictEqual(normalizeDef('Pet'), 'Pet');
  });

  it('should uppercase first letter', () => {
    assert.strictEqual(normalizeDef('pet'), 'Pet');
  });

  it('should unwrap generics', () => {
    const result = normalizeDef('PagedResources\u00ABPage\u00ABItemDto\u00BB\u00BB');
    assert.strictEqual(result, 'ItemDtoPagePagedResources');
  });

  it('should handle dots by camelCasing', () => {
    assert.strictEqual(normalizeDef('com.example.Pet'), 'ComExamplePet');
  });

  it('should strip brackets', () => {
    assert.strictEqual(normalizeDef('Pet[]'), 'Pet');
  });
});

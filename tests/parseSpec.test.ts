import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { parseSpec } from '../src/adapters/parse-spec';

const JSON_SPEC = `{
  "openapi": "3.0.3",
  "info": { "title": "T", "version": "1.0.0" },
  "paths": {}
}`;

const YAML_SPEC = `openapi: 3.0.3
info:
  title: T
  version: 1.0.0
paths: {}
`;

describe('parseSpec', () => {
  it('parses JSON spec', () => {
    const obj = parseSpec(JSON_SPEC);
    assert.strictEqual(obj.openapi, '3.0.3');
    assert.deepStrictEqual(obj.paths, {});
  });

  it('parses YAML spec', () => {
    const obj = parseSpec(YAML_SPEC);
    assert.strictEqual(obj.openapi, '3.0.3');
    assert.strictEqual(obj.info.title, 'T');
    assert.deepStrictEqual(obj.paths, {});
  });

  it('YAML and equivalent JSON parse deep-equal', () => {
    assert.deepStrictEqual(parseSpec(YAML_SPEC), parseSpec(JSON_SPEC));
  });

  it('throws a clear error on input that is neither JSON nor YAML', () => {
    // A tab-indented mapping is invalid YAML and invalid JSON.
    assert.throws(() => parseSpec('key:\n\tbad: [unclosed'), /parse/i);
  });
});

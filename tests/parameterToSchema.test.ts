import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { parameterToSchema } from '../src/requests/process-params';
import { Parameter } from '../src/types';

describe('parameterToSchema', () => {
  it('should copy basic fields', () => {
    const param: Parameter = {
      name: 'test',
      in: 'query',
      required: true,
      description: 'A test param',
      type: 'string',
      format: 'email',
    };
    const schema = parameterToSchema(param);
    assert.strictEqual(schema.type, 'string');
    assert.strictEqual(schema.format, 'email');
    assert.strictEqual(schema.description, 'A test param');
  });

  it('should copy validation fields', () => {
    const param: Parameter = {
      name: 'test',
      in: 'query',
      required: true,
      description: '',
      type: 'integer',
      minimum: 0,
      maximum: 100,
      minLength: 1,
      maxLength: 50,
      pattern: '^[0-9]+$',
    };
    const schema = parameterToSchema(param);
    assert.strictEqual(schema.minimum, 0);
    assert.strictEqual(schema.maximum, 100);
    assert.strictEqual(schema.minLength, 1);
    assert.strictEqual(schema.maxLength, 50);
    assert.strictEqual(schema.pattern, '^[0-9]+$');
  });

  it('should copy new validator fields (exclusiveMin/Max, multipleOf, etc)', () => {
    const param: Parameter = {
      name: 'test',
      in: 'query',
      required: true,
      description: '',
      type: 'number',
      exclusiveMinimum: 0,
      exclusiveMaximum: 100,
      multipleOf: 5,
      minItems: 1,
      maxItems: 10,
      readOnly: true,
      writeOnly: false,
      example: 42,
    };
    const schema = parameterToSchema(param);
    assert.strictEqual(schema.exclusiveMinimum, 0);
    assert.strictEqual(schema.exclusiveMaximum, 100);
    assert.strictEqual(schema.multipleOf, 5);
    assert.strictEqual(schema.minItems, 1);
    assert.strictEqual(schema.maxItems, 10);
    assert.strictEqual(schema.readOnly, true);
    assert.strictEqual(schema.writeOnly, false);
    assert.strictEqual(schema.example, 42);
  });

  it('should let schema properties override inline properties', () => {
    const param: Parameter = {
      name: 'test',
      in: 'body',
      required: true,
      description: '',
      type: 'string',
      minimum: 5,
      schema: {
        type: 'integer',
        minimum: 10,
      },
    };
    const schema = parameterToSchema(param);
    // schema.minimum should override param.minimum
    assert.strictEqual(schema.type, 'integer');
    assert.strictEqual(schema.minimum, 10);
  });

  it('should handle x-nullable', () => {
    const param: Parameter = {
      name: 'test',
      in: 'query',
      required: false,
      description: '',
      type: 'string',
      'x-nullable': true,
    };
    const schema = parameterToSchema(param);
    assert.strictEqual(schema['x-nullable'], true);
  });
});

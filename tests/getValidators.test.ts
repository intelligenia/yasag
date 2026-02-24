import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { getValidators } from '../src/forms/generate-form-service';

describe('getValidators', () => {
  it('should return empty array for param with no constraints', () => {
    const result = getValidators({ type: 'string' });
    assert.deepStrictEqual(result, []);
  });

  it('should add email validator for format: email', () => {
    const result = getValidators({ format: 'email', type: 'string' });
    assert.ok(result.includes('Validators.email'));
  });

  it('should add max validator', () => {
    const result = getValidators({ maximum: 100 });
    assert.ok(result.some(v => v === 'Validators.max(100)'));
  });

  it('should add min validator', () => {
    const result = getValidators({ minimum: 5 });
    assert.ok(result.some(v => v === 'Validators.min(5)'));
  });

  it('should handle maximum: 0', () => {
    const result = getValidators({ maximum: 0 });
    assert.ok(result.some(v => v === 'Validators.max(0)'));
  });

  it('should handle minimum: 0', () => {
    const result = getValidators({ minimum: 0 });
    assert.ok(result.some(v => v === 'Validators.min(0)'));
  });

  it('should add maxLength validator', () => {
    const result = getValidators({ maxLength: 255 });
    assert.ok(result.some(v => v === 'Validators.maxLength(255)'));
  });

  it('should add minLength validator', () => {
    const result = getValidators({ minLength: 1 });
    assert.ok(result.some(v => v === 'Validators.minLength(1)'));
  });

  it('should handle minLength: 0', () => {
    const result = getValidators({ minLength: 0 });
    assert.ok(result.some(v => v === 'Validators.minLength(0)'));
  });

  it('should handle maxLength: 0', () => {
    const result = getValidators({ maxLength: 0 });
    assert.ok(result.some(v => v === 'Validators.maxLength(0)'));
  });

  it('should add pattern validator', () => {
    const result = getValidators({ pattern: '^[A-Z]+$' });
    assert.ok(result.some(v => v === 'Validators.pattern(/^[A-Z]+$/)'));
  });

  // OAS 3.1 exclusiveMinimum (number)
  it('should handle exclusiveMinimum as number (OAS 3.1)', () => {
    const result = getValidators({ exclusiveMinimum: 0 });
    assert.ok(result.some(v => v === 'Validators.min(0)'));
  });

  // OAS 3.0 exclusiveMinimum (boolean)
  it('should handle exclusiveMinimum as boolean true with minimum (OAS 3.0)', () => {
    const result = getValidators({ exclusiveMinimum: true, minimum: 5 } as any);
    assert.ok(result.some(v => v === 'Validators.min(6)'));
  });

  it('should ignore exclusiveMinimum boolean without minimum', () => {
    const result = getValidators({ exclusiveMinimum: true } as any);
    assert.ok(!result.some(v => v.startsWith('Validators.min')));
  });

  // OAS 3.1 exclusiveMaximum (number)
  it('should handle exclusiveMaximum as number (OAS 3.1)', () => {
    const result = getValidators({ exclusiveMaximum: 100 });
    assert.ok(result.some(v => v === 'Validators.max(100)'));
  });

  // OAS 3.0 exclusiveMaximum (boolean)
  it('should handle exclusiveMaximum as boolean true with maximum (OAS 3.0)', () => {
    const result = getValidators({ exclusiveMaximum: true, maximum: 10 } as any);
    assert.ok(result.some(v => v === 'Validators.max(9)'));
  });

  // multipleOf
  it('should add multipleOf validator', () => {
    const result = getValidators({ multipleOf: 5 });
    assert.ok(result.some(v => v === '__utils.multipleOfValidator(5)'));
  });

  // minItems / maxItems
  it('should add minItems as minLength', () => {
    const result = getValidators({ minItems: 1 });
    assert.ok(result.some(v => v === 'Validators.minLength(1)'));
  });

  it('should add maxItems as maxLength', () => {
    const result = getValidators({ maxItems: 10 });
    assert.ok(result.some(v => v === 'Validators.maxLength(10)'));
  });

  // Combined validators
  it('should return multiple validators for combined constraints', () => {
    const result = getValidators({
      minimum: 0,
      maximum: 100,
      multipleOf: 5,
    });
    assert.strictEqual(result.length, 3);
    assert.ok(result.includes('Validators.max(100)'));
    assert.ok(result.includes('Validators.min(0)'));
    assert.ok(result.includes('__utils.multipleOfValidator(5)'));
  });
});

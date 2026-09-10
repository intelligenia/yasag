import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { normalizeOpenApi3 } from '../src/adapters/openapi3-normalizer';

/**
 * drf-spectacular idioms that crashed the generator before the collapse logic
 * (adopt-oas3-api-client-cutover). Each construct carries no top-level
 * type/$ref, so translateType threw on `undefined`. See design.md fork-gap table.
 */
function normDef(name: string, schema: any): any {
  const doc = {
    openapi: '3.0.3',
    info: { title: 'T', version: '1.0.0' },
    paths: {},
    components: {
      schemas: {
        [name]: { type: 'object', properties: { p: schema } },
        AdoptedMeasureEnum: { type: 'string', enum: ['voluntary', 'no_voluntary'] },
        IdentificationTypeEnum: { type: 'string', enum: ['dni', 'nie'] },
        NullEnum: { enum: [null] },
        BlankEnum: { enum: [''] },
      },
    },
  };
  return normalizeOpenApi3(doc).definitions[name].properties.p;
}

describe('normalizeOpenApi3 — drf-spectacular idioms', () => {
  it('collapses oneOf:[Enum, NullEnum] to the enum ref + x-nullable', () => {
    const p = normDef('ActionCessation', {
      oneOf: [
        { $ref: '#/components/schemas/AdoptedMeasureEnum' },
        { $ref: '#/components/schemas/NullEnum' },
      ],
    });
    assert.strictEqual(p.$ref, '#/definitions/AdoptedMeasureEnum');
    assert.strictEqual(p['x-nullable'], true);
    assert.ok(!p.oneOf, 'oneOf removed');
  });

  it('collapses oneOf:[Enum, BlankEnum, NullEnum] to the enum ref + x-nullable', () => {
    const p = normDef('ActionInterested', {
      oneOf: [
        { $ref: '#/components/schemas/IdentificationTypeEnum' },
        { $ref: '#/components/schemas/BlankEnum' },
        { $ref: '#/components/schemas/NullEnum' },
      ],
    });
    assert.strictEqual(p.$ref, '#/definitions/IdentificationTypeEnum');
    assert.strictEqual(p['x-nullable'], true);
  });

  it('collapses a blank-or-value string oneOf to string', () => {
    const p = normDef('Indret', {
      oneOf: [
        { type: 'string', format: 'email' },
        { type: 'string', maxLength: 0 },
      ],
    });
    assert.strictEqual(p.type, 'string');
    assert.ok(!p.oneOf);
  });

  it('maps a genuine object union to any', () => {
    const p = normDef('Geo', {
      oneOf: [{ type: 'object' }, { type: 'object' }, { type: 'object' }],
    });
    assert.strictEqual(p.type, 'any');
  });

  it('maps untyped array items to any', () => {
    const p = normDef('CircuitGlobalWaterOriginDeposits', { type: 'array', items: {} });
    assert.strictEqual(p.type, 'array');
    assert.strictEqual(p.items.type, 'any');
  });

  it('maps empty additionalProperties to a free-form any map', () => {
    const p = normDef('ActionMassiveCreationResponse', {
      type: 'object',
      additionalProperties: {},
    });
    assert.strictEqual(p.additionalProperties.type, 'any');
  });

  it('maps an untyped property ({} / {nullable:true}) to any', () => {
    assert.strictEqual(normDef('ETLSyncRunFull', {}).type, 'any');
    assert.strictEqual(normDef('IssueComplaint', { nullable: true }).type, 'any');
  });

  it('strips the shared /api mount segment from path keys (no /api/api URLs)', () => {
    const n = normalizeOpenApi3({
      openapi: '3.0.3',
      info: { title: 'T', version: '1.0.0' },
      paths: {
        '/api/permissions/': { get: { responses: { '200': { description: 'ok' } } } },
        '/api/indret/{id}/': { get: { responses: { '200': { description: 'ok' } } } },
      },
      components: { schemas: {} },
    });
    assert.deepStrictEqual(
      Object.keys(n.paths).sort(),
      ['/indret/{id}/', '/permissions/'],
    );
  });

  it('leaves path keys untouched when they do not share a mount segment', () => {
    const n = normalizeOpenApi3({
      openapi: '3.0.3',
      info: { title: 'T', version: '1.0.0' },
      paths: {
        '/permissions/': { get: { responses: { '200': { description: 'ok' } } } },
        '/indret/': { get: { responses: { '200': { description: 'ok' } } } },
      },
      components: { schemas: {} },
    });
    assert.deepStrictEqual(
      Object.keys(n.paths).sort(),
      ['/indret/', '/permissions/'],
    );
  });
});

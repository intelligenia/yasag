import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { processParams } from '../src/requests/process-params';
import { Parameter } from '../src/types';

/**
 * A detail action that also carries the list filterset gets the same parameter
 * name twice: `GET /protocol_template/{id}/audit/` has `id` as the path
 * parameter and again as a query filter, because `ProtocolTemplateFilter`
 * filters by `id`. Emitting both is TS2300/TS2687 and only `nx build` catches
 * it, so the generator has to collapse them.
 */
describe('processParams — duplicate parameter names', () => {
  const pathId: Parameter = {
    name: 'id',
    in: 'path',
    required: true,
    description: 'A unique integer value identifying this protocol template.',
    type: 'integer',
  };
  const queryId: Parameter = {
    name: 'id',
    in: 'query',
    required: false,
    description: '',
    type: 'integer',
  };

  it('declares a repeated name once, keeping the required path parameter', () => {
    const { paramDef } = processParams([pathId, queryId], 'AuditParams');
    assert.strictEqual(paramDef.match(/^\s*id\??:/gm)?.length, 1);
    assert.match(paramDef, /id: number;/);
    assert.doesNotMatch(paramDef, /id\?: number;/);
  });

  it('keeps the path parameter whatever the order in the spec', () => {
    const { paramDef } = processParams([queryId, pathId], 'AuditParams');
    assert.strictEqual(paramDef.match(/^\s*id\??:/gm)?.length, 1);
    assert.match(paramDef, /id: number;/);
  });

  it('leaves distinct names alone', () => {
    const search: Parameter = {
      name: 'search',
      in: 'query',
      required: false,
      description: 'A search term.',
      type: 'string',
    };
    const { paramDef } = processParams([pathId, search], 'AuditParams');
    assert.match(paramDef, /id: number;/);
    assert.match(paramDef, /search\?: string;/);
  });
});

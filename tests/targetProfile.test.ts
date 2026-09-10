import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { profileFor } from '../src/target-profile';

describe('profileFor', () => {
  it('ng22 enables the full modern set', () => {
    assert.deepStrictEqual(profileFor('ng22'), {
      target: 'ng22',
      standalone: true, inject: true, providedInRoot: true,
      signals: true, httpResource: true, typedFormsDefault: true,
    });
  });

  it('ng16 is standalone+inject but no signals/httpResource', () => {
    assert.deepStrictEqual(profileFor('ng16'), {
      target: 'ng16',
      standalone: true, inject: true, providedInRoot: true,
      signals: false, httpResource: false, typedFormsDefault: true,
    });
  });

  it('legacy is the classic NgModule/constructor style', () => {
    assert.deepStrictEqual(profileFor('legacy'), {
      target: 'legacy',
      standalone: false, inject: false, providedInRoot: false,
      signals: false, httpResource: false, typedFormsDefault: false,
    });
  });

  it('unknown target falls back to ng22', () => {
    assert.strictEqual(profileFor('nope' as any).target, 'ng22');
  });
});

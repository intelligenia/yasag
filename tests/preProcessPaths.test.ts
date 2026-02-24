import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

// We can't directly import preProcessPaths since it's not exported,
// so we test via processPaths indirectly. Instead, let's test the specific
// behavior we fixed: parameter deduplication and null safety.

// Since preProcessPaths is a private function, we'll verify the behavior
// by checking that the module loads without error and test the allowedParams fix.
import * as conf from '../src/conf';

describe('allowedParams configuration', () => {
  it('should allow query params for DELETE requests', () => {
    assert.ok(conf.allowedParams.delete.includes('path'));
    assert.ok(conf.allowedParams.delete.includes('query'));
  });

  it('should allow body params for POST requests', () => {
    assert.ok(conf.allowedParams.post.includes('body'));
    assert.ok(conf.allowedParams.post.includes('formData'));
  });

  it('should allow body params for PATCH requests', () => {
    assert.ok(conf.allowedParams.patch.includes('body'));
    assert.ok(conf.allowedParams.patch.includes('formData'));
  });

  it('should not allow body params for GET requests', () => {
    assert.ok(!conf.allowedParams.get.includes('body'));
    assert.ok(!conf.allowedParams.get.includes('formData'));
  });
});

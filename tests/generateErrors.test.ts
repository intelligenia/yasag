import { describe, it, after } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { generate } from '../src/generate';

const yasagRoot = path.join(__dirname, '..');
const badSpec = path.join(yasagRoot, '.e2e-bad.spec');
const outDir = path.join(yasagRoot, '.e2e-bad-out');

function captureStdout(fn: () => void): string {
  const orig = process.stdout.write.bind(process.stdout);
  let buf = '';
  (process.stdout as any).write = (s: any) => { buf += String(s); return true; };
  try { fn(); } finally { (process.stdout as any).write = orig; }
  return buf;
}

describe('generate — invalid spec handling', () => {
  after(() => {
    fs.rmSync(badSpec, { force: true });
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('names the offending file and generates nothing on unparseable input', () => {
    // Neither valid JSON nor valid YAML (tab-indented mapping).
    fs.writeFileSync(badSpec, 'key:\n\tbad: [unclosed');
    fs.rmSync(outDir, { recursive: true, force: true });

    const logged = captureStdout(() => generate(badSpec, outDir));

    assert.match(logged, /\.e2e-bad\.spec/, 'error output names the source file');
    assert.ok(!fs.existsSync(path.join(outDir, 'model.ts')), 'no client emitted');
  });
});

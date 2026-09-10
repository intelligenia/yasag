import { describe, it, after } from "node:test";
import * as assert from "node:assert/strict";
import * as fs from "fs";
import * as path from "path";
import { generate } from "../src/generate";
import { NgTarget } from "../src/target-profile";

const yasagRoot = path.join(__dirname, "..");
const fixture = path.join(__dirname, "fixtures", "openapi3.yaml");
const dirs: string[] = [];

function gen(target: NgTarget): { out: string; tree: string } {
  const out = path.join(yasagRoot, `.sig-${target}`);
  dirs.push(out);
  fs.rmSync(out, { recursive: true, force: true });
  generate(
    fixture,
    out,
    true,
    false,
    undefined,
    false,
    false,
    undefined,
    false,
    false,
    "",
    undefined,
    true,
    target,
  );
  const walk = (d: string): string[] =>
    fs
      .readdirSync(d, { withFileTypes: true })
      .flatMap((e) =>
        e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)],
      );
  const tree = walk(out)
    .filter((p) => p.endsWith(".ts"))
    .map((p) => fs.readFileSync(p, "utf8"))
    .join("\n");
  return { out, tree };
}

after(() =>
  dirs.forEach((d) => fs.rmSync(d, { recursive: true, force: true })),
);

describe("signals + httpResource per target", () => {
  it("ng22 abstract form services expose state as signals (toSignal)", () => {
    assert.match(gen("ng22").tree, /toSignal\(/);
  });

  it("ng22 emits signal resource readers for GET, delegating to the Observable method (additive)", () => {
    const { out } = gen("ng22");
    const ctrl = fs.readFileSync(
      path.join(out, "controllers", "Pets.ts"),
      "utf8",
    );
    assert.match(ctrl, /rxResource\(/);
    // GET getPet -> a resource reader; POST createPet -> NOT a resource
    assert.match(ctrl, /getPetResource\(/);
    // the reader delegates to the existing Observable method (no duplicated request logic)
    assert.match(ctrl, /stream: \(\{ params \}\) => this\.getPet\(params\)/);
    assert.doesNotMatch(ctrl, /createPetResource/);
    // additive: the original Observable method is preserved, not replaced
    assert.match(ctrl, /getPet\(params: GetPetParams[^)]*\): Observable</);
  });

  it("ng16 emits neither toSignal nor resource readers", () => {
    const { tree } = gen("ng16");
    assert.doesNotMatch(tree, /toSignal\(/);
    assert.doesNotMatch(tree, /rxResource\(/);
    assert.doesNotMatch(tree, /Resource\(/);
  });
});

import { expect, test } from "vitest";
import { modelsToTests } from "./tester";
import { compile } from "./tests_helpers";
import { symbolsToModels, nodesToString } from "./compile";

function process(code: string): string {
  const [checker, symbols] = compile(code);
  const models = symbolsToModels(checker, symbols);
  const nodes = modelsToTests("guards.ts", models);
  return nodesToString("guards.tests.ts", nodes);
}

test("primitive", () => {
  expect(process("export type X = number")).toMatchSnapshot();
});

test("array", () => {
  expect(process("export type X = string[]")).toMatchSnapshot();
});

test("object", () => {
  expect(
    process("export type X = { a: string, b: number, c: boolean }")
  ).toMatchSnapshot();
});

test("object with optional attributes", () => {
  expect(
    process("export type X = { a: 1, b?: 2, c: 3, d?: 4 }")
  ).toMatchSnapshot();
});

test("union", () => {
  expect(
    process("export type X = string | number")
  ).toMatchSnapshot();
});

test("multiple types", () => {
  expect(
    process(`
      export type X = string | number
      export type Y = boolean | null
      `)
  ).toMatchSnapshot();
});

test("reference type", () => {
  expect(
    process(`
      export type A = { a: string }
      export type B = { b: A }
      `)
  ).toMatchSnapshot();
});

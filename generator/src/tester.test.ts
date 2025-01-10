import { expect, test } from "vitest";
import { hydrateInvalidValueToken, modelsToTests } from "./tester";
import { compile, printNodes } from "./tests_helpers";
import { symbolsToModels } from "./compile";

function process(code: string): string {
  const [checker, symbols] = compile(code);
  const models = symbolsToModels(checker, symbols);

  return hydrateInvalidValueToken(
    printNodes(modelsToTests("guards.ts", models))
  );
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

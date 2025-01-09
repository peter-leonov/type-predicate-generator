import { expect, test } from "vitest";
import { hydrateInvalidValueToken, modelToTests } from "./tester";
import { typeToModel } from "./model";
import { compile, printNodes } from "./tests_helpers";

function process(code: string): string {
  return hydrateInvalidValueToken(
    printNodes(
      modelToTests(
        "./types_guards",
        "TestType",
        typeToModel(...compile(code))
      )
    )
  );
}

test("primitive", () => {
  expect(process("type X = number")).toMatchSnapshot();
});

test("array", () => {
  expect(process("type X = string[]")).toMatchSnapshot();
});

test("object", () => {
  expect(
    process("type X = { a: string, b: number, c: boolean }")
  ).toMatchSnapshot();
});

test("union", () => {
  expect(process("type X = string | number")).toMatchSnapshot();
});

import { expect, test } from "vitest";
import {
  hydrateInvalidValueToken,
  modelsToTests,
  modelToTests,
} from "./tester";
import { typeToModel, type TypeModel } from "./model";
import { compile, printNodes } from "./tests_helpers";

function processType(code: string): string {
  return hydrateInvalidValueToken(
    printNodes(
      modelToTests(
        "TestType",
        "isTestType",
        typeToModel(...compile(code))
      )
    )
  );
}

function processTypes(codes: string[]): string {
  const types: Record<string, TypeModel> = {};
  let i = 0;
  for (const code of codes) {
    types[`Type${++i}`] = typeToModel(...compile(code));
  }

  return hydrateInvalidValueToken(
    printNodes(modelsToTests("TestType", types))
  );
}

test("primitive", () => {
  expect(processType("export type X = number")).toMatchSnapshot();
});

test("array", () => {
  expect(processType("export type X = string[]")).toMatchSnapshot();
});

test("object", () => {
  expect(
    processType(
      "export type X = { a: string, b: number, c: boolean }"
    )
  ).toMatchSnapshot();
});

test("union", () => {
  expect(
    processType("export type X = string | number")
  ).toMatchSnapshot();
});

test("multiple types", () => {
  expect(
    processTypes([
      "export type X = string | number",
      "export type Y = boolean | null",
    ])
  ).toMatchSnapshot();
});

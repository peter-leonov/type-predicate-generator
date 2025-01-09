import { expect, test } from "vitest";
import { modelToTests } from "./tester";
import { typeToModel } from "./model";
import { compile, printNodes } from "./tests_helpers";

function process(code: string): string {
  return printNodes(
    modelToTests(
      "./types_guards",
      "TestType",
      typeToModel(...compile(code))
    )
  );
}

test("primitive type", () => {
  expect(process("type X = number")).toMatchSnapshot();
});

import { expect, test } from "vitest";
import { TypeGuardGenerator } from "./generator.mts";
import {
  LiteralType,
  ObjectType,
  PrimitiveType,
  TypeModel,
} from "./model.mts";
import { printNodes } from "./tests_helpers.mts";

export function generate(model: TypeModel): string {
  const tgg = new TypeGuardGenerator();
  tgg.addTypeGuardFor(model);
  return printNodes(tgg.getGuards());
}

test("undefined", () => {
  expect(
    generate(new LiteralType({ aliasName: "X" }, undefined))
  ).toMatchSnapshot();
});

test("null", () => {
  expect(
    generate(new LiteralType({ aliasName: "X" }, null))
  ).toMatchSnapshot();
});

test("object with primitive types", () => {
  expect(
    generate(
      new ObjectType(
        { aliasName: "X" },
        {
          a: new PrimitiveType({}, "number"),
          b: new PrimitiveType({}, "string"),
          c: new PrimitiveType({}, "boolean"),
        }
      )
    )
  ).toMatchSnapshot();
});

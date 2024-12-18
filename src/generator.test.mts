import { expect, test } from "vitest";
import { TypeGuardGenerator } from "./generator.mts";
import {
  LiteralType,
  ObjectType,
  PrimitiveType,
  ReferenceType,
  TypeModel,
  UnionType,
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

test("union of primitive and literal types", () => {
  expect(
    generate(
      new UnionType({ aliasName: "Union" }, [
        new PrimitiveType({}, "string"),
        new PrimitiveType({}, "number"),
        new LiteralType({}, null),
      ])
    )
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

test("reference type in an object", () => {
  expect(
    generate(
      new ObjectType(
        { aliasName: "X" },
        {
          a: new ReferenceType({ aliasName: "A" }, "A"),
          b: new ReferenceType({ aliasName: "B" }, "B"),
        }
      )
    )
  ).toMatchSnapshot();
});

test("reference type in a union", () => {
  expect(
    generate(
      new UnionType({ aliasName: "X" }, [
        new PrimitiveType({}, "number"),
        new ReferenceType({ aliasName: "A" }, "A"),
      ])
    )
  ).toMatchSnapshot();
});

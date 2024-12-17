import { expect, test } from "vitest";
import { TypeGuardGenerator } from "./generator.mts";
import { LiteralType, ObjectType, PrimitiveType } from "./model.mts";
import { printNodes } from "./tests_helpers.mts";

test("null", () => {
  const tgg = new TypeGuardGenerator();
  tgg.addTypeGuardFor(new LiteralType({ aliasName: "X" }, null));
  expect(printNodes(tgg.getGuards())).toMatchSnapshot();
});

test("object with primitive types", () => {
  const tgg = new TypeGuardGenerator();
  tgg.addTypeGuardFor(
    new ObjectType(
      { aliasName: "X" },
      {
        a: new PrimitiveType({}, "number"),
        b: new PrimitiveType({}, "string"),
        c: new PrimitiveType({}, "boolean"),
      }
    )
  );
  expect(printNodes(tgg.getGuards())).toMatchSnapshot();
});

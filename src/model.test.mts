import { expect, test } from "vitest";
import { compile } from "./tests_helpers.mts";

test("empty object", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = {
        }
      `)
    )
  ).toEqual(
    new ObjectType({ isOptional: false, aliasName: "X" }, {})
  );
});

test("simple object", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = {
          a: number
        }
      `)
    )
  ).toEqual(
    new ObjectType(
      { isOptional: false, aliasName: "X" },
      {
        a: new PrimitiveType(
          { isOptional: false, aliasName: undefined },
          "number"
        ),
      }
    )
  );
});

test("non nested object", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = {
          a: number
          b: string
          c: boolean
        }
      `)
    )
  ).toEqual(
    new ObjectType(
      { isOptional: false, aliasName: "X" },
      {
        a: new PrimitiveType(
          { isOptional: false, aliasName: undefined },
          "number"
        ),
        b: new PrimitiveType(
          { isOptional: false, aliasName: undefined },
          "string"
        ),
        c: new PrimitiveType(
          { isOptional: false, aliasName: undefined },
          "boolean"
        ),
      }
    )
  );
});

import { expect, test } from "vitest";
import {
  typeToModel,
  ObjectType,
  PrimitiveType,
  LiteralType,
  UnionType,
} from "./model.mts";
import { compile } from "./tests_helpers.mts";

test("empty object", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = {
        }
      `)
    )
  ).toEqual(new ObjectType({ aliasName: "X" }, {}));
});

test("object with optional and non-optional props", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = {
          a: number
          b?: number
          c: number
          d?: number
        }
      `)
    )
  ).toEqual(
    new ObjectType(
      { aliasName: "X" },
      {
        a: new PrimitiveType({}, "number"),
        b: new PrimitiveType({ isOptional: true }, "number"),
        c: new PrimitiveType({}, "number"),
        d: new PrimitiveType({ isOptional: true }, "number"),
      }
    )
  );
});

test("object with primitive types", () => {
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
      { aliasName: "X" },
      {
        a: new PrimitiveType({}, "number"),
        b: new PrimitiveType({}, "string"),
        c: new PrimitiveType({}, "boolean"),
      }
    )
  );
});

test("nested object", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = {
          a: {
            b: {
              c: string
            }
          }
        }
      `)
    )
  ).toEqual(
    new ObjectType(
      { aliasName: "X" },
      {
        a: new ObjectType(
          {},
          {
            b: new ObjectType(
              {},
              {
                c: new PrimitiveType({}, "string"),
              }
            ),
          }
        ),
      }
    )
  );
});

test("object with literal types", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = {
          a: 1
          b: 'foo'
          c: true
        }
      `)
    )
  ).toEqual(
    new ObjectType(
      { aliasName: "X" },
      {
        a: new LiteralType({}, 1),
        b: new LiteralType({}, "foo"),
        c: new LiteralType({}, true),
      }
    )
  );
});

test("object with a union type", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = {
          a: 1 | 2
        }
      `)
    )
  ).toEqual(
    new ObjectType(
      { aliasName: "X" },
      {
        a: new UnionType({}, [
          new LiteralType({}, 1),
          new LiteralType({}, 2),
        ]),
      }
    )
  );
});

test("object with a complex union type", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = {
          a: string | 2 | false | { b: string }
        }
      `)
    )
  ).toEqual(
    new ObjectType(
      { aliasName: "X" },
      {
        a: new UnionType({}, [
          new PrimitiveType({}, "string"),
          new LiteralType({}, false),
          new LiteralType({}, 2),
          new ObjectType({}, { b: new PrimitiveType({}, "string") }),
        ]),
      }
    )
  );
});

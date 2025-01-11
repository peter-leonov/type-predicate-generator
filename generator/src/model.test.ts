import { assert, expect, test } from "vitest";
import {
  ObjectType,
  PrimitiveType,
  LiteralType,
  UnionType,
  AliasType,
  ArrayType,
  type TypeModel,
} from "./model";
import { compile } from "./tests_helpers";
import { UnsupportedEmptyEnum } from "./errors";
import { symbolsToModels } from "./compile";

function process(code: string): TypeModel {
  const [checker, symbols] = compile(code);
  const models = symbolsToModels(checker, symbols);
  const model = models[0];
  assert(model, "there should be at least one model");
  return model;
}

test("undefined", () => {
  expect(
    process(`
        export type X = undefined
      `)
  ).toEqual(new LiteralType({ aliasName: "X" }, undefined));
});

test("null", () => {
  expect(
    process(`
        export type X = null
      `)
  ).toEqual(new LiteralType({ aliasName: "X" }, null));
});

test("true", () => {
  expect(
    process(`
        export type X = true
      `)
  ).toEqual(new LiteralType({ aliasName: "X" }, true));
});

test("false", () => {
  expect(
    process(`
        export type X = false
      `)
  ).toEqual(new LiteralType({ aliasName: "X" }, false));
});

test("1", () => {
  expect(
    process(`
        export type X = 1
      `)
  ).toEqual(new LiteralType({ aliasName: "X" }, 1));
});

test('"foo"', () => {
  expect(
    process(`
        export type X = "foo"
      `)
  ).toEqual(new LiteralType({ aliasName: "X" }, "foo"));
});

test("number", () => {
  expect(
    process(`
        export type X = number
      `)
  ).toEqual(new PrimitiveType({ aliasName: "X" }, "number"));
});

test("string", () => {
  expect(
    process(`
        export type X = string
      `)
  ).toEqual(new PrimitiveType({ aliasName: "X" }, "string"));
});

test("boolean", () => {
  expect(
    process(`
        export type X = boolean
      `)
  ).toEqual(new PrimitiveType({ aliasName: "X" }, "boolean"));
});

test("union of primitive types", () => {
  expect(
    process(`
        export type X = number | string
      `)
  ).toEqual(
    new UnionType({ aliasName: "X" }, [
      new PrimitiveType({}, "string"),
      new PrimitiveType({}, "number"),
    ])
  );
});

test("union of literal types", () => {
  expect(
    process(`
        export type X = "a" | "b"
      `)
  ).toEqual(
    new UnionType({ aliasName: "X" }, [
      new LiteralType({}, "a"),
      new LiteralType({}, "b"),
    ])
  );
});

test("union of true and false", () => {
  expect(
    process(`
        export type X = true | false
      `)
  ).toEqual(new PrimitiveType({ aliasName: "X" }, "boolean"));
});

test("a nested union", () => {
  expect(
    process(`
        export type X = 1 | (2 | (3 | 4))
      `)
  ).toEqual(
    new UnionType({ aliasName: "X" }, [
      new LiteralType({}, 3),
      new LiteralType({}, 4),
      new LiteralType({}, 2),
      new LiteralType({}, 1),
    ])
  );
});

test("nullable string", () => {
  expect(
    process(`
        export type X = string | null | undefined
      `)
  ).toEqual(
    new UnionType({ aliasName: "X" }, [
      new LiteralType({}, undefined),
      new LiteralType({}, null),
      new PrimitiveType({}, "string"),
    ])
  );
});

test("union of different object types", () => {
  expect(
    process(`
        export type X = { a: string } | { b: number }
      `)
  ).toEqual(
    new UnionType({ aliasName: "X" }, [
      new ObjectType(
        {},
        {
          a: new PrimitiveType({}, "string"),
        }
      ),
      new ObjectType(
        {},
        {
          b: new PrimitiveType({}, "number"),
        }
      ),
    ])
  );
});

test("union of same object types", () => {
  expect(
    process(`
        export type X = { a: string } | { a: string }
      `)
  ).toEqual(
    new UnionType({ aliasName: "X" }, [
      new ObjectType(
        {},
        {
          a: new PrimitiveType({}, "string"),
        }
      ),
      new ObjectType(
        {},
        {
          a: new PrimitiveType({}, "string"),
        }
      ),
    ])
  );
});

test("simple interface", () => {
  expect(
    process(`
        export interface X {
          a: string
        }
      `)
  ).toEqual(
    new ObjectType(
      { aliasName: "X" },
      {
        a: new PrimitiveType({}, "string"),
      }
    )
  );
});

test("empty enum", () => {
  expect(() =>
    process(`
      export enum X {}
      `)
  ).toThrow(UnsupportedEmptyEnum);
});

test("numeric enum", () => {
  expect(
    process(`
      export enum X {
          a = 7,
          b,
          c
      }
      `)
  ).toEqual(
    new UnionType({ aliasName: "X" }, [
      new LiteralType({}, 7),
      new LiteralType({}, 8),
      new LiteralType({}, 9),
    ])
  );
});

test("string enum", () => {
  expect(
    process(`
      export enum X {
          a = "A",
          b = "B",
          c = "C"
      }
      `)
  ).toEqual(
    new UnionType({ aliasName: "X" }, [
      new LiteralType({}, "A"),
      new LiteralType({}, "B"),
      new LiteralType({}, "C"),
    ])
  );
});

test("mixed enum", () => {
  expect(
    process(`
      export enum X {
          a = 5,
          b,
          c = "C"
      }
      `)
  ).toEqual(
    new UnionType({ aliasName: "X" }, [
      new LiteralType({}, 5),
      new LiteralType({}, 6),
      new LiteralType({}, "C"),
    ])
  );
});

test("empty object", () => {
  expect(
    process(`
        export type X = {
        }
      `)
  ).toEqual(new ObjectType({ aliasName: "X" }, {}));
});

test("object with optional and non-optional props", () => {
  expect(
    process(`
        export type X = {
          a: number
          b?: number
          c: number
          d?: number
        }
      `)
  ).toEqual(
    new ObjectType(
      { aliasName: "X" },
      {
        a: new PrimitiveType({}, "number"),
        b: new UnionType({ isOptional: true }, [
          new LiteralType({}, undefined),
          new PrimitiveType({}, "number"),
        ]),
        c: new PrimitiveType({}, "number"),
        d: new UnionType({ isOptional: true }, [
          new LiteralType({}, undefined),
          new PrimitiveType({}, "number"),
        ]),
      },
      new Set(["b", "d"])
    )
  );
});

test("object with primitive types", () => {
  expect(
    process(`
        export type X = {
          a: number
          b: string
          c: boolean
          d: null
          e: undefined
        }
      `)
  ).toEqual(
    new ObjectType(
      { aliasName: "X" },
      {
        a: new PrimitiveType({}, "number"),
        b: new PrimitiveType({}, "string"),
        c: new PrimitiveType({}, "boolean"),
        d: new LiteralType({}, null),
        e: new LiteralType({}, undefined),
      }
    )
  );
});

test("object with optional attributes", () => {
  expect(
    process(`
        export type X = {
          a: 1
          b?: 2
          c: 3
          d?: 4
        }
      `)
  ).toEqual(
    new ObjectType(
      { aliasName: "X" },
      {
        a: new LiteralType({}, 1),
        b: new UnionType({ isOptional: true }, [
          new LiteralType({}, undefined),
          new LiteralType({}, 2),
        ]),
        c: new LiteralType({}, 3),
        d: new UnionType({ isOptional: true }, [
          new LiteralType({}, undefined),
          new LiteralType({}, 4),
        ]),
      },
      new Set(["b", "d"])
    )
  );
});

test("nested object", () => {
  expect(
    process(`
        export type X = {
          a: {
            b: {
              c: string
            }
          }
        }
      `)
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
    process(`
        export type X = {
          a: 1
          b: 'foo'
          c: true
        }
      `)
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
    process(`
        export type X = {
          a: 1 | 2
        }
      `)
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
    process(`
        export type X = {
          a: string | 2 | false | { b: string }
        }
      `)
  ).toEqual(
    new ObjectType(
      { aliasName: "X" },
      {
        a: new UnionType({}, [
          new PrimitiveType({}, "string"),
          new LiteralType({}, false),
          new ObjectType({}, { b: new PrimitiveType({}, "string") }),
          new LiteralType({}, 2),
        ]),
      }
    )
  );
});

test("trivial existing type alias", () => {
  expect(
    process(`
        type Y = 1
        export type X = Y
      `)
  ).toEqual(new LiteralType({ aliasName: "X" }, 1));
});

test("reference type in a union", () => {
  expect(
    process(`
        type A = { a: 1 }
        export type X = number | A
      `)
  ).toEqual(
    new UnionType({ aliasName: "X" }, [
      new PrimitiveType({}, "number"),
      new AliasType({ aliasName: "A" }, "A"),
    ])
  );
});

test("reference type in an object", () => {
  expect(
    process(`
        type A = { a: 1 }
        type B = { b: 2 }
        export type X = {
          a: A,
          b: B
        }
      `)
  ).toEqual(
    new ObjectType(
      { aliasName: "X" },
      {
        a: new AliasType({ aliasName: "A" }, "A"),
        b: new AliasType({ aliasName: "B" }, "B"),
      }
    )
  );
});

test("array of a primitive type", () => {
  expect(
    process(`
        export type X = Array<number>
      `)
  ).toEqual(
    new ArrayType({ aliasName: "X" }, new PrimitiveType({}, "number"))
  );

  expect(
    process(`
        export type X = number[]
      `)
  ).toEqual(
    new ArrayType({ aliasName: "X" }, new PrimitiveType({}, "number"))
  );
});

test("nested arrays of a primitive type", () => {
  expect(
    process(`
        export type X = number[][][]
      `)
  ).toEqual(
    new ArrayType(
      { aliasName: "X" },
      new ArrayType(
        {},
        new ArrayType({}, new PrimitiveType({}, "number"))
      )
    )
  );
});

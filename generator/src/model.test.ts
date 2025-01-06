import { expect, test } from "vitest";
import {
  typeToModel,
  ObjectType,
  PrimitiveType,
  LiteralType,
  UnionType,
  AliasType,
  ArrayType,
} from "./model";
import { compile } from "./tests_helpers";

test("undefined", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = undefined
      `)
    )
  ).toEqual(new LiteralType({ aliasName: "X" }, undefined));
});

test("null", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = null
      `)
    )
  ).toEqual(new LiteralType({ aliasName: "X" }, null));
});

test("true", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = true
      `)
    )
  ).toEqual(new LiteralType({ aliasName: "X" }, true));
});

test("false", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = false
      `)
    )
  ).toEqual(new LiteralType({ aliasName: "X" }, false));
});

test("1", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = 1
      `)
    )
  ).toEqual(new LiteralType({ aliasName: "X" }, 1));
});

test('"foo"', () => {
  expect(
    typeToModel(
      ...compile(`
        type X = "foo"
      `)
    )
  ).toEqual(new LiteralType({ aliasName: "X" }, "foo"));
});

test("number", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = number
      `)
    )
  ).toEqual(new PrimitiveType({ aliasName: "X" }, "number"));
});

test("string", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = string
      `)
    )
  ).toEqual(new PrimitiveType({ aliasName: "X" }, "string"));
});

test("boolean", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = boolean
      `)
    )
  ).toEqual(new PrimitiveType({ aliasName: "X" }, "boolean"));
});

test("union of primitive types", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = number | string
      `)
    )
  ).toEqual(
    new UnionType({ aliasName: "X" }, [
      new PrimitiveType({}, "string"),
      new PrimitiveType({}, "number"),
    ])
  );
});

test("union of literal types", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = "a" | "b"
      `)
    )
  ).toEqual(
    new UnionType({ aliasName: "X" }, [
      new LiteralType({}, "a"),
      new LiteralType({}, "b"),
    ])
  );
});

test("union of true and false", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = true | false
      `)
    )
  ).toEqual(new PrimitiveType({ aliasName: "X" }, "boolean"));
});

test("a nested union", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = 1 | (2 | (3 | 4))
      `)
    )
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
    typeToModel(
      ...compile(`
        type X = string | null | undefined
      `)
    )
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
    typeToModel(
      ...compile(`
        type X = { a: string } | { b: number }
      `)
    )
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
    typeToModel(
      ...compile(`
        type X = { a: string } | { a: string }
      `)
    )
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
    typeToModel(
      ...compile(`
        interface X {
          a: string
        }
      `)
    )
  ).toEqual(
    new ObjectType(
      { aliasName: "X" },
      {
        a: new PrimitiveType({}, "string"),
      }
    )
  );
});

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
        b: new UnionType({ isOptional: true }, [
          new LiteralType({}, undefined),
          new PrimitiveType({}, "number"),
        ]),
        c: new PrimitiveType({}, "number"),
        d: new UnionType({ isOptional: true }, [
          new LiteralType({}, undefined),
          new PrimitiveType({}, "number"),
        ]),
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
          d: null
          e: undefined
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
        d: new LiteralType({}, null),
        e: new LiteralType({}, undefined),
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
          new ObjectType({}, { b: new PrimitiveType({}, "string") }),
          new LiteralType({}, 2),
        ]),
      }
    )
  );
});

test("trivial existing type alias", () => {
  expect(
    typeToModel(
      ...compile(`
        type Y = 1
        type X = Y
      `)
    )
  ).toEqual(new LiteralType({ aliasName: "X" }, 1));
});

test("reference type in a union", () => {
  expect(
    typeToModel(
      ...compile(`
        type A = { a: 1 }
        type X = number | A
      `)
    )
  ).toEqual(
    new UnionType({ aliasName: "X" }, [
      new PrimitiveType({}, "number"),
      new AliasType({ aliasName: "A" }, "A"),
    ])
  );
});

test("reference type in an object", () => {
  expect(
    typeToModel(
      ...compile(`
        type A = { a: 1 }
        type B = { b: 2 }
        type X = {
          a: A,
          b: B
        }
      `)
    )
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
    typeToModel(
      ...compile(`
        type X = Array<number>
      `)
    )
  ).toEqual(
    new ArrayType({ aliasName: "X" }, new PrimitiveType({}, "number"))
  );

  expect(
    typeToModel(
      ...compile(`
        type X = number[]
      `)
    )
  ).toEqual(
    new ArrayType({ aliasName: "X" }, new PrimitiveType({}, "number"))
  );
});

test("nested arrays of a primitive type", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = number[][][]
      `)
    )
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

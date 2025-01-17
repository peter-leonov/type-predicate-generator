import { expect, test } from "vitest";
import { TypeGuardGenerator } from "./generator.js";
import {
  ArrayType,
  LiteralType,
  ObjectType,
  PrimitiveType,
  AliasType,
  TypeModel,
  UnionType,
} from "./model.js";
import {
  MissingExportedType,
  UnsupportedUnionMember,
} from "./errors.js";
import { nodesToString } from "./compile.js";

export function generate(model: TypeModel): string {
  const tgg = new TypeGuardGenerator();
  tgg.addRootTypeGuardFor(model);
  return nodesToString("guards.ts", tgg.getGuards());
}

export function generateAll(models: TypeModel[]): string {
  const tgg = new TypeGuardGenerator();
  for (const model of models) {
    tgg.addRootTypeGuardFor(model);
  }
  return nodesToString(
    "./guards.ts",
    tgg.getFullFileBody("./guards.ts")
  );
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

test("empty object", () => {
  expect(
    generate(new ObjectType({ aliasName: "X" }, {}))
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

test("union of literal types", () => {
  expect(
    generate(
      new UnionType({ aliasName: "X" }, [
        new LiteralType({}, "a"),
        new LiteralType({}, "b"),
        new LiteralType({}, 1),
        new LiteralType({}, 2),
        new LiteralType({}, true),
        new LiteralType({}, false),
        new LiteralType({}, null),
        new LiteralType({}, undefined),
      ])
    )
  ).toMatchSnapshot();
});

test("union of mixed safe types", () => {
  expect(
    generate(
      new UnionType({ aliasName: "X" }, [
        new PrimitiveType({}, "number"),
        new LiteralType({}, "a"),
        new LiteralType({}, true),
      ])
    )
  ).toMatchSnapshot();
});

test("union of object types", () => {
  expect(() =>
    generate(
      new UnionType({ aliasName: "Union" }, [
        new ObjectType({}, { a: new PrimitiveType({}, "number") }),
        new ObjectType({}, { b: new PrimitiveType({}, "string") }),
      ])
    )
  ).toThrow(UnsupportedUnionMember);
});

test("union of object and safe union types", () => {
  expect(
    generate(
      new UnionType({ aliasName: "Union" }, [
        new ObjectType({}, { a: new PrimitiveType({}, "number") }),
        new LiteralType({}, 1),
        new PrimitiveType({}, "string"),
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
          a: new AliasType({ aliasName: "A" }, "A"),
          b: new AliasType({ aliasName: "B" }, "B"),
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
        new AliasType({ aliasName: "A" }, "A"),
      ])
    )
  ).toMatchSnapshot();
});

test("nested object", () => {
  expect(
    generate(
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
    )
  ).toMatchSnapshot();
});

test("array of a primitive type", () => {
  expect(
    generate(
      new ArrayType(
        { aliasName: "X" },
        new PrimitiveType({}, "number")
      )
    )
  ).toMatchSnapshot();
});

test("array of a primitive type union", () => {
  expect(
    generate(
      new ArrayType(
        { aliasName: "X" },
        new UnionType({}, [
          new PrimitiveType({}, "number"),
          new PrimitiveType({}, "string"),
        ])
      )
    )
  ).toMatchSnapshot();
});

test("array of an object type", () => {
  expect(
    generate(
      new ArrayType(
        { aliasName: "X" },
        new ObjectType(
          {},
          {
            a: new PrimitiveType({}, "number"),
            b: new PrimitiveType({}, "string"),
          }
        )
      )
    )
  ).toMatchSnapshot();
});

test("two arrays of a primitive type", () => {
  expect(
    generate(
      new ObjectType(
        { aliasName: "X" },
        {
          a: new ArrayType({}, new PrimitiveType({}, "number")),
          b: new ArrayType({}, new PrimitiveType({}, "string")),
        }
      )
    )
  ).toMatchSnapshot();
});

test("nested arrays of a primitive type", () => {
  expect(
    generate(
      new ArrayType(
        { aliasName: "X" },
        new ArrayType(
          {},
          new ArrayType({}, new PrimitiveType({}, "number"))
        )
      )
    )
  ).toMatchSnapshot();
});

test("no models", () => {
  expect(generateAll([])).toMatchSnapshot();
});

test("only object", () => {
  expect(
    generateAll([new ObjectType({ aliasName: "X" }, {})])
  ).toMatchSnapshot();
});

test("only array", () => {
  expect(
    generateAll([
      new ArrayType(
        { aliasName: "X" },
        new PrimitiveType({}, "string")
      ),
    ])
  ).toMatchSnapshot();
});

test("both object and array", () => {
  expect(
    generateAll([
      new ArrayType({ aliasName: "X" }, new ObjectType({}, {})),
    ])
  ).toMatchSnapshot();
});

test("dangling reference type", () => {
  expect(() =>
    generateAll([
      new ArrayType({ aliasName: "X" }, new AliasType({}, "Missing")),
    ])
  ).toThrow(MissingExportedType);

  expect(() =>
    generateAll([
      new ArrayType({ aliasName: "X" }, new AliasType({}, "Missing")),
    ])
  ).toThrow("Missing is referenced in X");

  expect(() =>
    generateAll([
      new ObjectType(
        { aliasName: "X" },
        { a: new AliasType({}, "Missing") }
      ),
    ])
  ).toThrow("Missing is referenced in X");
});

test("multiple reference types", () => {
  expect(
    generateAll([
      new ArrayType({ aliasName: "A" }, new AliasType({}, "B")),
      new ArrayType({ aliasName: "B" }, new AliasType({}, "C")),
      new ArrayType({ aliasName: "C" }, new AliasType({}, "D")),
      new ArrayType(
        { aliasName: "D" },
        new PrimitiveType({}, "boolean")
      ),
    ])
  ).toMatchSnapshot();
});

test("refression: don't require top level predicates for nested predicate types ", () => {
  expect(
    generateAll([
      new ObjectType(
        { aliasName: "X" },
        {
          a: new ArrayType({}, new LiteralType({}, "foo")),
        }
      ),
    ])
  ).toMatchSnapshot();

  expect(
    generateAll([
      new ObjectType(
        { aliasName: "X" },
        {
          a: new UnionType({}, [
            new ObjectType({}, { b: new LiteralType({}, "B") }),
            new LiteralType({}, "undefined"),
          ]),
        },
        new Set(["a"])
      ),
    ])
  ).toMatchSnapshot();
});

test("regression: empty object does not use SafeShallowShape", () => {
  expect(
    generateAll([new ObjectType({ aliasName: "X" }, {})])
  ).toMatchSnapshot();
});

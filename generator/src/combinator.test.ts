import { expect, describe, it } from "vitest";
import {
  array,
  combineInvalid,
  combineValid,
  modelToCombinator,
  object,
  union,
  value,
  ValueGenerator,
  type Value,
} from "./combinator";
import {
  AliasType,
  ArrayType,
  LiteralType,
  ObjectType,
  PrimitiveType,
  UnionType,
} from "./model";

const stringified = new Map<unknown, string>();
function stringifyCombination(value: unknown): string {
  const cached = stringified.get(value);
  if (cached != undefined) {
    return cached;
  }
  const res = JSON.stringify(value, (_, v) => {
    return typeof v == "symbol" ? String(v) : v;
  });
  stringified.set(value, res);
  return res;
}

function compareCombinations(a: unknown, b: unknown) {
  return stringifyCombination(a) < stringifyCombination(b) ? -1 : 0;
}

function sort(combinations: unknown[]) {
  return combinations.sort(compareCombinations);
}

function valid(v: ValueGenerator<Value>) {
  return sort(combineValid(v));
}

function invalid(v: ValueGenerator<Value>) {
  return sort(combineInvalid(v));
}

for (const [name, f] of [
  ["valid", valid] as const,
  ["invalid", invalid] as const,
]) {
  describe(name, () => {
    it("all at once", () => {
      const obj = object<Value>({
        a: union([value(1), value(2)]),
        b: union([value(true), value(false)]),
        c: array(union([value("a"), value("b")])),
        d: object({
          d2: union([value(null), value(undefined)]),
        }),
      });

      expect(f(obj)).toMatchSnapshot();
    });

    describe("value", () => {
      it("number", () => {
        expect(f(value(1))).toMatchSnapshot();
      });
      it("string", () => {
        expect(f(value("a"))).toMatchSnapshot();
      });
      it("null", () => {
        expect(f(value(null))).toMatchSnapshot();
      });
    });

    describe("union", () => {
      it("of a single value", () => {
        expect(f(union([value(1)]))).toMatchSnapshot();
      });

      it("of several values", () => {
        expect(
          f(union([value(1), value(2), value(3)]))
        ).toMatchSnapshot();
      });

      it("of a union", () => {
        expect(
          f(union([union([value(1), value(2), value(3)])]))
        ).toMatchSnapshot();
      });

      it("of unions", () => {
        expect(
          f(
            union([
              union([value(1), value(2)]),
              union([value(3), value(4)]),
            ])
          )
        ).toMatchSnapshot();
      });
    });

    describe("array", () => {
      it("of a single value", () => {
        expect(f(array(value(1)))).toMatchSnapshot();
      });

      it("of a union", () => {
        expect(
          f(array(union([value(1), value(2)])))
        ).toMatchSnapshot();
      });

      it("of an array of an array of a value", () => {
        expect(f(array(array(array(value(1)))))).toMatchSnapshot();
      });

      it("of an array of an array of a union", () => {
        expect(
          f(array(array(array(union([value(1), value(2)])))))
        ).toMatchSnapshot();
      });
    });

    describe("object", () => {
      it("empty", () => {
        expect(f(object({}))).toMatchSnapshot();
      });

      it("of a single value property", () => {
        expect(f(object({ a: value("A") }))).toMatchSnapshot();
      });

      it("of a several value properties", () => {
        expect(
          f(object({ a: value("A"), b: value("B"), c: value("C") }))
        ).toMatchSnapshot();
      });

      it("of a single union property", () => {
        expect(
          f(object({ a: union([value("A1"), value("A2")]) }))
        ).toMatchSnapshot();
      });

      it("of a several union properties", () => {
        expect(
          f(
            object({
              a: union([value("A1")]),
              b: union([value("B1"), value("B2")]),
              c: union([value("C1"), value("C2"), value("C3")]),
            })
          )
        ).toMatchSnapshot();
      });

      it("of a several objects with value properties", () => {
        expect(
          f(
            object({
              a: object({ a1: value("A1"), a2: value("A2") }),
              b: object({ b1: value("B1"), b2: value("B2") }),
              c: object({ c1: value("C1"), c2: value("C2") }),
            })
          )
        ).toMatchSnapshot();
      });

      it("of a several objects with union properties", () => {
        expect(
          f(
            object({
              a: object({ aa: union([value("AA1"), value("AA2")]) }),
              b: object({ bb: union([value("BB1"), value("BB2")]) }),
              c: object({ cc: union([value("CC1"), value("CC2")]) }),
            })
          )
        ).toMatchSnapshot();
      });

      it("of a several nested objects with a value property", () => {
        expect(
          f(
            object({
              a: object({
                b: object({ c: object({ d: value("D") }) }),
              }),
            })
          )
        ).toMatchSnapshot();
      });

      it("of a several nested objects with a union property", () => {
        expect(
          f(
            object({
              a: object({
                b: object({
                  c: object({ d: union([value("D1"), value("D2")]) }),
                }),
              }),
            })
          )
        ).toMatchSnapshot();
      });
    });
  });
}

describe(modelToCombinator.name, () => {
  describe("LiteralType", () => {
    it("undefined", () => {
      expect(
        combineValid(
          modelToCombinator(new LiteralType({}, undefined))
        )
      ).toMatchInlineSnapshot(`
        [
          undefined,
        ]
      `);
    });
    it("null", () => {
      expect(
        combineValid(modelToCombinator(new LiteralType({}, null)))
      ).toMatchInlineSnapshot(`
        [
          null,
        ]
      `);
    });
    it("string", () => {
      expect(
        combineValid(modelToCombinator(new LiteralType({}, "foo")))
      ).toMatchInlineSnapshot(`
        [
          "foo",
        ]
      `);
    });
    it("number", () => {
      expect(combineValid(modelToCombinator(new LiteralType({}, 42))))
        .toMatchInlineSnapshot(`
        [
          42,
        ]
      `);
    });
    it("boolean", () => {
      expect(
        combineValid(modelToCombinator(new LiteralType({}, true)))
      ).toMatchInlineSnapshot(`
        [
          true,
        ]
      `);
      expect(
        combineValid(modelToCombinator(new LiteralType({}, false)))
      ).toMatchInlineSnapshot(`
        [
          false,
        ]
      `);
    });
  });

  describe("PrimitiveType", () => {
    it("string", () => {
      expect(
        combineValid(
          modelToCombinator(new PrimitiveType({}, "string"))
        )
      ).toMatchInlineSnapshot(`
        [
          "string",
        ]
      `);
    });
    it("number", () => {
      expect(
        combineValid(
          modelToCombinator(new PrimitiveType({}, "number"))
        )
      ).toMatchInlineSnapshot(`
        [
          0,
          42,
        ]
      `);
    });
    it("boolean", () => {
      expect(
        combineValid(
          modelToCombinator(new PrimitiveType({}, "boolean"))
        )
      ).toMatchInlineSnapshot(`
        [
          true,
          false,
        ]
      `);
    });
  });

  describe("ObjectType", () => {
    it("empty", () => {
      expect(combineValid(modelToCombinator(new ObjectType({}, {}))))
        .toMatchInlineSnapshot(`
          [
            {},
          ]
        `);
    });
    it("nested", () => {
      expect(
        combineValid(
          modelToCombinator(
            new ObjectType({}, { a: new ObjectType({}, {}) })
          )
        )
      ).toMatchInlineSnapshot(`
        [
          {
            "a": {},
          },
        ]
      `);
    });
    it("literal attributes", () => {
      expect(
        combineValid(
          modelToCombinator(
            new ObjectType(
              {},
              {
                a: new LiteralType({}, 1),
                b: new LiteralType({}, "foo"),
                c: new LiteralType({}, true),
              }
            )
          )
        )
      ).toMatchInlineSnapshot(`
        [
          {
            "a": 1,
            "b": "foo",
            "c": true,
          },
        ]
      `);
    });
  });

  describe("UnionType", () => {
    it("empty", () => {
      expect(
        combineValid(modelToCombinator(new UnionType({}, [])))
      ).toMatchInlineSnapshot(`[]`);
    });
    it("of literal types", () => {
      expect(
        combineValid(
          modelToCombinator(
            new UnionType({}, [
              new LiteralType({}, 1),
              new LiteralType({}, 2),
              new LiteralType({}, 3),
            ])
          )
        )
      ).toMatchInlineSnapshot(`
        [
          1,
          2,
          3,
        ]
      `);
    });
  });

  describe("ArrayType", () => {
    it("empty", () => {
      expect(
        combineValid(
          modelToCombinator(
            new ArrayType({}, new PrimitiveType({}, "boolean"))
          )
        )
      ).toMatchInlineSnapshot(`
        [
          [],
          [
            true,
          ],
          [
            false,
          ],
        ]
      `);
    });
  });

  describe("AliasType", () => {
    it("empty", () => {
      expect(() =>
        combineValid(modelToCombinator(new AliasType({}, "Foo")))
      ).toThrow();
    });
  });
});

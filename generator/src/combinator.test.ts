import { expect, describe, it } from "vitest";
import {
  array,
  combineInvalid,
  combineValid,
  modelToCombinator,
  object,
  union,
  values,
  Combinator,
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

function valid(v: Combinator) {
  return sort(combineValid(v));
}

function invalid(v: Combinator) {
  return sort(combineInvalid(v));
}

for (const [name, f] of [
  ["valid", valid] as const,
  ["invalid", invalid] as const,
]) {
  describe(name, () => {
    it("all at once", () => {
      const obj = object(
        {
          a: union([values([1]), values([2])]),
          b: union([values([true]), values([false])]),
          c: array(union([values(["a"]), values(["b"])])),
          d: object(
            {
              d2: union([values([null]), values([undefined])]),
            },
            new Set()
          ),
        },
        new Set()
      );

      expect(f(obj)).toMatchSnapshot();
    });

    describe("value", () => {
      it("number", () => {
        expect(f(values([1]))).toMatchSnapshot();
      });
      it("string", () => {
        expect(f(values(["a"]))).toMatchSnapshot();
      });
      it("null", () => {
        expect(f(values([null]))).toMatchSnapshot();
      });
    });

    describe("union", () => {
      it("of a single value", () => {
        expect(f(union([values([1])]))).toMatchSnapshot();
      });

      it("of several values", () => {
        expect(
          f(union([values([1]), values([2]), values([3])]))
        ).toMatchSnapshot();
      });

      it("of a union", () => {
        expect(
          f(union([union([values([1]), values([2]), values([3])])]))
        ).toMatchSnapshot();
      });

      it("of unions", () => {
        expect(
          f(
            union([
              union([values([1]), values([2])]),
              union([values([3]), values([4])]),
            ])
          )
        ).toMatchSnapshot();
      });
    });

    describe("array", () => {
      it("of a single value", () => {
        expect(f(array(values([1])))).toMatchSnapshot();
      });

      it("of a union", () => {
        expect(
          f(array(union([values([1]), values([2])])))
        ).toMatchSnapshot();
      });

      it("of an array of an array of a value", () => {
        expect(f(array(array(array(values([1])))))).toMatchSnapshot();
      });

      it("of an array of an array of a union", () => {
        expect(
          f(array(array(array(union([values([1]), values([2])])))))
        ).toMatchSnapshot();
      });
    });

    describe("object", () => {
      it("empty", () => {
        expect(f(object({}, new Set()))).toMatchSnapshot();
      });

      it("of a single value property", () => {
        expect(
          f(object({ a: values(["A"]) }, new Set()))
        ).toMatchSnapshot();
      });

      it("of a several value properties", () => {
        expect(
          f(
            object(
              {
                a: values(["A"]),
                b: values(["B"]),
                c: values(["C"]),
              },
              new Set()
            )
          )
        ).toMatchSnapshot();
      });

      it("of a single union property", () => {
        expect(
          f(
            object(
              { a: union([values(["A1"]), values(["A2"])]) },
              new Set()
            )
          )
        ).toMatchSnapshot();
      });

      it("of a several union properties", () => {
        expect(
          f(
            object(
              {
                a: union([values(["A1"])]),
                b: union([values(["B1"]), values(["B2"])]),
                c: union([
                  values(["C1"]),
                  values(["C2"]),
                  values(["C3"]),
                ]),
              },
              new Set()
            )
          )
        ).toMatchSnapshot();
      });

      it("of several optional properties", () => {
        expect(
          f(
            object(
              {
                a: values([1]),
                b: values([2]),
                c: values([3]),
                d: values([4]),
              },
              new Set(["b", "d"])
            )
          )
        ).toMatchSnapshot();
      });

      it("of a several objects with value properties", () => {
        expect(
          f(
            object(
              {
                a: object(
                  { a1: values(["A1"]), a2: values(["A2"]) },
                  new Set()
                ),
                b: object(
                  { b1: values(["B1"]), b2: values(["B2"]) },
                  new Set()
                ),
                c: object(
                  { c1: values(["C1"]), c2: values(["C2"]) },
                  new Set()
                ),
              },
              new Set()
            )
          )
        ).toMatchSnapshot();
      });

      it("of a several objects with union properties", () => {
        expect(
          f(
            object(
              {
                a: object(
                  { aa: union([values(["AA1"]), values(["AA2"])]) },
                  new Set()
                ),
                b: object(
                  { bb: union([values(["BB1"]), values(["BB2"])]) },
                  new Set()
                ),
                c: object(
                  { cc: union([values(["CC1"]), values(["CC2"])]) },
                  new Set()
                ),
              },
              new Set()
            )
          )
        ).toMatchSnapshot();
      });

      it("of a several nested objects with a value property", () => {
        expect(
          f(
            object(
              {
                a: object(
                  {
                    b: object(
                      { c: object({ d: values(["D"]) }, new Set()) },
                      new Set()
                    ),
                  },
                  new Set()
                ),
              },
              new Set()
            )
          )
        ).toMatchSnapshot();
      });

      it("of a several nested objects with a union property", () => {
        expect(
          f(
            object(
              {
                a: object(
                  {
                    b: object(
                      {
                        c: object(
                          {
                            d: union([
                              values(["D1"]),
                              values(["D2"]),
                            ]),
                          },
                          new Set()
                        ),
                      },
                      new Set()
                    ),
                  },
                  new Set()
                ),
              },
              new Set()
            )
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
          "",
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
    it("optional attributes", () => {
      expect(
        combineValid(
          modelToCombinator(
            new ObjectType(
              {},
              {
                a: new LiteralType({}, 1),
                b: new LiteralType({}, 2),
                c: new LiteralType({}, 3),
              },
              new Set(["b"])
            )
          )
        )
      ).toMatchInlineSnapshot(`
        [
          {
            "a": 1,
            "c": 3,
          },
          {
            "a": 1,
            "b": 2,
            "c": 3,
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
    it("simple", () => {
      expect(
        combineValid(modelToCombinator(new AliasType({}, "Foo")))
      ).toMatchSnapshot();
    });
    it("two in a union", () => {
      expect(
        combineValid(
          modelToCombinator(
            new UnionType({}, [
              new AliasType({}, "Foo"),
              new AliasType({}, "Bar"),
            ])
          )
        )
      ).toMatchSnapshot();
    });
  });
});

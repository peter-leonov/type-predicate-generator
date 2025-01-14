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

describe("valid", () => {
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

    expect(combineValid(obj)).toMatchInlineSnapshot(`
      [
        {
          "a": 1,
          "b": true,
          "c": [],
          "d": {
            "d2": null,
          },
        },
        {
          "a": 1,
          "b": true,
          "c": [],
          "d": {
            "d2": undefined,
          },
        },
        {
          "a": 1,
          "b": true,
          "c": [
            "a",
          ],
          "d": {
            "d2": null,
          },
        },
        {
          "a": 1,
          "b": true,
          "c": [
            "b",
          ],
          "d": {
            "d2": null,
          },
        },
        {
          "a": 1,
          "b": false,
          "c": [],
          "d": {
            "d2": null,
          },
        },
        {
          "a": 2,
          "b": true,
          "c": [],
          "d": {
            "d2": null,
          },
        },
      ]
    `);
  });

  describe("value", () => {
    it("number", () => {
      expect(combineValid(values([1]))).toMatchInlineSnapshot(`
        [
          1,
        ]
      `);
    });
    it("string", () => {
      expect(combineValid(values(["a"]))).toMatchInlineSnapshot(`
        [
          "a",
        ]
      `);
    });
    it("null", () => {
      expect(combineValid(values([null]))).toMatchInlineSnapshot(`
        [
          null,
        ]
      `);
    });
    it("multiple", () => {
      expect(combineValid(values([1, "A", true])))
        .toMatchInlineSnapshot(`
          [
            1,
            "A",
            true,
          ]
        `);
    });
  });

  describe("union", () => {
    it("of a single value", () => {
      expect(combineValid(union([values([1])])))
        .toMatchInlineSnapshot(`
        [
          1,
        ]
      `);
    });

    it("of several values", () => {
      expect(
        combineValid(union([values([1]), values([2]), values([3])]))
      ).toMatchInlineSnapshot(`
        [
          1,
          2,
          3,
        ]
      `);
    });

    it("of a union", () => {
      expect(
        combineValid(
          union([union([values([1]), values([2]), values([3])])])
        )
      ).toMatchInlineSnapshot(`
        [
          1,
          2,
          3,
        ]
      `);
    });

    it("of unions", () => {
      expect(
        combineValid(
          union([
            union([values([1]), values([2])]),
            union([values([3]), values([4])]),
          ])
        )
      ).toMatchInlineSnapshot(`
        [
          1,
          2,
          3,
          4,
        ]
      `);
    });
  });

  describe("array", () => {
    it("of a single value", () => {
      expect(combineValid(array(values([1])))).toMatchInlineSnapshot(`
        [
          [],
          [
            1,
          ],
        ]
      `);
    });

    it("of a union", () => {
      expect(combineValid(array(union([values([1]), values([2])]))))
        .toMatchInlineSnapshot(`
          [
            [],
            [
              1,
            ],
            [
              2,
            ],
          ]
        `);
    });

    it("of an array of an array of a value", () => {
      expect(combineValid(array(array(array(values([1]))))))
        .toMatchInlineSnapshot(`
          [
            [],
            [
              [],
            ],
            [
              [
                [],
              ],
            ],
            [
              [
                [
                  1,
                ],
              ],
            ],
          ]
        `);
    });

    it("of an array of an array of a union", () => {
      expect(
        combineValid(
          array(array(array(union([values([1]), values([2])]))))
        )
      ).toMatchInlineSnapshot(`
        [
          [],
          [
            [],
          ],
          [
            [
              [],
            ],
          ],
          [
            [
              [
                1,
              ],
            ],
          ],
          [
            [
              [
                2,
              ],
            ],
          ],
        ]
      `);
    });
  });

  describe("object", () => {
    it("empty", () => {
      expect(combineValid(object({}, new Set())))
        .toMatchInlineSnapshot(`
        [
          {},
        ]
      `);
    });

    it("of a single value property", () => {
      expect(combineValid(object({ a: values(["A"]) }, new Set())))
        .toMatchInlineSnapshot(`
        [
          {
            "a": "A",
          },
        ]
      `);
    });

    it("of a several value properties", () => {
      expect(
        combineValid(
          object(
            {
              a: values(["A"]),
              b: values(["B"]),
              c: values(["C"]),
            },
            new Set()
          )
        )
      ).toMatchInlineSnapshot(`
        [
          {
            "a": "A",
            "b": "B",
            "c": "C",
          },
        ]
      `);
    });

    it("of a single union property", () => {
      expect(
        combineValid(
          object(
            { a: union([values(["A1"]), values(["A2"])]) },
            new Set()
          )
        )
      ).toMatchInlineSnapshot(`
        [
          {
            "a": "A1",
          },
          {
            "a": "A2",
          },
        ]
      `);
    });

    it.only("of several union properties", () => {
      expect(
        combineValid(
          object(
            {
              a: union([
                values(["A1"]),
                values(["A2"]),
                values(["A3"]),
              ]),
              b: union([
                values(["B1"]),
                values(["B2"]),
                values(["B3"]),
              ]),
              c: union([
                values(["C1"]),
                values(["C2"]),
                values(["C3"]),
              ]),
            },
            new Set()
          )
        )
      ).toMatchInlineSnapshot(`
        [
          {
            "a": "A1",
            "b": "B1",
            "c": "C1",
          },
          {
            "a": "A2",
            "b": "B1",
            "c": "C1",
          },
          {
            "a": "A3",
            "b": "B1",
            "c": "C1",
          },
          {
            "a": "A3",
            "b": "B2",
            "c": "C1",
          },
          {
            "a": "A3",
            "b": "B3",
            "c": "C1",
          },
          {
            "a": "A3",
            "b": "B3",
            "c": "C2",
          },
          {
            "a": "A3",
            "b": "B3",
            "c": "C3",
          },
        ]
      `);
    });

    it("of several optional properties", () => {
      expect(
        combineValid(
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
      ).toMatchInlineSnapshot(`
        [
          {
            "a": 1,
            "b": 2,
            "c": 3,
            "d": 4,
          },
          {
            "a": 1,
            "b": 2,
            "c": 3,
          },
          {
            "a": 1,
            "c": 3,
            "d": 4,
          },
        ]
      `);
    });

    it("of only optional properties", () => {
      expect(
        combineValid(
          object(
            {
              a: values([1]),
              b: values([2]),
              c: values([3]),
              d: values([4]),
              e: values([5]),
              f: values([6]),
            },
            new Set(["a", "b", "c", "d", "e", "f"])
          )
        )
      ).toMatchInlineSnapshot(`
        [
          {
            "a": 1,
            "b": 2,
            "c": 3,
            "d": 4,
            "e": 5,
            "f": 6,
          },
          {
            "a": 1,
            "b": 2,
            "c": 3,
            "d": 4,
            "e": 5,
          },
          {
            "a": 1,
            "b": 2,
            "c": 3,
            "d": 4,
            "f": 6,
          },
          {
            "a": 1,
            "b": 2,
            "c": 3,
            "e": 5,
            "f": 6,
          },
          {
            "a": 1,
            "b": 2,
            "d": 4,
            "e": 5,
            "f": 6,
          },
          {
            "a": 1,
            "c": 3,
            "d": 4,
            "e": 5,
            "f": 6,
          },
          {
            "b": 2,
            "c": 3,
            "d": 4,
            "e": 5,
            "f": 6,
          },
        ]
      `);
    });

    it("of a several objects with value properties", () => {
      expect(
        combineValid(
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
      ).toMatchInlineSnapshot(`
        [
          {
            "a": {
              "a1": "A1",
              "a2": "A2",
            },
            "b": {
              "b1": "B1",
              "b2": "B2",
            },
            "c": {
              "c1": "C1",
              "c2": "C2",
            },
          },
        ]
      `);
    });

    it("of a several objects with union properties", () => {
      expect(
        combineValid(
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
      ).toMatchInlineSnapshot(`
        [
          {
            "a": {
              "aa": "AA1",
            },
            "b": {
              "bb": "BB1",
            },
            "c": {
              "cc": "CC1",
            },
          },
          {
            "a": {
              "aa": "AA1",
            },
            "b": {
              "bb": "BB1",
            },
            "c": {
              "cc": "CC2",
            },
          },
          {
            "a": {
              "aa": "AA1",
            },
            "b": {
              "bb": "BB2",
            },
            "c": {
              "cc": "CC1",
            },
          },
          {
            "a": {
              "aa": "AA2",
            },
            "b": {
              "bb": "BB1",
            },
            "c": {
              "cc": "CC1",
            },
          },
        ]
      `);
    });

    it("of a several nested objects with a value property", () => {
      expect(
        combineValid(
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
      ).toMatchInlineSnapshot(`
        [
          {
            "a": {
              "b": {
                "c": {
                  "d": "D",
                },
              },
            },
          },
        ]
      `);
    });

    it("of a several nested objects with a union property", () => {
      expect(
        combineValid(
          object(
            {
              a: object(
                {
                  b: object(
                    {
                      c: object(
                        {
                          d: union([values(["D1"]), values(["D2"])]),
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
      ).toMatchInlineSnapshot(`
        [
          {
            "a": {
              "b": {
                "c": {
                  "d": "D1",
                },
              },
            },
          },
          {
            "a": {
              "b": {
                "c": {
                  "d": "D2",
                },
              },
            },
          },
        ]
      `);
    });
  });
});

// copy pasting to use inline snapshots and get better error reporting
describe("invalid", () => {
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

    expect(combineInvalid(obj)).toMatchInlineSnapshot(`
      [
        Symbol(invalidValue),
        null,
        {
          "b": true,
          "c": [],
          "d": {
            "d2": null,
          },
        },
        {
          "a": Symbol(invalidValue),
          "b": true,
          "c": [],
          "d": {
            "d2": null,
          },
        },
        {
          "a": Symbol(invalidValue),
          "b": true,
          "c": [],
          "d": {
            "d2": null,
          },
        },
        {
          "a": 1,
          "c": [],
          "d": {
            "d2": null,
          },
        },
        {
          "a": 1,
          "b": Symbol(invalidValue),
          "c": [],
          "d": {
            "d2": null,
          },
        },
        {
          "a": 1,
          "b": Symbol(invalidValue),
          "c": [],
          "d": {
            "d2": null,
          },
        },
        {
          "a": 1,
          "b": true,
          "d": {
            "d2": null,
          },
        },
        {
          "a": 1,
          "b": true,
          "c": Symbol(invalidValue),
          "d": {
            "d2": null,
          },
        },
        {
          "a": 1,
          "b": true,
          "c": [
            Symbol(invalidValue),
          ],
          "d": {
            "d2": null,
          },
        },
        {
          "a": 1,
          "b": true,
          "c": [
            Symbol(invalidValue),
          ],
          "d": {
            "d2": null,
          },
        },
        {
          "a": 1,
          "b": true,
          "c": [],
        },
        {
          "a": 1,
          "b": true,
          "c": [],
          "d": Symbol(invalidValue),
        },
        {
          "a": 1,
          "b": true,
          "c": [],
          "d": null,
        },
        {
          "a": 1,
          "b": true,
          "c": [],
          "d": {},
        },
        {
          "a": 1,
          "b": true,
          "c": [],
          "d": {
            "d2": Symbol(invalidValue),
          },
        },
        {
          "a": 1,
          "b": true,
          "c": [],
          "d": {
            "d2": Symbol(invalidValue),
          },
        },
      ]
    `);
  });

  describe("value", () => {
    it("number", () => {
      expect(combineInvalid(values([1]))).toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
        ]
      `);
    });
    it("string", () => {
      expect(combineInvalid(values(["a"]))).toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
        ]
      `);
    });
    it("null", () => {
      expect(combineInvalid(values([null]))).toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
        ]
      `);
    });
    it("multiple", () => {
      expect(combineInvalid(values([1, "A", true])))
        .toMatchInlineSnapshot(`
          [
            Symbol(invalidValue),
          ]
        `);
    });
  });

  describe("union", () => {
    it("of a single value", () => {
      expect(combineInvalid(union([values([1])])))
        .toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
        ]
      `);
    });

    it("of several values", () => {
      expect(
        combineInvalid(union([values([1]), values([2]), values([3])]))
      ).toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
          Symbol(invalidValue),
          Symbol(invalidValue),
        ]
      `);
    });

    it("of a union", () => {
      expect(
        combineInvalid(
          union([union([values([1]), values([2]), values([3])])])
        )
      ).toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
          Symbol(invalidValue),
          Symbol(invalidValue),
        ]
      `);
    });

    it("of unions", () => {
      expect(
        combineInvalid(
          union([
            union([values([1]), values([2])]),
            union([values([3]), values([4])]),
          ])
        )
      ).toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
          Symbol(invalidValue),
          Symbol(invalidValue),
          Symbol(invalidValue),
        ]
      `);
    });
  });

  describe("array", () => {
    it("of a single value", () => {
      expect(combineInvalid(array(values([1]))))
        .toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
          [
            Symbol(invalidValue),
          ],
        ]
      `);
    });

    it("of a union", () => {
      expect(combineInvalid(array(union([values([1]), values([2])]))))
        .toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
          [
            Symbol(invalidValue),
          ],
          [
            Symbol(invalidValue),
          ],
        ]
      `);
    });

    it("of an array of an array of a value", () => {
      expect(combineInvalid(array(array(array(values([1]))))))
        .toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
          [
            Symbol(invalidValue),
          ],
          [
            [
              Symbol(invalidValue),
            ],
          ],
          [
            [
              [
                Symbol(invalidValue),
              ],
            ],
          ],
        ]
      `);
    });

    it("of an array of an array of a union", () => {
      expect(
        combineInvalid(
          array(array(array(union([values([1]), values([2])]))))
        )
      ).toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
          [
            Symbol(invalidValue),
          ],
          [
            [
              Symbol(invalidValue),
            ],
          ],
          [
            [
              [
                Symbol(invalidValue),
              ],
            ],
          ],
          [
            [
              [
                Symbol(invalidValue),
              ],
            ],
          ],
        ]
      `);
    });
  });

  describe("object", () => {
    it("empty", () => {
      expect(combineInvalid(object({}, new Set())))
        .toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
          null,
        ]
      `);
    });

    it("of a single value property", () => {
      expect(combineInvalid(object({ a: values(["A"]) }, new Set())))
        .toMatchInlineSnapshot(`
          [
            Symbol(invalidValue),
            null,
            {},
            {
              "a": Symbol(invalidValue),
            },
          ]
        `);
    });

    it("of a several value properties", () => {
      expect(
        combineInvalid(
          object(
            {
              a: values(["A"]),
              b: values(["B"]),
              c: values(["C"]),
            },
            new Set()
          )
        )
      ).toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
          null,
          {
            "b": "B",
            "c": "C",
          },
          {
            "a": Symbol(invalidValue),
            "b": "B",
            "c": "C",
          },
          {
            "a": "A",
            "c": "C",
          },
          {
            "a": "A",
            "b": Symbol(invalidValue),
            "c": "C",
          },
          {
            "a": "A",
            "b": "B",
          },
          {
            "a": "A",
            "b": "B",
            "c": Symbol(invalidValue),
          },
        ]
      `);
    });

    it("of a single union property", () => {
      expect(
        combineInvalid(
          object(
            { a: union([values(["A1"]), values(["A2"])]) },
            new Set()
          )
        )
      ).toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
          null,
          {},
          {
            "a": Symbol(invalidValue),
          },
          {
            "a": Symbol(invalidValue),
          },
        ]
      `);
    });

    it("of several union properties", () => {
      expect(
        combineInvalid(
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
      ).toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
          null,
          {
            "b": "B1",
            "c": "C1",
          },
          {
            "a": Symbol(invalidValue),
            "b": "B1",
            "c": "C1",
          },
          {
            "a": "A1",
            "c": "C1",
          },
          {
            "a": "A1",
            "b": Symbol(invalidValue),
            "c": "C1",
          },
          {
            "a": "A1",
            "b": Symbol(invalidValue),
            "c": "C1",
          },
          {
            "a": "A1",
            "b": "B1",
          },
          {
            "a": "A1",
            "b": "B1",
            "c": Symbol(invalidValue),
          },
          {
            "a": "A1",
            "b": "B1",
            "c": Symbol(invalidValue),
          },
          {
            "a": "A1",
            "b": "B1",
            "c": Symbol(invalidValue),
          },
        ]
      `);
    });

    it("of several optional properties", () => {
      expect(
        combineInvalid(
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
      ).toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
          null,
          {
            "b": 2,
            "c": 3,
            "d": 4,
          },
          {
            "a": Symbol(invalidValue),
            "b": 2,
            "c": 3,
            "d": 4,
          },
          {
            "a": 1,
            "b": Symbol(invalidValue),
            "c": 3,
            "d": 4,
          },
          {
            "a": 1,
            "b": 2,
            "d": 4,
          },
          {
            "a": 1,
            "b": 2,
            "c": Symbol(invalidValue),
            "d": 4,
          },
          {
            "a": 1,
            "b": 2,
            "c": 3,
            "d": Symbol(invalidValue),
          },
        ]
      `);
    });

    it("of only optional properties", () => {
      expect(
        combineInvalid(
          object(
            {
              a: values([1]),
              b: values([2]),
              c: values([3]),
              d: values([4]),
              e: values([5]),
              f: values([6]),
            },
            new Set(["a", "b", "c", "d", "e", "f"])
          )
        )
      ).toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
          null,
          {
            "a": Symbol(invalidValue),
            "b": 2,
            "c": 3,
            "d": 4,
            "e": 5,
            "f": 6,
          },
          {
            "a": 1,
            "b": Symbol(invalidValue),
            "c": 3,
            "d": 4,
            "e": 5,
            "f": 6,
          },
          {
            "a": 1,
            "b": 2,
            "c": Symbol(invalidValue),
            "d": 4,
            "e": 5,
            "f": 6,
          },
          {
            "a": 1,
            "b": 2,
            "c": 3,
            "d": Symbol(invalidValue),
            "e": 5,
            "f": 6,
          },
          {
            "a": 1,
            "b": 2,
            "c": 3,
            "d": 4,
            "e": Symbol(invalidValue),
            "f": 6,
          },
          {
            "a": 1,
            "b": 2,
            "c": 3,
            "d": 4,
            "e": 5,
            "f": Symbol(invalidValue),
          },
        ]
      `);
    });

    it("of a several objects with value properties", () => {
      expect(
        combineInvalid(
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
      ).toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
          null,
          {
            "b": {
              "b1": "B1",
              "b2": "B2",
            },
            "c": {
              "c1": "C1",
              "c2": "C2",
            },
          },
          {
            "a": Symbol(invalidValue),
            "b": {
              "b1": "B1",
              "b2": "B2",
            },
            "c": {
              "c1": "C1",
              "c2": "C2",
            },
          },
          {
            "a": null,
            "b": {
              "b1": "B1",
              "b2": "B2",
            },
            "c": {
              "c1": "C1",
              "c2": "C2",
            },
          },
          {
            "a": {
              "a2": "A2",
            },
            "b": {
              "b1": "B1",
              "b2": "B2",
            },
            "c": {
              "c1": "C1",
              "c2": "C2",
            },
          },
          {
            "a": {
              "a1": Symbol(invalidValue),
              "a2": "A2",
            },
            "b": {
              "b1": "B1",
              "b2": "B2",
            },
            "c": {
              "c1": "C1",
              "c2": "C2",
            },
          },
          {
            "a": {
              "a1": "A1",
            },
            "b": {
              "b1": "B1",
              "b2": "B2",
            },
            "c": {
              "c1": "C1",
              "c2": "C2",
            },
          },
          {
            "a": {
              "a1": "A1",
              "a2": Symbol(invalidValue),
            },
            "b": {
              "b1": "B1",
              "b2": "B2",
            },
            "c": {
              "c1": "C1",
              "c2": "C2",
            },
          },
          {
            "a": {
              "a1": "A1",
              "a2": "A2",
            },
            "c": {
              "c1": "C1",
              "c2": "C2",
            },
          },
          {
            "a": {
              "a1": "A1",
              "a2": "A2",
            },
            "b": Symbol(invalidValue),
            "c": {
              "c1": "C1",
              "c2": "C2",
            },
          },
          {
            "a": {
              "a1": "A1",
              "a2": "A2",
            },
            "b": null,
            "c": {
              "c1": "C1",
              "c2": "C2",
            },
          },
          {
            "a": {
              "a1": "A1",
              "a2": "A2",
            },
            "b": {
              "b2": "B2",
            },
            "c": {
              "c1": "C1",
              "c2": "C2",
            },
          },
          {
            "a": {
              "a1": "A1",
              "a2": "A2",
            },
            "b": {
              "b1": Symbol(invalidValue),
              "b2": "B2",
            },
            "c": {
              "c1": "C1",
              "c2": "C2",
            },
          },
          {
            "a": {
              "a1": "A1",
              "a2": "A2",
            },
            "b": {
              "b1": "B1",
            },
            "c": {
              "c1": "C1",
              "c2": "C2",
            },
          },
          {
            "a": {
              "a1": "A1",
              "a2": "A2",
            },
            "b": {
              "b1": "B1",
              "b2": Symbol(invalidValue),
            },
            "c": {
              "c1": "C1",
              "c2": "C2",
            },
          },
          {
            "a": {
              "a1": "A1",
              "a2": "A2",
            },
            "b": {
              "b1": "B1",
              "b2": "B2",
            },
          },
          {
            "a": {
              "a1": "A1",
              "a2": "A2",
            },
            "b": {
              "b1": "B1",
              "b2": "B2",
            },
            "c": Symbol(invalidValue),
          },
          {
            "a": {
              "a1": "A1",
              "a2": "A2",
            },
            "b": {
              "b1": "B1",
              "b2": "B2",
            },
            "c": null,
          },
          {
            "a": {
              "a1": "A1",
              "a2": "A2",
            },
            "b": {
              "b1": "B1",
              "b2": "B2",
            },
            "c": {
              "c2": "C2",
            },
          },
          {
            "a": {
              "a1": "A1",
              "a2": "A2",
            },
            "b": {
              "b1": "B1",
              "b2": "B2",
            },
            "c": {
              "c1": Symbol(invalidValue),
              "c2": "C2",
            },
          },
          {
            "a": {
              "a1": "A1",
              "a2": "A2",
            },
            "b": {
              "b1": "B1",
              "b2": "B2",
            },
            "c": {
              "c1": "C1",
            },
          },
          {
            "a": {
              "a1": "A1",
              "a2": "A2",
            },
            "b": {
              "b1": "B1",
              "b2": "B2",
            },
            "c": {
              "c1": "C1",
              "c2": Symbol(invalidValue),
            },
          },
        ]
      `);
    });

    it("of a several objects with union properties", () => {
      expect(
        combineInvalid(
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
      ).toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
          null,
          {
            "b": {
              "bb": "BB1",
            },
            "c": {
              "cc": "CC1",
            },
          },
          {
            "a": Symbol(invalidValue),
            "b": {
              "bb": "BB1",
            },
            "c": {
              "cc": "CC1",
            },
          },
          {
            "a": null,
            "b": {
              "bb": "BB1",
            },
            "c": {
              "cc": "CC1",
            },
          },
          {
            "a": {},
            "b": {
              "bb": "BB1",
            },
            "c": {
              "cc": "CC1",
            },
          },
          {
            "a": {
              "aa": Symbol(invalidValue),
            },
            "b": {
              "bb": "BB1",
            },
            "c": {
              "cc": "CC1",
            },
          },
          {
            "a": {
              "aa": Symbol(invalidValue),
            },
            "b": {
              "bb": "BB1",
            },
            "c": {
              "cc": "CC1",
            },
          },
          {
            "a": {
              "aa": "AA1",
            },
            "c": {
              "cc": "CC1",
            },
          },
          {
            "a": {
              "aa": "AA1",
            },
            "b": Symbol(invalidValue),
            "c": {
              "cc": "CC1",
            },
          },
          {
            "a": {
              "aa": "AA1",
            },
            "b": null,
            "c": {
              "cc": "CC1",
            },
          },
          {
            "a": {
              "aa": "AA1",
            },
            "b": {},
            "c": {
              "cc": "CC1",
            },
          },
          {
            "a": {
              "aa": "AA1",
            },
            "b": {
              "bb": Symbol(invalidValue),
            },
            "c": {
              "cc": "CC1",
            },
          },
          {
            "a": {
              "aa": "AA1",
            },
            "b": {
              "bb": Symbol(invalidValue),
            },
            "c": {
              "cc": "CC1",
            },
          },
          {
            "a": {
              "aa": "AA1",
            },
            "b": {
              "bb": "BB1",
            },
          },
          {
            "a": {
              "aa": "AA1",
            },
            "b": {
              "bb": "BB1",
            },
            "c": Symbol(invalidValue),
          },
          {
            "a": {
              "aa": "AA1",
            },
            "b": {
              "bb": "BB1",
            },
            "c": null,
          },
          {
            "a": {
              "aa": "AA1",
            },
            "b": {
              "bb": "BB1",
            },
            "c": {},
          },
          {
            "a": {
              "aa": "AA1",
            },
            "b": {
              "bb": "BB1",
            },
            "c": {
              "cc": Symbol(invalidValue),
            },
          },
          {
            "a": {
              "aa": "AA1",
            },
            "b": {
              "bb": "BB1",
            },
            "c": {
              "cc": Symbol(invalidValue),
            },
          },
        ]
      `);
    });

    it("of a several nested objects with a value property", () => {
      expect(
        combineInvalid(
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
      ).toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
          null,
          {},
          {
            "a": Symbol(invalidValue),
          },
          {
            "a": null,
          },
          {
            "a": {},
          },
          {
            "a": {
              "b": Symbol(invalidValue),
            },
          },
          {
            "a": {
              "b": null,
            },
          },
          {
            "a": {
              "b": {},
            },
          },
          {
            "a": {
              "b": {
                "c": Symbol(invalidValue),
              },
            },
          },
          {
            "a": {
              "b": {
                "c": null,
              },
            },
          },
          {
            "a": {
              "b": {
                "c": {},
              },
            },
          },
          {
            "a": {
              "b": {
                "c": {
                  "d": Symbol(invalidValue),
                },
              },
            },
          },
        ]
      `);
    });

    it("of a several nested objects with a union property", () => {
      expect(
        combineInvalid(
          object(
            {
              a: object(
                {
                  b: object(
                    {
                      c: object(
                        {
                          d: union([values(["D1"]), values(["D2"])]),
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
      ).toMatchInlineSnapshot(`
        [
          Symbol(invalidValue),
          null,
          {},
          {
            "a": Symbol(invalidValue),
          },
          {
            "a": null,
          },
          {
            "a": {},
          },
          {
            "a": {
              "b": Symbol(invalidValue),
            },
          },
          {
            "a": {
              "b": null,
            },
          },
          {
            "a": {
              "b": {},
            },
          },
          {
            "a": {
              "b": {
                "c": Symbol(invalidValue),
              },
            },
          },
          {
            "a": {
              "b": {
                "c": null,
              },
            },
          },
          {
            "a": {
              "b": {
                "c": {},
              },
            },
          },
          {
            "a": {
              "b": {
                "c": {
                  "d": Symbol(invalidValue),
                },
              },
            },
          },
          {
            "a": {
              "b": {
                "c": {
                  "d": Symbol(invalidValue),
                },
              },
            },
          },
        ]
      `);
    });
  });
});

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
            "b": 2,
            "c": 3,
          },
          {
            "a": 1,
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
      ).toMatchInlineSnapshot(`
        [
          Reference {
            "isValid": true,
            "typeName": "Foo",
          },
        ]
      `);
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
      ).toMatchInlineSnapshot(`
        [
          Reference {
            "isValid": true,
            "typeName": "Foo",
          },
          Reference {
            "isValid": true,
            "typeName": "Bar",
          },
        ]
      `);
    });
  });
});

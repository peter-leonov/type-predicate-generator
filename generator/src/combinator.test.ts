import { expect, describe, it } from "vitest";
import {
  array,
  combineInvalid,
  combineValid,
  object,
  union,
  value,
  ValueGenerator,
  type Value,
} from "./combinator";

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

describe("valid", () => {
  it("all at once", () => {
    const obj = object<Value>({
      a: union([value(1), value(2)]),
      b: union([value(true), value(false)]),
      c: array(union([value("a"), value("b")])),
      d: object({
        d2: union([value(null), value(undefined)]),
      }),
    });

    expect(valid(obj)).toMatchSnapshot();
  });

  describe("value", () => {
    it("number", () => {
      expect(valid(value(1))).toMatchSnapshot();
    });
    it("string", () => {
      expect(valid(value("a"))).toMatchSnapshot();
    });
    it("null", () => {
      expect(valid(value(null))).toMatchSnapshot();
    });
  });

  describe("union", () => {
    it("of a single value", () => {
      expect(valid(union([value(1)]))).toMatchSnapshot();
    });

    it("of several values", () => {
      expect(
        valid(union([value(1), value(2), value(3)]))
      ).toMatchSnapshot();
    });

    it("of a union", () => {
      expect(
        valid(union([union([value(1), value(2), value(3)])]))
      ).toMatchSnapshot();
    });

    it("of unions", () => {
      expect(
        valid(
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
      expect(valid(array(value(1)))).toMatchSnapshot();
    });

    it("of a union", () => {
      expect(
        valid(array(union([value(1), value(2)])))
      ).toMatchSnapshot();
    });

    it("of an array of an array of a value", () => {
      expect(valid(array(array(array(value(1)))))).toMatchSnapshot();
    });

    it("of an array of an array of a union", () => {
      expect(
        valid(array(array(array(union([value(1), value(2)])))))
      ).toMatchSnapshot();
    });
  });

  describe("object", () => {
    it("empty", () => {
      expect(valid(object({}))).toMatchSnapshot();
    });

    it("of a single value property", () => {
      expect(valid(object({ a: value("A") }))).toMatchSnapshot();
    });

    it("of a several value properties", () => {
      expect(
        valid(object({ a: value("A"), b: value("B"), c: value("C") }))
      ).toMatchSnapshot();
    });

    it("of a single union property", () => {
      expect(
        valid(object({ a: union([value("A1"), value("A2")]) }))
      ).toMatchSnapshot();
    });

    it("of a several union properties", () => {
      expect(
        valid(
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
        valid(
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
        valid(
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
        valid(
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
        valid(
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

describe("invalid", () => {
  describe("value", () => {
    it("number", () => {
      expect(invalid(value(1))).toMatchSnapshot();
    });
  });

  describe("union", () => {
    it("single value", () => {
      expect(invalid(union([value(1)]))).toMatchSnapshot();
    });
    it("couple of values", () => {
      expect(
        invalid(union([value(1), value(2), value(3)]))
      ).toMatchSnapshot();
    });
  });

  describe("array", () => {
    it("single value", () => {
      expect(invalid(array(value(1)))).toMatchSnapshot();
    });

    it("of an array of an array of a value", () => {
      expect(
        invalid(array(array(array(value(1)))))
      ).toMatchSnapshot();
    });

    it("of an array of an array of a union", () => {
      expect(
        invalid(array(array(array(union([value(1), value(2)])))))
      ).toMatchSnapshot();
    });
  });

  describe("object", () => {
    it("empty", () => {
      expect(invalid(object({}))).toMatchSnapshot();
    });

    it("of a single value property", () => {
      expect(invalid(object({ a: value("A") }))).toMatchSnapshot();
    });

    it("of a several value properties", () => {
      expect(
        invalid(
          object({ a: value("A"), b: value("B"), c: value("C") })
        )
      ).toMatchSnapshot();
    });

    it("of a single union property", () => {
      expect(
        invalid(object({ a: union([value("A1"), value("A2")]) }))
      ).toMatchSnapshot();
    });

    it("of a several union properties", () => {
      expect(
        invalid(
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
        invalid(
          object({
            a: object({ a1: value("A1"), a2: value("A2") }),
            b: object({ b1: value("B1"), b2: value("B2") }),
            c: object({ c1: value("C1"), c2: value("C2") }),
          })
        )
      ).toMatchSnapshot();
    });

    it("of a several nested objects with a value property", () => {
      expect(
        invalid(
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
        invalid(
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

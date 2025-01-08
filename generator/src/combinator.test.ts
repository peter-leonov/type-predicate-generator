import { expect, describe, it } from "vitest";
import {
  array,
  combineInvalid,
  combineValid,
  object,
  union,
  value,
  type Value,
} from "./combinator";
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

    expect(combineValid(obj)).toMatchSnapshot();
  });

  describe("value", () => {
    it("number", () => {
      expect(combineValid(value(1))).toMatchSnapshot();
    });
    it("string", () => {
      expect(combineValid(value("a"))).toMatchSnapshot();
    });
    it("null", () => {
      expect(combineValid(value(null))).toMatchSnapshot();
    });
  });

  describe("union", () => {
    it("of a single value", () => {
      expect(combineValid(union([value(1)]))).toMatchSnapshot();
    });

    it("of several values", () => {
      expect(
        combineValid(union([value(1), value(2), value(3)]))
      ).toMatchSnapshot();
    });

    it("of a union", () => {
      expect(
        combineValid(union([union([value(1), value(2), value(3)])]))
      ).toMatchSnapshot();
    });

    it("of unions", () => {
      expect(
        combineValid(
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
      expect(combineValid(array(value(1)))).toMatchSnapshot();
    });

    it("of a union", () => {
      expect(
        combineValid(array(union([value(1), value(2)])))
      ).toMatchSnapshot();
    });

    it("of an array of an array of a value", () => {
      expect(
        combineValid(array(array(array(value(1)))))
      ).toMatchSnapshot();
    });

    it("of an array of an array of a union", () => {
      expect(
        combineValid(array(array(array(union([value(1), value(2)])))))
      ).toMatchSnapshot();
    });
  });

  describe("object", () => {
    it("empty", () => {
      expect(combineValid(object({}))).toMatchSnapshot();
    });

    it("of a single value property", () => {
      expect(
        combineValid(object({ a: value("A") }))
      ).toMatchSnapshot();
    });

    it("of a several value properties", () => {
      expect(
        combineValid(
          object({ a: value("A"), b: value("B"), c: value("C") })
        )
      ).toMatchSnapshot();
    });

    it("of a single union property", () => {
      expect(
        combineValid(object({ a: union([value("A1"), value("A2")]) }))
      ).toMatchSnapshot();
    });

    it("of a several union properties", () => {
      expect(
        combineValid(
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
        combineValid(
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
        combineValid(
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
        combineValid(
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
        combineValid(
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
      expect(combineInvalid(value(1))).toMatchSnapshot();
    });
  });

  describe("union", () => {
    it("single value", () => {
      expect(combineInvalid(union([value(1)]))).toMatchSnapshot();
    });
    it("couple of values", () => {
      expect(
        combineInvalid(union([value(1), value(2), value(3)]))
      ).toMatchSnapshot();
    });
  });

  describe("array", () => {
    it("single value", () => {
      expect(combineInvalid(array(value(1)))).toMatchSnapshot();
    });

    it("of an array of an array of a value", () => {
      expect(
        combineInvalid(array(array(array(value(1)))))
      ).toMatchSnapshot();
    });

    it("of an array of an array of a union", () => {
      expect(
        combineInvalid(
          array(array(array(union([value(1), value(2)]))))
        )
      ).toMatchSnapshot();
    });
  });

  describe("object", () => {
    it("empty", () => {
      expect(combineInvalid(object({}))).toMatchSnapshot();
    });

    it("of a single value property", () => {
      expect(
        combineInvalid(object({ a: value("A") }))
      ).toMatchSnapshot();
    });

    it("of a several value properties", () => {
      expect(
        combineInvalid(
          object({ a: value("A"), b: value("B"), c: value("C") })
        )
      ).toMatchSnapshot();
    });

    it("of a single union property", () => {
      expect(
        combineInvalid(
          object({ a: union([value("A1"), value("A2")]) })
        )
      ).toMatchSnapshot();
    });

    it("of a several union properties", () => {
      expect(
        combineInvalid(
          object({
            a: union([value("A1")]),
            b: union([value("B1"), value("B2")]),
            c: union([value("C1"), value("C2"), value("C3")]),
          })
        )
      ).toMatchSnapshot();
    });
  });
});

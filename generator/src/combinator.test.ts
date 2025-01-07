import { expect, describe, it } from "vitest";
import {
  array,
  combine,
  object,
  union,
  value,
  type Value,
} from "./combinator";

it("all at once", () => {
  const obj = object<Value>({
    a: union([value(1), value(2)]),
    b: union([value(true), value(false)]),
    c: array(union([value("a"), value("b")])),
    d: object({
      d2: union([value(null), value(undefined)]),
    }),
  });

  expect(combine(obj)).toMatchSnapshot();
});

describe("value", () => {
  it("number", () => {
    expect(combine(value(1))).toMatchSnapshot();
  });
  it("string", () => {
    expect(combine(value("a"))).toMatchSnapshot();
  });
  it("null", () => {
    expect(combine(value(null))).toMatchSnapshot();
  });
});

describe("union", () => {
  it("of a single value", () => {
    expect(combine(union([value(1)]))).toMatchSnapshot();
  });

  it("of several values", () => {
    expect(
      combine(union([value(1), value(2), value(3)]))
    ).toMatchSnapshot();
  });

  it("of a union", () => {
    expect(
      combine(union([union([value(1), value(2), value(3)])]))
    ).toMatchSnapshot();
  });

  it("of unions", () => {
    expect(
      combine(
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
    expect(combine(array(value(1)))).toMatchSnapshot();
  });

  it("of a union", () => {
    expect(
      combine(array(union([value(1), value(2)])))
    ).toMatchSnapshot();
  });
});

describe("object", () => {
  it("empty", () => {
    expect(combine(object({}))).toMatchSnapshot();
  });

  it("of a single value property", () => {
    expect(combine(object({ a: value("A") }))).toMatchSnapshot();
  });

  it("of a several value properties", () => {
    expect(
      combine(object({ a: value("A"), b: value("B"), c: value("C") }))
    ).toMatchSnapshot();
  });

  it("of a single union property", () => {
    expect(
      combine(object({ a: union([value("A1"), value("A2")]) }))
    ).toMatchSnapshot();
  });

  it("of a several union properties", () => {
    expect(
      combine(
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
      combine(
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
      combine(
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
      combine(
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
      combine(
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

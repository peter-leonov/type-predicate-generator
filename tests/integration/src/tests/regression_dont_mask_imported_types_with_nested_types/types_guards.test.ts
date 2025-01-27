import { expect, describe, it } from "vitest";
import { isX, isObjectInY } from "./types_guards";
const invalidValue: any = Symbol("invalidValue");
const valid_ObjectInY = [{ b: "" }, { b: "string" }];
const invalid_ObjectInY = [invalidValue, null, { b: invalidValue }, {}];
describe("ObjectInY", () => {
  it.for(valid_ObjectInY)("valid", (value: unknown) => {
    expect(isObjectInY(value)).toBe(true);
  });
  it.for(invalid_ObjectInY)("invalid", (value: unknown) => {
    expect(isObjectInY(value)).toBe(false);
  });
});
const valid_X = [{ Y: undefined }, { Y: { a: valid_ObjectInY[0] } }, {}];
const invalid_X = [
  invalidValue,
  null,
  { Y: invalidValue },
  { Y: null },
  { Y: { a: invalid_ObjectInY[0] } },
  { Y: {} },
];
describe("X", () => {
  it.for(valid_X)("valid", (value: unknown) => {
    expect(isX(value)).toBe(true);
  });
  it.for(invalid_X)("invalid", (value: unknown) => {
    expect(isX(value)).toBe(false);
  });
});

import { expect, test } from "vitest";
import { isFoo } from "./guards";

test("valid", () => {
  expect(isFoo(1)).toBe(true);
});

test("invalid", () => {
  expect(isFoo("string")).toBe(false);
});

import { expect, test } from "vitest";
import { factory } from "typescript";
import { valueToNode } from "./serializer";
import { nodesToString } from "./compile";
import { type Value } from "./combinator";

function process(value: Value): string {
  return nodesToString("foo", [
    factory.createExpressionStatement(
      factory.createParenthesizedExpression(valueToNode(value))
    ),
  ]);
}

test("number", () => {
  expect(process(42)).toMatchSnapshot();
});

test("string", () => {
  expect(process("foo")).toMatchSnapshot();
});

test("boolean", () => {
  expect(process(true)).toMatchSnapshot();
  expect(process(false)).toMatchSnapshot();
});

test("array", () => {
  expect(process([])).toMatchSnapshot();
  expect(process([1, 2, 3])).toMatchSnapshot();
});

test("object", () => {
  expect(process({})).toMatchSnapshot();
  expect(process({ a: 1, b: 2, c: 3 })).toMatchSnapshot();
});

test("nested", () => {
  expect(process({ a: [1], b: { c: { d: 4 } } })).toMatchSnapshot();
});

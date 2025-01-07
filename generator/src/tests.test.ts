import { expect, test } from "vitest";
import {
  array,
  combine,
  object,
  union,
  value,
  type Value,
} from "./tests";

test(combine, () => {
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

import { expect, test } from "vitest";
import { combine } from "./tests";

test(combine, () => {
  expect(combine()).toMatchSnapshot();
});

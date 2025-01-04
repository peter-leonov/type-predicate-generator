import { expect, test } from "vitest";
import { generateTypeGuards } from "./index";

test(generateTypeGuards, () => {
  expect(
    generateTypeGuards("export type X = number", "./foo")
  ).toMatchSnapshot();
});

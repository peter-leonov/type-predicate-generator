import { expect, test } from "vitest";
import { generateForPlayground } from "./index";

test(generateForPlayground, () => {
  expect(
    generateForPlayground("export type X = number", "./foo")
  ).toMatchSnapshot();
});

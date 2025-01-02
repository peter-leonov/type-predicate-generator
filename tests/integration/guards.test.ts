import { expect, test } from "vitest";

import { isUser } from "./guards";

test("valid User", () => {
  expect(isUser({})).toBe(true);
});

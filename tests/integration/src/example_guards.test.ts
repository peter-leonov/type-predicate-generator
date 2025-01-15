import { expect, describe, it } from "vitest";
import { isUser } from "./example_guards";
const invalidValue: any = Symbol("invalidValue");
const valid_User = [
  { id: 0, login: "", email: undefined, address: undefined },
  { id: 42, login: "", email: undefined, address: undefined },
  { id: 42, login: "string", email: undefined, address: undefined },
  { id: 42, login: "string", email: "", address: undefined },
  { id: 42, login: "string", email: "string", address: undefined },
  { id: 42, login: "string", address: undefined },
  {
    id: 42,
    login: "string",
    email: "string",
    address: { street: "", house: 0 },
  },
  {
    id: 42,
    login: "string",
    email: "string",
    address: { street: "string", house: 0 },
  },
  {
    id: 42,
    login: "string",
    email: "string",
    address: { street: "string", house: 42 },
  },
  { id: 42, login: "string", email: "string" },
];
const invalid_User = [
  invalidValue,
  null,
  { id: invalidValue, login: "", email: undefined, address: undefined },
  { login: "", email: undefined, address: undefined },
  { id: 0, login: invalidValue, email: undefined, address: undefined },
  { id: 42, login: invalidValue, email: undefined, address: undefined },
  { id: 42, email: undefined, address: undefined },
  { id: 42, login: "", email: invalidValue, address: undefined },
  { id: 42, login: "string", email: invalidValue, address: undefined },
  { id: 42, login: "string", email: undefined, address: invalidValue },
  { id: 42, login: "string", email: "", address: invalidValue },
  { id: 42, login: "string", email: "string", address: invalidValue },
  { id: 42, login: "string", email: "string", address: null },
  {
    id: 42,
    login: "string",
    email: "string",
    address: { street: invalidValue, house: 0 },
  },
  { id: 42, login: "string", email: "string", address: { house: 0 } },
  {
    id: 42,
    login: "string",
    email: "string",
    address: { street: "", house: invalidValue },
  },
  {
    id: 42,
    login: "string",
    email: "string",
    address: { street: "string", house: invalidValue },
  },
  { id: 42, login: "string", email: "string", address: { street: "string" } },
];
describe("User", () => {
  it.for(valid_User)("valid", (value: unknown) => {
    expect(isUser(value)).toBe(true);
  });
  it.for(invalid_User)("invalid", (value: unknown) => {
    expect(isUser(value)).toBe(false);
  });
});

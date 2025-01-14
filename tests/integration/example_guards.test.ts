import { expect, describe, it } from "vitest";
import { isUser } from "./example_guards";
const invalidValue: any = Symbol("invalidValue");
const valid_User = [
  { id: 0, login: "", email: undefined, address: { street: "", house: 0 } },
  { id: 42, login: "", email: undefined, address: { street: "", house: 0 } },
  {
    id: 42,
    login: "string",
    email: undefined,
    address: { street: "", house: 0 },
  },
  { id: 42, login: "string", email: "", address: { street: "", house: 0 } },
  {
    id: 42,
    login: "string",
    email: "string",
    address: { street: "", house: 0 },
  },
  { id: 42, login: "string", address: { street: "", house: 0 } },
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
];
const invalid_User = [
  invalidValue,
  null,
  {
    id: invalidValue,
    login: "",
    email: undefined,
    address: { street: "", house: 0 },
  },
  { login: "", email: undefined, address: { street: "", house: 0 } },
  {
    id: 0,
    login: invalidValue,
    email: undefined,
    address: { street: "", house: 0 },
  },
  {
    id: 42,
    login: invalidValue,
    email: undefined,
    address: { street: "", house: 0 },
  },
  { id: 42, email: undefined, address: { street: "", house: 0 } },
  { id: 42, login: "", email: invalidValue, address: { street: "", house: 0 } },
  {
    id: 42,
    login: "string",
    email: invalidValue,
    address: { street: "", house: 0 },
  },
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
  { id: 42, login: "string", email: "string" },
];
describe("User", () => {
  it.for(valid_User)("valid", (value: unknown) => {
    expect(isUser(value)).toBe(true);
  });
  it.for(invalid_User)("invalid", (value: unknown) => {
    expect(isUser(value)).toBe(false);
  });
});

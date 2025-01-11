import { expect, describe, it } from "vitest";
import { isExternalType, isUser, isPost } from "./types_guards";
const invalidValue: any = Symbol("invalidValue");
const valid_ExternalType = [{ id: "string", body: "string" }];
const invalid_ExternalType = [
  null,
  { body: "string" },
  { id: invalidValue, body: "string" },
  { id: "string" },
  { id: "string", body: invalidValue },
];
describe("ExternalType", () => {
  it.for(valid_ExternalType)("valid", (value: unknown) => {
    expect(isExternalType(value)).toBe(true);
  });
  it.for(invalid_ExternalType)("invalid", (value: unknown) => {
    expect(isExternalType(value)).toBe(false);
  });
});
const valid_User = [
  {
    id: 0,
    login: "string",
    bio: { first: "string", last: "string" },
    external: valid_ExternalType[0],
  },
  {
    id: 42,
    login: "string",
    bio: { first: "string", last: "string" },
    external: valid_ExternalType[0],
  },
];
const invalid_User = [
  null,
  {
    login: "string",
    bio: { first: "string", last: "string" },
    external: valid_ExternalType[0],
  },
  {
    id: invalidValue,
    login: "string",
    bio: { first: "string", last: "string" },
    external: valid_ExternalType[0],
  },
  {
    id: 0,
    bio: { first: "string", last: "string" },
    external: valid_ExternalType[0],
  },
  {
    id: 0,
    login: invalidValue,
    bio: { first: "string", last: "string" },
    external: valid_ExternalType[0],
  },
  { id: 0, login: "string", external: valid_ExternalType[0] },
  { id: 0, login: "string", bio: null, external: valid_ExternalType[0] },
  {
    id: 0,
    login: "string",
    bio: { last: "string" },
    external: valid_ExternalType[0],
  },
  {
    id: 0,
    login: "string",
    bio: { first: invalidValue, last: "string" },
    external: valid_ExternalType[0],
  },
  {
    id: 0,
    login: "string",
    bio: { first: "string" },
    external: valid_ExternalType[0],
  },
  {
    id: 0,
    login: "string",
    bio: { first: "string", last: invalidValue },
    external: valid_ExternalType[0],
  },
  { id: 0, login: "string", bio: { first: "string", last: "string" } },
  {
    id: 0,
    login: "string",
    bio: { first: "string", last: "string" },
    external: invalid_ExternalType[0],
  },
  {
    id: 42,
    bio: { first: "string", last: "string" },
    external: valid_ExternalType[0],
  },
  {
    id: 42,
    login: invalidValue,
    bio: { first: "string", last: "string" },
    external: valid_ExternalType[0],
  },
  { id: 42, login: "string", external: valid_ExternalType[0] },
  { id: 42, login: "string", bio: null, external: valid_ExternalType[0] },
  {
    id: 42,
    login: "string",
    bio: { last: "string" },
    external: valid_ExternalType[0],
  },
  {
    id: 42,
    login: "string",
    bio: { first: invalidValue, last: "string" },
    external: valid_ExternalType[0],
  },
  {
    id: 42,
    login: "string",
    bio: { first: "string" },
    external: valid_ExternalType[0],
  },
  {
    id: 42,
    login: "string",
    bio: { first: "string", last: invalidValue },
    external: valid_ExternalType[0],
  },
  { id: 42, login: "string", bio: { first: "string", last: "string" } },
  {
    id: 42,
    login: "string",
    bio: { first: "string", last: "string" },
    external: invalid_ExternalType[0],
  },
];
describe("User", () => {
  it.for(valid_User)("valid", (value: unknown) => {
    expect(isUser(value)).toBe(true);
  });
  it.for(invalid_User)("invalid", (value: unknown) => {
    expect(isUser(value)).toBe(false);
  });
});
const valid_Post = [
  {
    title: "string",
    text: "string",
    published: true,
    author: valid_User[0],
    more: [],
  },
  {
    title: "string",
    text: "string",
    published: true,
    author: valid_User[0],
    more: ["string"],
  },
  {
    title: "string",
    text: "string",
    published: true,
    author: valid_User[0],
    more: [0],
  },
  {
    title: "string",
    text: "string",
    published: true,
    author: valid_User[0],
    more: [42],
  },
  {
    title: "string",
    text: "string",
    published: false,
    author: valid_User[0],
    more: [],
  },
  {
    title: "string",
    text: "string",
    published: false,
    author: valid_User[0],
    more: ["string"],
  },
  {
    title: "string",
    text: "string",
    published: false,
    author: valid_User[0],
    more: [0],
  },
  {
    title: "string",
    text: "string",
    published: false,
    author: valid_User[0],
    more: [42],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: true,
    author: valid_User[0],
    more: [],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: true,
    author: valid_User[0],
    more: ["string"],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: true,
    author: valid_User[0],
    more: [0],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: true,
    author: valid_User[0],
    more: [42],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: false,
    author: valid_User[0],
    more: [],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: false,
    author: valid_User[0],
    more: ["string"],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: false,
    author: valid_User[0],
    more: [0],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: false,
    author: valid_User[0],
    more: [42],
  },
];
const invalid_Post = [
  null,
  { text: "string", published: true, author: valid_User[0], more: [] },
  {
    title: invalidValue,
    text: "string",
    published: true,
    author: valid_User[0],
    more: [],
  },
  { title: "string", published: true, author: valid_User[0], more: [] },
  {
    title: "string",
    text: invalidValue,
    published: true,
    author: valid_User[0],
    more: [],
  },
  {
    title: "string",
    text: "string",
    link: invalidValue,
    published: true,
    author: valid_User[0],
    more: [],
  },
  { title: "string", text: "string", author: valid_User[0], more: [] },
  {
    title: "string",
    text: "string",
    published: invalidValue,
    author: valid_User[0],
    more: [],
  },
  { title: "string", text: "string", published: true, more: [] },
  {
    title: "string",
    text: "string",
    published: true,
    author: invalid_User[0],
    more: [],
  },
  { title: "string", text: "string", published: true, author: valid_User[0] },
  {
    title: "string",
    text: "string",
    published: true,
    author: valid_User[0],
    more: invalidValue,
  },
  {
    title: "string",
    text: "string",
    published: true,
    author: valid_User[0],
    more: [invalidValue],
  },
  { title: "string", text: "string", published: false, more: [] },
  {
    title: "string",
    text: "string",
    published: false,
    author: invalid_User[0],
    more: [],
  },
  { title: "string", text: "string", published: false, author: valid_User[0] },
  {
    title: "string",
    text: "string",
    published: false,
    author: valid_User[0],
    more: invalidValue,
  },
  {
    title: "string",
    text: "string",
    published: false,
    author: valid_User[0],
    more: [invalidValue],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    author: valid_User[0],
    more: [],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: invalidValue,
    author: valid_User[0],
    more: [],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: true,
    more: [],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: true,
    author: invalid_User[0],
    more: [],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: true,
    author: valid_User[0],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: true,
    author: valid_User[0],
    more: invalidValue,
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: true,
    author: valid_User[0],
    more: [invalidValue],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: false,
    more: [],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: false,
    author: invalid_User[0],
    more: [],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: false,
    author: valid_User[0],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: false,
    author: valid_User[0],
    more: invalidValue,
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: false,
    author: valid_User[0],
    more: [invalidValue],
  },
];
describe("Post", () => {
  it.for(valid_Post)("valid", (value: unknown) => {
    expect(isPost(value)).toBe(true);
  });
  it.for(invalid_Post)("invalid", (value: unknown) => {
    expect(isPost(value)).toBe(false);
  });
});

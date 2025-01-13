import { expect, describe, it } from "vitest";
import { isExternalType, isUser, isPost } from "./types_guards";
const invalidValue: any = Symbol("invalidValue");
const valid_ExternalType = [
  { id: "", body: "" },
  { id: "", body: "string" },
  { id: "string", body: "" },
];
const invalid_ExternalType = [
  invalidValue,
  null,
  { body: "" },
  { id: invalidValue, body: "" },
  { id: "" },
  { id: "", body: invalidValue },
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
    login: "",
    bio: { first: "", last: "" },
    external: valid_ExternalType[0],
  },
  {
    id: 0,
    login: "",
    bio: { first: "", last: "string" },
    external: valid_ExternalType[0],
  },
  {
    id: 0,
    login: "",
    bio: { first: "string", last: "" },
    external: valid_ExternalType[0],
  },
  {
    id: 0,
    login: "string",
    bio: { first: "", last: "" },
    external: valid_ExternalType[0],
  },
  {
    id: 42,
    login: "",
    bio: { first: "", last: "" },
    external: valid_ExternalType[0],
  },
];
const invalid_User = [
  invalidValue,
  null,
  { login: "", bio: { first: "", last: "" }, external: valid_ExternalType[0] },
  {
    id: invalidValue,
    login: "",
    bio: { first: "", last: "" },
    external: valid_ExternalType[0],
  },
  { id: 0, bio: { first: "", last: "" }, external: valid_ExternalType[0] },
  {
    id: 0,
    login: invalidValue,
    bio: { first: "", last: "" },
    external: valid_ExternalType[0],
  },
  { id: 0, login: "", external: valid_ExternalType[0] },
  { id: 0, login: "", bio: invalidValue, external: valid_ExternalType[0] },
  { id: 0, login: "", bio: null, external: valid_ExternalType[0] },
  { id: 0, login: "", bio: { last: "" }, external: valid_ExternalType[0] },
  {
    id: 0,
    login: "",
    bio: { first: invalidValue, last: "" },
    external: valid_ExternalType[0],
  },
  { id: 0, login: "", bio: { first: "" }, external: valid_ExternalType[0] },
  {
    id: 0,
    login: "",
    bio: { first: "", last: invalidValue },
    external: valid_ExternalType[0],
  },
  { id: 0, login: "", bio: { first: "", last: "" } },
  {
    id: 0,
    login: "",
    bio: { first: "", last: "" },
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
  { title: "", text: "", published: true, author: valid_User[0], more: [] },
  {
    title: "",
    text: "",
    link: undefined,
    published: true,
    author: valid_User[0],
    more: [],
  },
  {
    title: "",
    text: "",
    link: undefined,
    published: true,
    author: valid_User[0],
    more: [""],
  },
  {
    title: "",
    text: "",
    link: undefined,
    published: true,
    author: valid_User[0],
    more: ["string"],
  },
  {
    title: "",
    text: "",
    link: undefined,
    published: true,
    author: valid_User[0],
    more: [0],
  },
  {
    title: "",
    text: "",
    link: undefined,
    published: true,
    author: valid_User[0],
    more: [42],
  },
  {
    title: "",
    text: "",
    link: undefined,
    published: false,
    author: valid_User[0],
    more: [],
  },
  {
    title: "",
    text: "",
    link: "",
    published: true,
    author: valid_User[0],
    more: [],
  },
  {
    title: "",
    text: "",
    link: "string",
    published: true,
    author: valid_User[0],
    more: [],
  },
  {
    title: "",
    text: "string",
    published: true,
    author: valid_User[0],
    more: [],
  },
  {
    title: "string",
    text: "",
    published: true,
    author: valid_User[0],
    more: [],
  },
];
const invalid_Post = [
  invalidValue,
  null,
  { text: "", published: true, author: valid_User[0], more: [] },
  {
    title: invalidValue,
    text: "",
    published: true,
    author: valid_User[0],
    more: [],
  },
  { title: "", published: true, author: valid_User[0], more: [] },
  {
    title: "",
    text: invalidValue,
    published: true,
    author: valid_User[0],
    more: [],
  },
  {
    title: "",
    text: "",
    link: invalidValue,
    published: true,
    author: valid_User[0],
    more: [],
  },
  { title: "", text: "", link: undefined, author: valid_User[0], more: [] },
  {
    title: "",
    text: "",
    link: undefined,
    published: invalidValue,
    author: valid_User[0],
    more: [],
  },
  { title: "", text: "", link: undefined, published: true, more: [] },
  {
    title: "",
    text: "",
    link: undefined,
    published: true,
    author: invalid_User[0],
    more: [],
  },
  {
    title: "",
    text: "",
    link: undefined,
    published: true,
    author: valid_User[0],
  },
  {
    title: "",
    text: "",
    link: undefined,
    published: true,
    author: valid_User[0],
    more: invalidValue,
  },
  {
    title: "",
    text: "",
    link: undefined,
    published: true,
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

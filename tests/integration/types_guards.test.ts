import { expect, describe, it } from "vitest";

import { isPost, isUser } from "./types_guards";

const validUser = [
  {
    id: 1,
    login: "string",
    bio: {
      first: "string",
      last: "string",
    },
  },
  {
    _extra: 1,
    id: 1,
    login: "string",
    bio: {
      _extra: 1,
      first: "string",
      last: "string",
    },
  },
];

const invalidUser = [
  null,
  {},
  {
    login: "string",
    bio: {
      first: "string",
      last: "string",
    },
  },
  {
    id: 1,
    bio: {
      first: "string",
      last: "string",
    },
  },
  {
    id: 1,
    login: "string",
  },
  {
    id: 1,
    login: "string",
    bio: null,
  },
  {
    id: 1,
    login: "string",
    bio: {},
  },
  {
    id: 1,
    login: "string",
    bio: {
      last: "string",
    },
  },
  {
    id: 1,
    login: "string",
    bio: {
      first: "string",
    },
  },

  {
    id: "string",
    login: "string",
    bio: {
      first: "string",
      last: "string",
    },
  },
  {
    id: 1,
    login: 1,
    bio: {
      first: "string",
      last: "string",
    },
  },
  {
    id: 1,
    login: "string",
    bio: 1,
  },
  {
    id: 1,
    login: "string",
    bio: {
      first: 1,
      last: "string",
    },
  },
  {
    id: 1,
    login: "string",
    bio: {
      first: "string",
      last: 1,
    },
  },
];

describe(isUser, () => {
  it.for(validUser)("valid", (value) => {
    expect(isUser(value)).toBe(true);
  });
  it.for(invalidUser)("invalid", (value) => {
    expect(isUser(value)).toBe(false);
  });
});

const validPost = [
  {
    title: "string",
    text: "string",
    link: "string",
    published: true,
    author: validUser[0],
    more: [1],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: false,
    author: validUser[0],
    more: [1],
  },
  {
    title: "string",
    text: "string",
    published: true,
    author: validUser[0],
    more: [1],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: true,
    author: validUser[0],
    more: ["string"],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: true,
    author: validUser[0],
    more: ["string", 1],
  },
];

const invalidPost = [
  null,
  {
    text: "string",
    link: "string",
    published: true,
    author: validUser[0],
    more: [1],
  },
  {
    title: "string",
    link: "string",
    published: true,
    author: validUser[0],
    more: [1],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    author: validUser[0],
    more: [1],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: true,
    more: [1],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: true,
    author: validUser[0],
  },
  {
    title: 1,
    text: "string",
    link: "string",
    published: true,
    author: validUser[0],
    more: [1],
  },
  {
    title: "string",
    text: 1,
    link: "string",
    published: true,
    author: validUser[0],
    more: [1],
  },
  {
    title: "string",
    text: "string",
    link: 1,
    published: true,
    author: validUser[0],
    more: [1],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: 1,
    author: validUser[0],
    more: [1],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: true,
    author: invalidUser[0],
    more: [1],
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: true,
    author: validUser[0],
    more: null,
  },
  {
    title: "string",
    text: "string",
    link: "string",
    published: true,
    author: validUser[0],
    more: [true],
  },
];

describe(isPost, () => {
  it.for(validPost)("valid", (value) => {
    expect(isPost(value)).toBe(true);
  });
  it.for(invalidPost)("invalid", (value) => {
    expect(isPost(value)).toBe(false);
  });
});

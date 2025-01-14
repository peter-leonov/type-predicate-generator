import {
  type ExternalType,
  type User,
  type Post,
  type HugeOnCombinations,
} from "./types";
type SafeShallowShape<Type extends {}> = {
  [_ in keyof Type]?: unknown;
};
const safeIsArray: (v: unknown) => v is unknown[] = Array.isArray;
export function isExternalType(root: unknown): root is ExternalType {
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  root satisfies {};
  const { id, body }: SafeShallowShape<ExternalType> = root;
  if (!(typeof id === "string")) {
    return false;
  }
  if (!(typeof body === "string")) {
    return false;
  }
  ({
    id,
    body,
  }) satisfies ExternalType;
  return true;
}
export function isUser(root: unknown): root is User {
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  root satisfies {};
  const { id, login, bio, external }: SafeShallowShape<User> = root;
  if (!(typeof id === "number")) {
    return false;
  }
  if (!(typeof login === "string")) {
    return false;
  }
  if (!(typeof bio === "object" && bio !== null)) {
    return false;
  }
  bio satisfies {};
  const { first, last }: SafeShallowShape<User["bio"]> = bio;
  if (!(typeof first === "string")) {
    return false;
  }
  if (!(typeof last === "string")) {
    return false;
  }
  if (!isExternalType(external)) {
    return false;
  }
  ({
    id,
    login,
    bio: {
      first,
      last,
    },
    external,
  }) satisfies User;
  return true;
}
export function isPost(root: unknown): root is Post {
  type Element = Post["more"][number];
  function isElement(root: unknown): root is Element {
    if (!(typeof root === "string" || typeof root === "number")) {
      return false;
    }
    root satisfies Element;
    return true;
  }
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  root satisfies {};
  const { title, text, link, published, author, more }: SafeShallowShape<Post> =
    root;
  if (!(typeof title === "string")) {
    return false;
  }
  if (!(typeof text === "string")) {
    return false;
  }
  if (!(typeof link === "undefined" || typeof link === "string")) {
    return false;
  }
  if (!(typeof published === "boolean")) {
    return false;
  }
  if (!isUser(author)) {
    return false;
  }
  if (!(safeIsArray(more) && more.every(isElement))) {
    return false;
  }
  ({
    title,
    text,
    link,
    published,
    author,
    more,
  }) satisfies Post;
  return true;
}
export function isHugeOnCombinations(
  root: unknown,
): root is HugeOnCombinations {
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  root satisfies {};
  const {
    a,
    b,
    c,
    d,
    e,
    f,
    g,
    h,
    i,
    j,
    k,
    l,
    m,
    n,
    o,
    p,
    q,
  }: SafeShallowShape<HugeOnCombinations> = root;
  if (!(typeof a === "undefined" || typeof a === "string")) {
    return false;
  }
  if (!(typeof b === "undefined" || typeof b === "string")) {
    return false;
  }
  if (!(typeof c === "undefined" || typeof c === "string")) {
    return false;
  }
  if (!(typeof d === "undefined" || typeof d === "string")) {
    return false;
  }
  if (!(typeof e === "undefined" || typeof e === "string")) {
    return false;
  }
  if (!(typeof f === "undefined" || typeof f === "string")) {
    return false;
  }
  if (!(typeof g === "undefined" || typeof g === "string")) {
    return false;
  }
  if (!(typeof h === "undefined" || typeof h === "string")) {
    return false;
  }
  if (!(typeof i === "undefined" || typeof i === "string")) {
    return false;
  }
  if (!(typeof j === "undefined" || typeof j === "string")) {
    return false;
  }
  if (!(typeof k === "undefined" || typeof k === "string")) {
    return false;
  }
  if (!(typeof l === "undefined" || typeof l === "string")) {
    return false;
  }
  if (!(typeof m === "undefined" || typeof m === "string")) {
    return false;
  }
  if (!(typeof n === "undefined" || typeof n === "string")) {
    return false;
  }
  if (!(typeof o === "undefined" || typeof o === "string")) {
    return false;
  }
  if (!(typeof p === "undefined" || typeof p === "string")) {
    return false;
  }
  if (!(typeof q === "undefined" || typeof q === "string")) {
    return false;
  }
  ({
    a,
    b,
    c,
    d,
    e,
    f,
    g,
    h,
    i,
    j,
    k,
    l,
    m,
    n,
    o,
    p,
    q,
  }) satisfies HugeOnCombinations;
  return true;
}

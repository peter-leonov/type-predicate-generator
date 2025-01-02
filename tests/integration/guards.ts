import { type User, type Post } from "./types.ts";
type SafeShallowShape<Type> = {
  [_ in keyof Type]?: unknown;
};
const safeIsArray: (v: unknown) => v is unknown[] = Array.isArray;
function ensureType<T>(_: T) {}
export function isUser(root: unknown): root is User {
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  const { id, login, bio }: SafeShallowShape<User> = root;
  if (!(typeof id === "number")) {
    return false;
  }
  if (!(typeof login === "string")) {
    return false;
  }
  if (!(typeof bio === "object" && bio !== null)) {
    return false;
  }
  const { first, last }: SafeShallowShape<User["bio"]> = bio;
  if (!(typeof first === "string")) {
    return false;
  }
  if (!(typeof last === "string")) {
    return false;
  }
  ensureType<User>({
    id,
    login,
    bio: {
      first,
      last,
    },
  });
  return true;
}
export function isPost(root: unknown): root is Post {
  type Element = Post["list"][number];
  function isElement(root: unknown): root is Element {
    if (!(typeof root === "string" || typeof root === "number")) {
      return false;
    }
    ensureType<Element>(root);
    return true;
  }
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  const { title, text, link, published, author, list }: SafeShallowShape<Post> =
    root;
  if (!(typeof title === "string")) {
    return false;
  }
  if (!(typeof text === "string")) {
    return false;
  }
  if (!(link === undefined || typeof link === "string")) {
    return false;
  }
  if (!(typeof published === "boolean")) {
    return false;
  }
  if (!isUser(author)) {
    return false;
  }
  if (!(safeIsArray(list) && list.every(isElement))) {
    return false;
  }
  ensureType<Post>({
    title,
    text,
    link,
    published,
    author,
    list,
  });
  return true;
}

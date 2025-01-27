import {
  type ExternalType,
  type User,
  type Post,
  type HugeOnCombinations,
} from "./types";
// used to safely get all the object attributes as `unknown`s
type SafeShallowShape<Type extends {}> = {
  [_ in keyof Type]?: unknown;
};
const safeIsArray: (v: unknown) => v is unknown[] = Array.isArray;
export function isExternalType(root: unknown): root is ExternalType {
  // check that `root` is an object
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  root satisfies {};
  // safely get all the attributes from `root` as `unknown`s
  const { id, body }: SafeShallowShape<ExternalType> = root;
  // check that `root.id` is of primitive type `string`
  if (!(typeof id === "string")) {
    return false;
  }
  // check that `root.body` is of primitive type `string`
  if (!(typeof body === "string")) {
    return false;
  }
  /*
      In TypeScript the `never` type is assignable to any other type,
      effectively turning it into an unsafe `any` type at assignment.
      The following checks ensure that none of the checked values got
      narrowed down to `never`.
    */
  // @ts-expect-error: should not be `never`
  root satisfies never;
  // @ts-expect-error: should not be `never`
  isExternalType satisfies never;
  // @ts-expect-error: should not be `never`
  id satisfies never;
  // @ts-expect-error: should not be `never`
  body satisfies never;
  /*
      Verify that all the predicates above narrowed all the types
      down to the root type that is being checked by the predicate.
      This is the key check that makes the whole type predicate safe.
    */
  ({
    id,
    body,
  }) satisfies ExternalType;
  return true;
}
export function isUser(root: unknown): root is User {
  // check that `root` is an object
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  root satisfies {};
  // safely get all the attributes from `root` as `unknown`s
  const { id, login, bio, external }: SafeShallowShape<User> = root;
  // check that `root.id` is of primitive type `number`
  if (!(typeof id === "number")) {
    return false;
  }
  // check that `root.login` is of primitive type `string`
  if (!(typeof login === "string")) {
    return false;
  }
  // check that `root.bio` is an object
  if (!(typeof bio === "object" && bio !== null)) {
    return false;
  }
  bio satisfies {};
  // safely get all the attributes from `root.bio` as `unknown`s
  const { first, last }: SafeShallowShape<User["bio"]> = bio;
  // check that `root.bio.first` is of primitive type `string`
  if (!(typeof first === "string")) {
    return false;
  }
  // check that `root.bio.last` is of primitive type `string`
  if (!(typeof last === "string")) {
    return false;
  }
  // check that `root.external` is of type ExternalType
  if (!isExternalType(external)) {
    return false;
  }
  /*
      In TypeScript the `never` type is assignable to any other type,
      effectively turning it into an unsafe `any` type at assignment.
      The following checks ensure that none of the checked values got
      narrowed down to `never`.
    */
  // @ts-expect-error: should not be `never`
  root satisfies never;
  // @ts-expect-error: should not be `never`
  isUser satisfies never;
  // @ts-expect-error: should not be `never`
  id satisfies never;
  // @ts-expect-error: should not be `never`
  login satisfies never;
  // @ts-expect-error: should not be `never`
  bio satisfies never;
  // @ts-expect-error: should not be `never`
  external satisfies never;
  // @ts-expect-error: should not be `never`
  first satisfies never;
  // @ts-expect-error: should not be `never`
  last satisfies never;
  /*
      Verify that all the predicates above narrowed all the types
      down to the root type that is being checked by the predicate.
      This is the key check that makes the whole type predicate safe.
    */
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
  type MoreElement = Post["more"][number];
  function isMoreElement(root: unknown): root is MoreElement {
    // check that `root` is in the union of 2 trivial types
    if (!(typeof root === "string" || typeof root === "number")) {
      return false;
    }
    /*
          In TypeScript the `never` type is assignable to any other type,
          effectively turning it into an unsafe `any` type at assignment.
          The following checks ensure that none of the checked values got
          narrowed down to `never`.
        */
    // @ts-expect-error: should not be `never`
    root satisfies never;
    /*
          Verify that all the predicates above narrowed all the types
          down to the root type that is being checked by the predicate.
          This is the key check that makes the whole type predicate safe.
        */
    root satisfies MoreElement;
    return true;
  }
  // check that `root` is an object
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  root satisfies {};
  // safely get all the attributes from `root` as `unknown`s
  const { title, text, link, published, author, more }: SafeShallowShape<Post> =
    root;
  // check that `root.title` is of primitive type `string`
  if (!(typeof title === "string")) {
    return false;
  }
  // check that `root.text` is of primitive type `string`
  if (!(typeof text === "string")) {
    return false;
  }
  // check that `root.link` is in the union of 2 trivial types
  if (!(typeof link === "undefined" || typeof link === "string")) {
    return false;
  }
  // check that `root.published` is of primitive type `boolean`
  if (!(typeof published === "boolean")) {
    return false;
  }
  // check that `root.author` is of type User
  if (!isUser(author)) {
    return false;
  }
  // check that `root.more` is an array of nested type `MoreElement` (`Post["more"]`)
  if (!(safeIsArray(more) && more.every(isMoreElement))) {
    return false;
  }
  /*
      In TypeScript the `never` type is assignable to any other type,
      effectively turning it into an unsafe `any` type at assignment.
      The following checks ensure that none of the checked values got
      narrowed down to `never`.
    */
  // @ts-expect-error: should not be `never`
  root satisfies never;
  // @ts-expect-error: should not be `never`
  isPost satisfies never;
  // @ts-expect-error: should not be `never`
  title satisfies never;
  // @ts-expect-error: should not be `never`
  text satisfies never;
  // @ts-expect-error: should not be `never`
  link satisfies never;
  // @ts-expect-error: should not be `never`
  published satisfies never;
  // @ts-expect-error: should not be `never`
  author satisfies never;
  // @ts-expect-error: should not be `never`
  more satisfies never;
  // @ts-expect-error: should not be `never`
  isMoreElement satisfies never;
  /*
      Verify that all the predicates above narrowed all the types
      down to the root type that is being checked by the predicate.
      This is the key check that makes the whole type predicate safe.
    */
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
  // check that `root` is an object
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  root satisfies {};
  // safely get all the attributes from `root` as `unknown`s
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
  // check that `root.a` is in the union of 2 trivial types
  if (!(typeof a === "undefined" || typeof a === "string")) {
    return false;
  }
  // check that `root.b` is in the union of 2 trivial types
  if (!(typeof b === "undefined" || typeof b === "string")) {
    return false;
  }
  // check that `root.c` is in the union of 2 trivial types
  if (!(typeof c === "undefined" || typeof c === "string")) {
    return false;
  }
  // check that `root.d` is in the union of 2 trivial types
  if (!(typeof d === "undefined" || typeof d === "string")) {
    return false;
  }
  // check that `root.e` is in the union of 2 trivial types
  if (!(typeof e === "undefined" || typeof e === "string")) {
    return false;
  }
  // check that `root.f` is in the union of 2 trivial types
  if (!(typeof f === "undefined" || typeof f === "string")) {
    return false;
  }
  // check that `root.g` is in the union of 2 trivial types
  if (!(typeof g === "undefined" || typeof g === "string")) {
    return false;
  }
  // check that `root.h` is in the union of 2 trivial types
  if (!(typeof h === "undefined" || typeof h === "string")) {
    return false;
  }
  // check that `root.i` is in the union of 2 trivial types
  if (!(typeof i === "undefined" || typeof i === "string")) {
    return false;
  }
  // check that `root.j` is in the union of 2 trivial types
  if (!(typeof j === "undefined" || typeof j === "string")) {
    return false;
  }
  // check that `root.k` is in the union of 2 trivial types
  if (!(typeof k === "undefined" || typeof k === "string")) {
    return false;
  }
  // check that `root.l` is in the union of 2 trivial types
  if (!(typeof l === "undefined" || typeof l === "string")) {
    return false;
  }
  // check that `root.m` is in the union of 2 trivial types
  if (!(typeof m === "undefined" || typeof m === "string")) {
    return false;
  }
  // check that `root.n` is in the union of 2 trivial types
  if (!(typeof n === "undefined" || typeof n === "string")) {
    return false;
  }
  // check that `root.o` is in the union of 2 trivial types
  if (!(typeof o === "undefined" || typeof o === "string")) {
    return false;
  }
  // check that `root.p` is in the union of 2 trivial types
  if (!(typeof p === "undefined" || typeof p === "string")) {
    return false;
  }
  // check that `root.q` is in the union of 2 trivial types
  if (!(typeof q === "undefined" || typeof q === "string")) {
    return false;
  }
  /*
      In TypeScript the `never` type is assignable to any other type,
      effectively turning it into an unsafe `any` type at assignment.
      The following checks ensure that none of the checked values got
      narrowed down to `never`.
    */
  // @ts-expect-error: should not be `never`
  root satisfies never;
  // @ts-expect-error: should not be `never`
  isHugeOnCombinations satisfies never;
  // @ts-expect-error: should not be `never`
  a satisfies never;
  // @ts-expect-error: should not be `never`
  b satisfies never;
  // @ts-expect-error: should not be `never`
  c satisfies never;
  // @ts-expect-error: should not be `never`
  d satisfies never;
  // @ts-expect-error: should not be `never`
  e satisfies never;
  // @ts-expect-error: should not be `never`
  f satisfies never;
  // @ts-expect-error: should not be `never`
  g satisfies never;
  // @ts-expect-error: should not be `never`
  h satisfies never;
  // @ts-expect-error: should not be `never`
  i satisfies never;
  // @ts-expect-error: should not be `never`
  j satisfies never;
  // @ts-expect-error: should not be `never`
  k satisfies never;
  // @ts-expect-error: should not be `never`
  l satisfies never;
  // @ts-expect-error: should not be `never`
  m satisfies never;
  // @ts-expect-error: should not be `never`
  n satisfies never;
  // @ts-expect-error: should not be `never`
  o satisfies never;
  // @ts-expect-error: should not be `never`
  p satisfies never;
  // @ts-expect-error: should not be `never`
  q satisfies never;
  /*
      Verify that all the predicates above narrowed all the types
      down to the root type that is being checked by the predicate.
      This is the key check that makes the whole type predicate safe.
    */
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

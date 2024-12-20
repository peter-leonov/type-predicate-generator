# TypeScript Type Guard Generator

## About

A TypeScript guard functions generator that produces strictly type safe readable TypeScript code.

## Run

```bash
nvm install 22
npm i
npm run --silent generate -- "./example.ts" > "example.guard.ts"
```

## Example

The file with the types:

```ts
// example.ts
export type User = {
  id: number;
  login: string;
  bio: {
    first: string;
    last: string;
  };
};

export type Post = {
  title: string;
  text: string;
  link?: string;
  published: boolean;
  author: User;
};
```

Running the generator on it:

```bash
npm run --silent generate -- "./example.ts" > "example.guard.ts"
```

This is the output with a readable and strictly type safe TS guard:

```ts
// example.guard.ts
import { type User, type Post } from "./example.ts";
type SafeShallowShape<Type> = {
  [_ in keyof Type]?: unknown;
};

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
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  const {
    title,
    text,
    link,
    published,
    author,
  }: SafeShallowShape<Post> = root;
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
  ensureType<Post>({
    title,
    text,
    link,
    published,
    author,
  });
  return true;
}
```

And this is what `esbuild` minifies it into (formatted for readability):

```js
// example.guard.min.js
function i(e) {}
export function isUser(e) {
  if (!(typeof e == "object" && e !== null)) return !1;
  const { id: n, login: r, bio: t } = e;
  if (
    typeof n != "number" ||
    typeof r != "string" ||
    !(typeof t == "object" && t !== null)
  )
    return !1;
  const { first: f, last: o } = t;
  return typeof f != "string" || typeof o != "string" ? !1 : !0;
}
export function isPost(e) {
  if (!(typeof e == "object" && e !== null)) return !1;
  const { title: n, text: r, link: t, published: f, author: o } = e;
  return typeof n != "string" ||
    typeof r != "string" ||
    !(t === void 0 || typeof t == "string") ||
    typeof f != "boolean" ||
    !isUser(o)
    ? !1
    : !0;
}
```

As you can see, esbuild nicely merges all the `if`s for the same set of properties into just one combined check.

## Architecture

This tool is simple if not trivial. The code generator uses the TypeScript public API to emit the valid TS code. The type parser uses the TypeScript public API too to walk the type graph.

What this tool does in its own way is using an intermediate type representation that interfaces the generator with the type parser (see `TypeModel` type). The parser produces a model object that has no trace of the `ts.*` structures in it. This model object then is fed into the generator to actually produce the resulting TS code. This way both subsystems can be developed and tested independently. This resembles very much the `ViewModel` approach from the MVC web frameworks.

## Limitations

Expects `strict: true`, otherwise every type is nullable which defends the purpose.

Avoid trivial aliases like `type X = Y` as TypeScript erases the information about that `X` is an alias to `Y` and they effectively become the same type. This produces extra code for `X` where it would be just a shared guard function like `const isX = isY` or `function isX(…) { return isY() }`.

## Tools used

- Foundational [ts-ast-viewer.com](https://ts-ast-viewer.com/)
- Useful [esbuild minifier](https://esbuild.github.io/try/)

## Prior art

- Inspiring [ts-auto-guard](https://github.com/rhys-vdw/ts-auto-guard)
- Groundbreaking [ts-runtime-checks](https://github.com/GoogleFeud/ts-runtime-checks)
- Impressive [typia](https://github.com/samchon/typia)

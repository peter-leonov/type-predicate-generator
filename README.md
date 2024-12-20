# TypeScript Type Predicate Generator

A.k.a type guard generator.

## About

A TypeScript [type predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) generator that produces strictly type safe readable and extremely fast TypeScript code.

Yep, the type predicates it generates are themselves strictly type checked by TS that guarantees that the checked value satisfies the expected type.

## Status

Alpha. Most of the key distinctive features are proven to work, but some essential features are still be missing (see [Known Limitations](#known-limitations)).

## Run

```bash
nvm install 22
npm i
npm run --silent generate -- "./example.ts" > "example.guard.ts"
```

## Why

It's a simple, easy to integrate tool that does only one thing and does it well: generates type safe and fast code ready to use right away. The implmentation is near trivial, it uses minimal TypeScript public API surface thus is easy to update to keep up with changes in TS itself.

Experience shows that many teams can remain hesitant to introduce a runtime type checker because of many reasons. The main two have been speed (some checkers bring a whole runtime engine with them) and reliability (the produced code is invisible and hard to fix).

To account for the above this generator emits explicitly readable code that is easy to audit and support. The produced code is as fast as if manually written and minifies really well. This all is heavily inspired by code generators from other languages.

## Pros

1. The produced code is type safe
1. The produced code is as fast as it gets
1. The produced code is readable and easy to modify in case you need to
1. Does not require any runtime or compile time dependencies
1. It's bundler agnostic as it outputs plain TS and does not rely on `tsc` plugins
1. The bundle size cost is 100% predictable
1. Zero performance cost in development: run once and forget, no recompilations
1. Safe to upgrade: if the produced code changes you'll see it in the PR
1. Virtually cannot break as the produced code is checked into your repository
1. Reliable: the tool rejects the types it cannot cover 100%
1. Easy to debug: the stacktrace points exactly at where the bug is (if any)
1. No vendor lock-in: any tool that works with TS can be used instead

Cons

These are by desing, fixing them would affect the pros:

1. Compared to `tsc` plugins it requires a separate build step
1. Compared to `tsc` plugins it reads a dedicated file and produces a file

These are temporary limitations:

1. Does not support extended schema verification: mostly to stay simple and fast to evolve while in beta. It's trivial to add more value checkers with the current design.
1. Does not produce error messages. As the errors happen really rarely in production the plan is to generate the error reporters separately and load them on demand. Error reporters are usually more versitile and don't minify that well as the code has to carry the context around and check produce a custom message for every property. The current workaround is to either simply stringify the falsy value or load a third party runtime schema chacker on error.
1. Does not support generics atm, but designed with them in mind, so coming soon.

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

## Known Limitations

Arrays are yet to be supported.

Anonymous object types in unions and arrays are coming soon as they require a bit more thinking on how to make it both type safe and readable. A good workaround is to extract those into separate types and use references:

```ts
// instead of
type X = {
  union: { a: string } | { b: number };
};
// use
type A = { a: string };
type B = { b: number };
type X = {
  union: A | B;
};
```

Expects `strict: true`, otherwise every type is nullable which defends the purpose.

Avoid trivial aliases like `type X = Y` as TypeScript erases the information about that `X` is an alias to `Y` and they effectively become the same type. This produces extra code for `X` where it would be just a shared predicate function like `const isX = isY` or `function isX(…) { return isY() }`.

## Prior art

- Inspiring [ts-auto-guard](https://github.com/rhys-vdw/ts-auto-guard)
- Groundbreaking [ts-runtime-checks](https://github.com/GoogleFeud/ts-runtime-checks)
- Impressive [typia](https://github.com/samchon/typia)

## Contributing

### TODO

1. Support lists
1. Support tuples
1. Implement installing as a CLI
1. Implement a dynamic demo ([1](https://ts-ast-viewer.com/))
1. Generate unit tests with example data

### Architecture

This tool is simple if not trivial. The code generator uses the TypeScript public API to emit the valid TS code. The type parser uses the TypeScript public API too to walk the type graph.

What this tool does in its own way is using an intermediate type representation that interfaces the generator with the type parser (see `TypeModel` type). The parser produces a model object that has no trace of the `ts.*` structures in it. This model object then is fed into the generator to actually produce the resulting TS code. This way both subsystems can be developed and tested independently. This resembles very much the `ViewModel` approach from the MVC web frameworks.

### Design

Moto: check JSON data from APIs 100% type safe and at blazing speed.

Non-goals:

- Cover non-serializable types: at this stage of TS adoption most of the codebases that care about type safety have developed a safe "bubble" that only lets in checked values. This mainly means that the values get into the "bubble" throught a call to `JSON.parse()` that produces plain old data objects, this is where the 99% of type checking is required.
- Cover a sophisticated schema verification protocol. While possible, the idea is to get an `unknown` type and turn it first into something type safe (safely assignable to a given type). The resulting value can get safely verified against a more sophisticated schema as a second step. Still, for simple checks the doors are open, but any non context free checks should be implemneted using a higher level schema verification generator that is not TypeScript specific.
- Cover complex computed types or expensive JS values, except for generics (generics are neat and easy to cover in the current architecture).

Guiding principles:

- Type safety and correctness first.
- Performance second.
- The generated code should be readable and easy to modify by hand if needed.
- Common minifiers should be able to produce efficient and compact code
- KISS the generator to address the bugs and TypeScript updates quicker
- Use monomorphised functions to keep the JIT happy

Nice to haves:

- Languare server plugin / VS Code extension that "just" generates the predicate next to the type.

### Tools used

- Foundational [ts-ast-viewer.com](https://ts-ast-viewer.com/)
- Useful [esbuild minifier](https://esbuild.github.io/try/)

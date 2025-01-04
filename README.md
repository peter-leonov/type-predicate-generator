# TypeScript Type Predicate Generator

Check JSON data from APIs 100% type safe and at blazing speed.

Give it a try in the [Playground](https://peter-leonov.github.io/typescript-predicate-generator/).

## About

A TypeScript code generator that produces strictly type safe readable and extremely fast TypeScript [type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates).

Yep, the resulting type predicates (a.k.a type guards) are themselves strictly type safe and checked by TS as part of your project setup.

## Status

Beta. Most of the key distinctive features are proven to work, but there are still some rough edges to polish (see [Known Limitations](#known-limitations) and [TODO](#todo)).

## Install

```bash
npm i -D generate-type-guards
```

## Use

```bash
npx type-predicate-generator ./types.ts
```

Generates `types_guards.ts` with the code like in the example [below](#example).

## Why

It's a simple, easy to integrate tool that does only one thing and does it well: generates type safe and fast code ready to use right away. The implmentation is near trivial, it uses minimal TypeScript public API surface thus is easy to update to keep up with the constant changes in TS itself.

Experience shows that many teams can remain hesitant to introduce a runtime type checker because of various reasons. The main two have been speed (some checkers bring a whole runtime rule engine with them) and reliability (the produced code or a rule set is a black box that is hard to assess).

To account for the above this generator emits explicitly readable code that is easy to audit and support. The produced code is as fast as if it's manually written and minifies really well. This all is heavily inspired by code generators from other languages.

## Pros

1. The produced code is type safe and gets checked by your TS setup
1. The produced code is as fast as it gets: no extra reads, calls, comparisons
1. The produced code is readable, linear and easy to modify if needed
1. Does not require any runtime or compile time dependencies
1. It's bundler agnostic as its output is plain TS (no `tsc` plugins required)
1. The bundle size cost is 100% visible and predictable
1. Safe to upgrade: if the produced code changes you'll see it in the PR
1. Zero performance cost in development: run once and forget
1. Full IDE support: jump to definition just works
1. Cannot unexpectedly break as the produced code is static and checked into your repository
1. Reliable: the tool rejects the types it cannot cover 100%
1. Easy to debug and fix: the stacktrace points exactly at where the bug is
1. No vendor lock-in: any tool that works with TS can be used instead
1. Unix-way: relies on other tools for minification, dead code elimination, etc

## Cons

These are by desing, fixing them would affect the [Pros](#pros):

1. Compared to `tsc` plugins it requires a separate build step
1. Compared to `tsc` plugins it reads a file and produces a file

See [Known Limitations](#known-limitations) for more on low level missing bits.

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
  list: Array<number | string>;
};
```

Running the generator on it:

```bash
npx type-predicate-generator ./example.ts
```

This is the output with a readable and strictly type safe TS guard:

```ts
// example_guards.ts
import { type User, type Post } from "./example.ts";

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
  const {
    title,
    text,
    link,
    published,
    author,
    list,
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
```

And this is what `esbuild` minifies it into (formatted for readability):

```js
// example_guards.min.js
const u = Array.isArray;
function p(e) {}
export function isUser(e) {
  if (!(typeof e == "object" && e !== null)) return !1;
  const { id: s, login: r, bio: t } = e;
  if (
    typeof s != "number" ||
    typeof r != "string" ||
    !(typeof t == "object" && t !== null)
  )
    return !1;
  const { first: n, last: f } = t;
  return typeof n != "string" || typeof f != "string" ? !1 : !0;
}
export function isPost(e) {
  function s(o) {
    return typeof o == "string" || typeof o == "number" ? !0 : !1;
  }
  if (!(typeof e == "object" && e !== null)) return !1;
  const {
    title: r,
    text: t,
    link: n,
    published: f,
    author: l,
    list: i,
  } = e;
  return typeof r != "string" ||
    typeof t != "string" ||
    !(n === void 0 || typeof n == "string") ||
    typeof f != "boolean" ||
    !isUser(l) ||
    !(u(i) && i.every(s))
    ? !1
    : !0;
}
```

As you can see, esbuild nicely merges all the `if`s for the same set of properties into just one combined check.

## Known Limitations

Most of the below is gonna be eventually fixed.

1. No support for extended schema verification. This is mostly to stay simple and fast to evolve while in alpha/beta. It's trivial to add more value checkers with the current design.

1. Does not produce error messages yet. As the errors happen really rarely in production the plan is to generate the error reporters separately and load them on demand. Error reporters are usually more versitile and don't minify that well as the code has to carry the context around and check produce a custom message for every property. The current workaround is to either simply stringify the falsy value or load a third party runtime schema checker on error.

1. No support for generics atm, but the code is designed with them in mind, so also coming soon.

1. Anonymous object types in unions are not supported.

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

See more here [#1](https://github.com/peter-leonov/typescript-predicate-generator/issues/1).

1. Expects `strict: true`, otherwise every type is nullable which defends the purpose.

1. Avoid trivial aliases like `type X = Y` as TypeScript erases the information about that `X` is an alias to `Y` and they effectively become the same type. This produces duplicate code for `X` where it would be just a shared predicate function like `const isX = isY` or `function isX(…) { return isY() }`. It is possible to fix by considering AST nodes in addition to symbols and type objects, but it's not a common use case, so for now not handled properly.

## Prior art

- Inspiring [ts-auto-guard](https://github.com/rhys-vdw/ts-auto-guard)
- Groundbreaking [ts-runtime-checks](https://github.com/GoogleFeud/ts-runtime-checks)
- Impressive [typia](https://github.com/samchon/typia)

## Contributing

### TODO

Feel free to pick any of the tasks here or in the GH issues.

- [x] Support lists
- [ ] Support tuples
- [x] Report TS errors before running
- [ ] Report errors nicely
- [x] Implement installing as a CLI
- [ ] Implement a dynamic demo ([1](https://ts-ast-viewer.com/))
- [ ] Generate unit tests with example data

### Architecture

This tool is simple if not trivial. The code generator uses the TypeScript public API to emit valid TS code. The type parser uses the TypeScript public API too to walk the type graph.

What this tool does in its own way is using an intermediate type representation that interfaces the generator with the type parser (see `TypeModel` type in [generator/src/model.ts](generator/src/model.ts)). The type parser produces a model object that has no trace of the `ts.*` structures in it. This model object then is fed to the generator to actually produce the resulting TS code. This way both subsystems can be developed and tested independently. This resembles the viewmodel from [MVVM](https://en.wikipedia.org/wiki/Model–view–viewmodel) and in general promotes clean domain boundaries inspired by [DDD](https://en.wikipedia.org/wiki/Domain-driven_design).

### Design

Goals:

- Check JSON data from APIs 100% type safe and fast
- Make the tool easy to use and maintain both for the tool users and the tool developers

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
- Use monomorphised functions to keep the JIT happy (a.k.a generate same helpers for each unique tipe)

Nice to haves:

- Languare server plugin / VS Code extension that "just" generates the predicate next to the type.

### Tools used

- Foundational [ts-ast-viewer.com](https://ts-ast-viewer.com/)
- Useful [esbuild minifier](https://esbuild.github.io/try/)

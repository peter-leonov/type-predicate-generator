# TypeScript Type Predicate Generator

Check JSON data from APIs 100% type safe, unit tested and at blazing speed!

Give it a try in the [Playground](https://peter-leonov.github.io/type-predicate-generator/).

## About

- **Safe**: generates strictly typed code and unit tests for it
- **Fast**: ~100 times faster than pure runtime solutions
- **Lightweight**: no runtime dependencies
- **Portable**: supports all the runtimes
- **Reliable**: the generated code readable

A TypeScript [type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) generator that produces strictly type safe `*.ts` files with readable and extremely fast TypeScript code suitable to use in the browser, a Node.js / Deno / Bun app, Cloudflare workers and CloudFront edge functions.

## How to use

```bash
npm i -D generate-type-guards
npx type-predicate-generator --unitTests src/types.ts
```

Generates `src/types_guards.ts` and `src/types_guards.test.ts` with the predicate code for all the exported types in `src/types.ts` (see example output [below](#example)).

## Example

The source file with the types:

```ts
// example.ts
export type User = {
  id: number;
  login: string;
  email?: string;
  address: {
    street: string;
    house: number;
  };
};
```

Running the generator on it:

```bash
npx type-predicate-generator ./example.ts
```

This is the output with a readable and strictly type safe TS guard:

```ts
// example_guards.ts
import { type User } from "./example";
type SafeShallowShape<Type> = {
  [_ in keyof Type]?: unknown;
};
const safeIsArray: (v: unknown) => v is unknown[] = Array.isArray;
export function isUser(root: unknown): root is User {
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  root satisfies {};
  const { id, login, email, address }: SafeShallowShape<User> = root;
  if (!(typeof id === "number")) {
    return false;
  }
  if (!(typeof login === "string")) {
    return false;
  }
  if (!(typeof email === "undefined" || typeof email === "string")) {
    return false;
  }
  if (!(typeof address === "object" && address !== null)) {
    return false;
  }
  address satisfies {};
  const { street, house }: SafeShallowShape<User["address"]> =
    address;
  if (!(typeof street === "string")) {
    return false;
  }
  if (!(typeof house === "number")) {
    return false;
  }
  ({
    id,
    login,
    email,
    address: {
      street,
      house,
    },
  }) satisfies User;
  return true;
}
```

Play with it in the [Playground](https://peter-leonov.github.io/type-predicate-generator/?s=PTAEBUAsEsGdTqAhgO1AUwB5ILYAcAbdUAFwE890AaAKBFEKTNAHdoTIETkAnAewCuKACag+PBklgliZQRL4sUAOho0secd3KVQAVVjoJAXlABvGqATCAXKBQCcAIyMBuS6AJ8A5tBR3pHj9vdyt0HCRoAgB+AJIglBCPJGFhHnRYWDsLKytA9HQSOISk3NBIQUM7B2c3DwBfd0aaIA).

This is what `esbuild --minify` reduces it to (formatted for readability):

```js
// example_guards.min.js
function o(e) {
  if (!(typeof e == "object" && e !== null)) return !1;
  let { id: n, login: f, email: r, address: s } = e;
  if (
    typeof n != "number" ||
    typeof f != "string" ||
    !(typeof r > "u" || typeof r == "string") ||
    !(typeof s == "object" && s !== null)
  )
    return !1;
  let { street: t, house: a } = s;
  return !(typeof t != "string" || typeof a != "number");
}
```

As you can see, esbuild nicely merges all the `if`s for the same set of properties into just one combined check.

The tests generated for the predicate look like this. They are not covering all possible combinations as it's growing exponential, instead the test generator yields each valid value for each field at least once while other values stay the same:

```ts
// example_guards.test.js
import { expect, describe, it } from "vitest";
import { isUser } from "./example_guards";
const invalidValue: any = Symbol("invalidValue");
const valid_User = [
  {
    id: 0,
    login: "",
    email: undefined,
    address: { street: "", house: 0 },
  },
  {
    id: 42,
    login: "",
    email: undefined,
    address: { street: "", house: 0 },
  },
  {
    id: 42,
    login: "string",
    email: undefined,
    address: { street: "", house: 0 },
  },
  {
    id: 42,
    login: "string",
    email: "",
    address: { street: "", house: 0 },
  },
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
  { id: 0, email: undefined, address: { street: "", house: 0 } },
  {
    id: 0,
    login: "",
    email: invalidValue,
    address: { street: "", house: 0 },
  },
  { id: 0, login: "", email: undefined, address: invalidValue },
  { id: 0, login: "", email: undefined, address: null },
  {
    id: 0,
    login: "",
    email: undefined,
    address: { street: invalidValue, house: 0 },
  },
  { id: 0, login: "", email: undefined, address: { house: 0 } },
  {
    id: 0,
    login: "",
    email: undefined,
    address: { street: "", house: invalidValue },
  },
  { id: 0, login: "", email: undefined, address: { street: "" } },
  { id: 0, login: "", email: undefined },
];
describe("User", () => {
  it.for(valid_User)("valid", (value: unknown) => {
    expect(isUser(value)).toBe(true);
  });
  it.for(invalid_User)("invalid", (value: unknown) => {
    expect(isUser(value)).toBe(false);
  });
});
```

## Motivation

Mainly safety.

Experience shows that many teams can remain hesitant to introduce a runtime type checker because of various reasons. The main two have been speed (some checkers bring a whole runtime rule engine with them) and reliability (the produced code or a rule set is a black box that is hard to assess).

To account for the above this generator emits explicitly readable code that is easy to audit and support. The produced code is as fast as if it's manually written and minifies really well. This all is heavily inspired by code generators from other languages.

Yep, the resulting type predicates (a.k.a type guards) are themselves strictly type safe and get checked and compiled as part of your project setup next to your application code.

As a bonus, to verify that the guards work properly the tool also produces a set of unit tests next to the guard file that you can run as part of your test suite in CI.

## Pros

1. The produced code is type safe (using the [satisfies operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator)) and gets checked by your TS setup
1. The produced code is as fast as it gets: no extra reads, calls, comparisons
1. The produced code is readable, linear and easy to modify if needed
1. Does not require any runtime or compile time dependencies
1. It's bundler agnostic as its output is plain TS (no `tsc` plugins required)
1. The bundle size cost is 100% visible and predictable
1. Supports environments without `eval()` (such as CloudFront and Cloudflare JS runtimes)
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
1. Compared to `tsc` plugins all the checked types must be explicitly exported

See [Known Limitations](#known-limitations) for more on low level missing bits.

## Known Limitations

Most of the below is gonna be eventually fixed.

1. With `exactOptionalPropertyTypes: true` you'd need to add `undefined` to the optional properties' types. For JSON API it's safe as JSON cannot encode `undefined` therefor a missing property always reads as `undefined`. This limitation is possible to fix but it's gonna make the predicate code exponentially more branchy, not sure if it's worth the effort.

1. No support for extended schema verification. This is mostly to stay simple and fast to evolve while in alpha/beta. It's trivial to add more value checkers with the current design.

1. To also generate type predicates for imported types simply reexport them using type export:

```ts
import { ExternalType } from "some-lib";

// Like this. Please not that this is a type only export.
// This is the only syntax supported atm.
export { type ExternalType };

export type MyType = {
  field1: ExternalType;
};
```

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

See more here [#1](https://github.com/peter-leonov/type-predicate-generator/issues/1).

1. Expects `strict: true`, otherwise every type is nullable which defends the purpose.

1. Avoid trivial aliases like `type X = Y` as TypeScript erases the information about that `X` is an alias to `Y` and they effectively become the same type. This produces duplicate code for `X` where it would be just a shared predicate function like `const isX = isY` or `function isX(…) { return isY() }`. It is possible to fix by considering AST nodes in addition to symbols and type objects, but it's not a common use case, so for now not handled properly.

1. Does not generate tests for recursive types. It's still possible to do, but a bit cumbersome to implement robustly. The main challenge is to teach Combinator to produce a safe valid sentinel value that terminates the recursion. This again should be done at the type level, not the Combinator itself therefor requiring to hack deeper into TS type system internals.

## Prior art

- Inspiring [ts-auto-guard](https://github.com/rhys-vdw/ts-auto-guard)
- Groundbreaking [ts-runtime-checks](https://github.com/GoogleFeud/ts-runtime-checks)
- Impressive [typia](https://github.com/samchon/typia)

## Contributing

After reading below please feel free to pick any of the [issues](https://github.com/peter-leonov/type-predicate-generator/issues). We can always pair on it!

### Architecture

This tool is simple if not trivial. The code generator uses the TypeScript public API to emit valid TS code. The type parser uses the TypeScript public API too to walk the type graph.

What this tool does in its own way is using an intermediate type representation that interfaces the generator with the type parser (see `TypeModel` type in [generator/src/model.ts](generator/src/model.ts)). The type parser produces a model object that has no trace of the `ts.*` structures in it. This model object then is fed to the generator to actually produce the resulting TS code and to the tests generator to produce unit tests. This way both subsystems can be developed and tested relatively independently. This resembles the viewmodel from [MVVM](https://en.wikipedia.org/wiki/Model–view–viewmodel) and in general promotes clean domain boundaries inspired by [DDD](https://en.wikipedia.org/wiki/Domain-driven_design).

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

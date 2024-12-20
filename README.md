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

export type Car = {
  brand: string;
};

export type MyUser = {
  optional?: number;
  // either: number | boolean;
  nested: {
    foo: string;
  };
  name: string;
  age: number;
  car: Car;
};
```

Running the generator on it:

```bash
npm run --silent generate -- "./example.ts" > "example.guard.ts"
```

This is the output with a readable and strictly type safe TS guard:

```ts
// example.guard.ts

import { type Car, type MyUser } from "./example.ts";

type SafeShallowShape<Type> = {
  [_ in keyof Type]?: unknown;
};

function ensureType<T>(_: T) {}

export function isCar(root: unknown): root is Car {
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  const { brand }: SafeShallowShape<Car> = root;
  if (!(typeof brand === "string")) {
    return false;
  }
  ensureType<Car>({
    brand,
  });
  return true;
}

export function isMyUser(root: unknown): root is MyUser {
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  const {
    optional,
    nested,
    name,
    age,
    car,
  }: SafeShallowShape<MyUser> = root;
  if (!(optional === undefined || typeof optional === "number")) {
    return false;
  }
  if (!(typeof nested === "object" && nested !== null)) {
    return false;
  }
  const { foo }: SafeShallowShape<MyUser["nested"]> = nested;
  if (!(typeof foo === "string")) {
    return false;
  }
  if (!(typeof name === "string")) {
    return false;
  }
  if (!(typeof age === "number")) {
    return false;
  }
  if (!isCar(car)) {
    return false;
  }
  ensureType<MyUser>({
    optional,
    nested: {
      foo,
    },
    name,
    age,
    car,
  });
  return true;
}
```

And this is what `esbuild` minifies it into (formatted for readability):

```js
// example.guard.min.js

function u(e) {}
export function isCar(e) {
  if (!(typeof e == "object" && e !== null)) return !1;
  const { brand: n } = e;
  return typeof n != "string" ? !1 : !0;
}
export function isMyUser(e) {
  if (!(typeof e == "object" && e !== null)) return !1;
  const { optional: n, nested: r, name: t, age: f, car: a } = e;
  if (
    !(n === void 0 || typeof n == "number") ||
    !(typeof r == "object" && r !== null)
  )
    return !1;
  const { foo: o } = r;
  return typeof o != "string" ||
    typeof t != "string" ||
    typeof f != "number" ||
    !isCar(a)
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

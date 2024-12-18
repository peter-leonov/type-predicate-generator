# TypeScript Type Guard Generator

## About

A generator for type safe TypeScript type guard function.

## Run

```console
nvm install 22
npm i
node --experimental-strip-types src/index.mts example.ts
```

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

# TypeScript Type Guard Generator

## About

A generator for type safe TypeScript type guard function.

## Run

```console
node --experimental-strip-types src/index.mts example.ts
```

## Architecture

This tool is simple if not trivial. The code generator uses the TypeScript public API to emit the valid TS code. The type parser uses the TypeScript public API too to walk the type graph.

What this tool does in its own way is using an intermediate type representation that interfaces the generator with the type parser (see `TypeModel` type). The parser produces a model object that has no trace of the `ts.*` structures in it. This model object then is fed into the generator to actually produce the resulting TS code. This way both subsystems can be developed and tested independently. This resembles very much the `ViewModel` approach from the MVC web frameworks.

## Tools used

- [https://ts-ast-viewer.com/]

## Prior art

- [https://github.com/rhys-vdw/ts-auto-guard]
- [https://github.com/GoogleFeud/ts-runtime-checks]
- [https://github.com/samchon/typia]

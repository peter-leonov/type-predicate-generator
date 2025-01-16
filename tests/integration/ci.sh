#!/usr/bin/env bash

set -eux -o pipefail

(
  cd ../../generator
  npm run build
)

npm i --no-audit

npx type-predicate-generator --help

rm -rf types_guards.ts types_guards.test.ts
npx type-predicate-generator --unitTests src/types.ts
npx esbuild --bundle --outfile=src/types_guards.min.js --minify "src/types_guards.ts"

rm -rf example_guards.ts example_guards.test.ts
npx type-predicate-generator --unitTests src/example.ts
npx esbuild --bundle --outfile=src/example_guards.min.js --minify "src/example_guards.ts"

rm src/unsupported1.stdout.txt src/unsupported1.stderr.txt
npx type-predicate-generator ./src/unsupported1.ts 1>src/unsupported1.stdout.txt 2>src/unsupported1.stderr.txt || true

rm src/unsupported2.stdout.txt src/unsupported2.stderr.txt
npx type-predicate-generator ./src/unsupported2.ts 1>src/unsupported2.stdout.txt 2>src/unsupported2.stderr.txt || true

npm run typecheck
CI=true npm test

npx prettier -w .

git diff --exit-code

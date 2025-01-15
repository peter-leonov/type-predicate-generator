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

rm src/unsupported.1.txt src/unsupported.2.txt
npx type-predicate-generator ./src/unsupported.ts 1>src/unsupported.1.txt 2>src/unsupported.2.txt || true

npm run typecheck
CI=true npm test

npx prettier -w .

git diff --exit-code
